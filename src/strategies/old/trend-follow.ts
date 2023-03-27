import { isJSDocThisTag } from 'typescript';
import { addIndicator } from '../../indicators/base-indicator';
import { CallbackDelay } from '../../model/callback-delay';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';

import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class TrendFollowStrategy extends BaseStrategy {
  sma: Indicator;
  atr: Indicator;
  rsiDifferences: number[] = [];
  stopLimit: number;
  profitTake: number;
  marketAbove = [];
  marketBelow = [];

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Trend Follow Strategy';
  }

  loadIndicators() {
    this.sma = addIndicator('sma', { weight: 20 });
    this.atr = addIndicator('atr', { weight: 30 });
  }

  async realtimeAdvice() {}

  async advice() {
    if (this.candle.close > this.sma.result) {
      this.marketAbove.push(this.candle.close - this.sma.result);
    } else {
      this.marketBelow.push(this.sma.result - this.candle.close);
    }

    this.checkTradeStatus(() => {
      return this.marketAbove.length > 5 && this.marketBelow.length > 5;
    });

    const trendIntensity =
      (this.marketAbove.length / (this.marketAbove.length + this.marketBelow.length)) * 100;

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (trendIntensity < 20) {
        this.tradeAdvisor.trade();
        this.stopLimit = this.candle.close - this.atr.result * 2;
        this.profitTake = this.candle.close + this.atr.result * 4;
      }
    }
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      if (this.candle.close > this.profitTake) {
        this.tradeAdvisor.trade();
      }

      if (this.candle.close < this.stopLimit) {
        this.tradeAdvisor.trade();
      }
      //    if (this.candle.close > this.profitTake) {
      //        this.tradeAdvisor.trade()
      //    }
    }
  }

  logStatus(advice: any): void {
    const heikin = ` ${
      this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
    } `;
    let nextAction = 'looking to: ';
    let canTrade = `RSI: - . CCI:  - READY? ${this.canTrade ? 'OK' : 'NO'}`;
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
