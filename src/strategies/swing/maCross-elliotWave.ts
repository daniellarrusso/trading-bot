import { addIndicator } from '../../indicators/base-indicator';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Strategy } from '../../model/strategy';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class SwingEWOMAStrategy extends BaseStrategy {
  ewo: Indicator;

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Swing EWO MA Strategy';
  }

  loadIndicators() {
    this.ewo = addIndicator('ewo', { weight: 14, weights: [5, 35], name: 'ewo' });
  }

  async realtimeAdvice() {}

  async advice() {
    this.checkTradeStatus(() => {
      return this.ewo.result < 0;
    });

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (this.ema20.result > this.sma50.result) {
        this.tradeAdvisor.trade();
      }
    }
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      if (this.ema20.result < this.sma50.result) {
        this.tradeAdvisor.trade();
      }
    }
  }

  logStatus(advice: any): void {
    let message = `${this.ticker.pair} PRICE: ${this.candle.price}. EWO Indicator: ${this.ewo.result}. Advisor ${this.canTrade}. Profit: ${advice}. Time: ${this.candle.time}`;
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
