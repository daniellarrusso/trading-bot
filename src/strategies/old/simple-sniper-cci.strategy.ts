import { addIndicator } from '../../indicators/base-indicator';
import { IndicatorStrategy } from '../../indicators/indicator-strategies/indicator-strategy';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Logger } from '../../model/logger';
import { Strategy } from '../../model/strategy';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class SimpleSniperCCIStrategy extends BaseStrategy {
  logger: Logger;
  rsi: Indicator;
  cci: Indicator;
  sma5: Indicator;
  sma35: Indicator;
  externalRSIIndicator: Indicator;
  buyTrigger: boolean;
  ewo: number;
  shortLimit: number;
  longLimit: number;
  maCrossover: IndicatorStrategy;
  heikin4hr: Candle;
  heikinRequest: any;

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Simple Cniper CCI Strategy';
  }

  loadIndicators() {
    this.cci = addIndicator('sniper-cci', { weight: 14, name: 'sniper-cci' });
    this.rsi = addIndicator('rsi', { weight: 14, name: 'RSI 14' });
    // EW Oscillator
    this.sma5 = addIndicator('sma', { weight: 5, name: 'sma5' });
    this.sma35 = addIndicator('sma', { weight: 35, name: 'sma35' });
    this.externalRSIIndicator = addIndicator('rsi', { weight: 14, name: 'extRSI' });
    // this.maCrossover = this.indicatorStrategies.add(new MaCrossover(20, 50, 200));
  }

  async realtimeAdvice(candle: Candle) {}

  async advice() {
    const { result: cci, previousResult: prevCci } = this.cci;
    this.ewo = this.returnPercentageIncrease(this.sma5.result, this.sma35.result);

    if (!this.heikinRequest) {
      this.heikinRequest = await this.strat.exchange.getHistoryWithIndicator('BTCUSDT', '4h');
    }

    const match: Candle = this.heikinRequest.heikin.candles.find((c) => c.time.getTime() == this.candle.time.getTime());
    this.heikin4hr = match !== undefined ? match : this.heikin4hr;

    this.checkTradeStatus(() => {
      return this.ewo < 0;
    });
    const t = this.maCrossover;

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (this.ewo > 0 && this.heikin4hr?.green) {
        this.tradeAdvisor.trade();
      }
      // if (this.candle.close > 13285 && !this.priceBuy) {
      //   this.tradeAdvisor.trade();
      //   this.priceBuy = true;
      // }
    }
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      if (this.ewo < 0 && !this.heikin4hr?.green) {
        this.tradeAdvisor.trade();
        // delay if RSI sell
        // this.delayStrat.start(new CallbackDelay(6, () => this.ewo > 0))
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
}
