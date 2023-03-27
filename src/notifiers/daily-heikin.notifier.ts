import { ChatGroups } from '../../settings';
import { addIndicator } from '../indicators/base-indicator';
import { BacktestAdvisor } from '../model/backtest-advisor';
import { Candle } from '../model/candle';
import { ActionType } from '../model/enums';
import { Indicator } from '../model/indicator';
import { Logger } from '../model/logger';
import { TelegramBot } from '../model/telegram-bot';
import { IExchangeService } from '../services/IExchange-service';
import { BaseStrategy } from '../strategies/base-strategy';

export class DailyHeikinNotifier extends BaseStrategy {
  logger: Logger;
  rsi: Indicator;
  cci: Indicator;
  sma5: Indicator;
  sma35: Indicator;
  externalRSIIndicator: Indicator;
  ewo: number;
  shortLimit: number;
  longLimit: number;
  alternativeInterval: Candle;
  alternativeIntervalRequest: any;
  telegram = new TelegramBot(ChatGroups.mainAccount);
  hasRequested: any;
  called: number = 0;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Daily Heikin Notifier';
  }

  loadIndicators() {
    this.rsi = addIndicator('rsi', { weight: 14, name: 'RSI 14' });
    // EW Oscillator
    this.sma5 = addIndicator('sma', { weight: 5, name: 'sma5' });
    this.sma35 = addIndicator('sma', { weight: 35, name: 'sma35' });
    this.externalRSIIndicator = addIndicator('rsi', { weight: 14, name: 'extRSI' });
  }

  async realtimeAdvice(candle: Candle) {
    const dt = new Date();
    const day = dt.getDay();
    const hour = dt.getHours();
    if (
      !this.hasRequested ||
      this.hasRequested?.candles[this.hasRequested.candles.length - 1].time.getDay() != day
    ) {
      if (hour > 13) {
        this.called++;
        console.log(this.called);
        this.hasRequested = await this.strat.exchange.getHistoryWithIndicator(this.ticker.pair, '12h');
        const lastHeikin: Candle =
          this.hasRequested.heikin.candles[this.hasRequested.heikin.candles.length - 2];

        this.notifyTelegramBot(
          `${this.strategyName}: 12hr ${lastHeikin.green ? 'Long' : 'Short'} on ${this.ticker.pair}.
          Current Price: ${candle.close}`
        );
      }
    }
  }

  async advice() {
    this.ewo = this.returnPercentageIncrease(this.sma5.result, this.sma35.result);

    this.checkTradeStatus(() => {
      return true;
    });

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (this.heikin.green) {
        if (!(this.tradeAdvisor.advisor instanceof BacktestAdvisor)) {
          this.notifyTelegramBot(
            `${this.strategyName}: Going Long on ${this.ticker.pair}. Current Price: ${this.candle.close}`
          );
          this.tradeAdvisor.actionType = ActionType.Short;
          this.tradeAdvisor.trade();
        }
      }
    }
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      if (!this.heikin.green) {
        if (!(this.tradeAdvisor.advisor instanceof BacktestAdvisor)) {
          this.notifyTelegramBot(
            `${this.strategyName}: Going Short on ${this.ticker.pair}. Current Price: ${this.candle.close}`
          );
          this.tradeAdvisor.actionType = ActionType.Long;
          this.tradeAdvisor.trade();
        }
      }
    }
  }

  logStatus(advice: any): void {
    // logs strat specific info
    const heikin = ` ${
      this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
    } Heikin: ${this.heikin.close} `;
    let nextAction = 'looking to: ';
    nextAction += this.tradeAdvisor.actionType === ActionType.Long ? 'BUY' : 'SELL';
    let message = `${this.ticker.pair} PRICE: ${this.candle.close} ${heikin}. Advisor ${nextAction}. Profit: ${advice}`;
    this.consoleColour(message);
  }

  logColour(message: string, warning: boolean) {
    if (warning) {
      console.log('\u001b[' + 31 + 'm' + message + '\u001b[0m');
    } else {
      console.log('\u001b[' + 32 + 'm' + message + '\u001b[0m');
    }
  }

  async notifyTelegramBot(message) {
    this.telegram.sendMessage(message);
  }
}
