import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';

import { IExchangeService } from '../../services/IExchange-service';

import { BaseStrategy } from '../base-strategy';

export class HeikinLongStrategy extends BaseStrategy {
  ewo: Indicator;
  volumeMa: Indicator;
  cci: Indicator;
  sma200: Indicator;
  majorCandle: Candle;
  longTriggered: boolean = false;
  buyTrigger: number = 0;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Heikin Long Strategy';
    this.hasDailyCandles = true;
  }

  loadIndicators() {
    this.ewo = addIndicator('ewo', { weight: 14, weights: [5, 35], name: 'ewo' });
    this.sma200 = addIndicator('sma', { weight: 200, name: 'sma200' });
    this.cci = addIndicator('sniper-cci', { weight: 14, input: 'close', inputType: 'heikin' });
    this.volumeMa = addIndicator('sma', { weight: 90, input: 'volume', inputType: 'candle' });
  }

  async realtimeAdvice(candle: Candle) {}

  async advice() {
    const volumeIncreasePercentage = this.returnPercentageIncrease(this.candle.volume, this.volumeMa.result);
    const longArray = [];
    longArray.push({ type: 'cci', result: this.cci.result > 0 && this.cci.result < 100 });
    longArray.push({ type: 'volume', result: volumeIncreasePercentage > 100 });
    longArray.push({ type: 'aboveSam', result: this.candle.close > this.sma200.result });
    longArray.push({ type: 'heikin', result: this.heikin.green });

    const trues = longArray.filter((a) => a.result).length;

    this.checkTradeStatus(() => {
      return this.ema20.result < this.sma50.result;
    });

    if (!this.backtestMode && this.hasDailyCandles) {
      await this.getDailyCandles(this.pair, addIndicator('rsi', { weight: 14 }));
    }
    if (!this.longTriggered && trues > 2) {
      this.longTriggered = true;
      this.buyTrigger = this.candle.high;
    }
    if (this.longTriggered && this.cci.result < 0) {
      this.longTriggered = false;
    }

    if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
      if (
        this.longTriggered &&
        this.candle.close > this.buyTrigger &&
        this.dailyCandles.indicator.result > 50
      ) {
        this.tradeAdvisor.trade();
      }
    }
    if (this.tradeAdvisor.inTrade) {
      if (this.dailyCandles.indicator.result < 45) {
        this.tradeAdvisor.trade();
      }
    }

    this.majorCandle = this.candle.candleSize > 1.8 && this.candle.green ? this.candle : this.majorCandle;
    // run in backTest
    if (this.backtestMode && this.hasDailyCandles) {
      await this.getDailyCandles(this.pair, addIndicator('rsi', { weight: 14 }));
    }
  }

  logStatus(advice: any): void {
    let canTrade = `EWO: ${this.ewo.result}. CanTrade? ${this.canTrade ? 'YES' : 'NO'}`;
    let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Advisor ${canTrade}. Profit: ${advice}`;
    this.consoleColour(message);
  }
}
