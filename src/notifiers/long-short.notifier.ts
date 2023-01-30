import { ChatGroups } from '../../keys';
import { addIndicator } from '../indicators/base-indicator';
import { IndicatorStrategy } from '../indicators/indicator-strategies/indicator-strategy';
import { MaCrossover } from '../indicators/indicator-strategies/ma-crossover';
import { BacktestAdvisor } from '../model/backtest-advisor';
import { Candle } from '../model/candle';
import { ActionType } from '../model/enums';
import { Indicator } from '../model/indicator';
import { Logger } from '../model/logger';
import { Strategy } from '../model/strategy';
import { TelegramBot } from '../model/telegram-bot';
import { Trader } from '../services/trader-service';
import { BaseStrategy } from '../strategies/base-strategy';

export class LongShortNotifier extends BaseStrategy {
  logger: Logger;
  rsi: Indicator;
  cci: Indicator;
  ewo: Indicator;
  sma: Indicator;
  smaLong: Indicator;
  maCrossover: IndicatorStrategy;
  telegram = new TelegramBot(ChatGroups.mainAccount);

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Elliot Wave Notifier - ' + strat.exchange.ticker.interval;
  }

  loadIndicators() {
    this.rsi = addIndicator('rsi', { weight: 14, name: 'RSI 14' });
    this.sma = addIndicator('sma', { weight: 50, name: 'RSI 14' });
    this.smaLong = addIndicator('sma', { weight: 200, name: 'RSI 14' });
  }

  public async realtimeAdvice(candle: Candle) {}

  async advice() {
    this.checkTradeStatus(() => {
      return this.ewo.result < 0;
    });

    // notify long
    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (this.ewo.result > 0) {
        this.tradeAdvisor.trade();
        if (!(this.tradeAdvisor.advisor instanceof BacktestAdvisor)) {
          this.notifyTelegramBot(
            `${this.strategyName}: Could go long on ${this.ticker.pair}. Current Price: ${this.candle.close}`
          );
        }
      }
    }
    // notify short
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      if (this.candle.close < this.smaLong.result) {
        this.tradeAdvisor.trade();
        if (!(this.tradeAdvisor.advisor instanceof BacktestAdvisor)) {
          this.notifyTelegramBot(
            `${this.strategyName}: Could go short on ${this.ticker.pair}. Current Price: ${this.candle.close}`
          );
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

  async notifyTelegramBot(message) {
    this.telegram.sendMessage(message);
  }
}
