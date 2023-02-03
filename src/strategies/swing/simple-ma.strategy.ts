import { addIndicator } from '../../indicators/base-indicator';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Strategy } from '../../model/strategy';
import { BaseStrategy } from '../base-strategy';

export class SimpleMAStrategy extends BaseStrategy {
  cci: Indicator;

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Swing EWO MA Strategy';
  }

  loadIndicators() {
    this.cci = addIndicator('sniper-cci', { weight: 14, weights: [5, 35], name: 't3-cci' });
  }

  async realtimeAdvice() {}

  async advice() {
    this.checkTradeStatus(() => {
      return true;
    });

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      // this.tradeAdvisor.trade();
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
    let enabled = this.canTrade ? 'YES' : 'NO';
    const usedIndicators = this.logger.displayIndicators();
    let message = `${this.ticker.pair} PRICE: ${this.ticker.printPrice}. Enabled: ${enabled}. Strategy: ${usedIndicators} Profit: ${advice}`;
    this.consoleColour(message);
  }
}
