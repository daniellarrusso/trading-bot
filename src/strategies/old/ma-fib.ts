import { addIndicator } from '../../indicators/base-indicator';
import { BuyTrigger } from '../../model/buyTrigger';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Strategy } from '../../model/strategy';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class MAFibStrategy extends BaseStrategy {
  buyTrigger = new BuyTrigger();
  ema: Indicator;
  sma13: Indicator;
  smaLong: Indicator;
  smaLongSnapshot: number;

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Moving Average Strategy';
  }

  loadIndicators() {
    this.ema = addIndicator('ema', { weight: 8 });
    this.sma13 = addIndicator('sma', { weight: 13 });
    this.smaLong = addIndicator('sma', { weight: 55 });
  }

  async realtimeAdvice() {}

  async advice() {
    const downtrend = this.ema.result < this.sma13.result && this.ema.result < this.sma200.result;

    this.checkTradeStatus(() => {
      return downtrend;
    });

    const maCrossDown = this.ema20.result < this.sma50.result && this.ema20.previousResult > this.sma50.previousResult;
    const maCrossUp = this.ema20.result > this.sma50.result && this.ema20.previousResult < this.sma50.previousResult;

    if (this.canBuy && this.ema.result > this.sma200.result) {
      this.tradeAdvisor.trade();
    }

    if (this.canSell && this.candle.close < this.sma200.result) {
      this.tradeAdvisor.trade();
    }
  }

  logStatus(advice: any): void {
    const heikin = ` ${this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`} `;
    let nextAction = 'looking to: ';
    let canTrade = `RSI: - ${this.rsi14.result}. READY? ${this.canTrade ? 'OK' : 'NO'}`;
    nextAction += this.tradeAdvisor.actionType === ActionType.Long ? 'BUY' : 'SELL';
    let message = `${this.ticker.pair} PRICE: ${this.candle.price} ${heikin}. Advisor ${canTrade}. Profit: ${advice}`;
    this.consoleColour(message);
  }
  setHeikinColour(isGreen: boolean): string {
    return isGreen ? 'Green' : 'Red';
  }
}

function extractNearestHour(date: Date) {
  date.setMinutes(0, 0, 0);
  return date;
}
