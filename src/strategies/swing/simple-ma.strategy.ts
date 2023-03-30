import { addIndicator } from '../../indicators/base-indicator';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { IExchangeService } from '../../services/IExchange-service';
import { BaseStrategy } from '../base-strategy';

export class SimpleMAStrategy extends BaseStrategy {
  cci: Indicator;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Swing EWO MA Strategy';
  }

  loadIndicators() {
    this.cci = addIndicator('sniper-cci', { weight: 14, weights: [5, 35], name: 't3-cci' });
    this.logger.addIndicator(this.ema20);
    this.logger.addIndicator(this.sma50);
  }

  async realtimeAdvice() {}

  async advice() {
    this.checkTradeStatus(() => {
      return true;
    });

    if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
      // this.tradeAdvisor.trade();
      if (this.ema20.result > this.sma50.result) {
        await this.tradeAdvisor.trade();
      }
    }
    if (this.tradeAdvisor.inTrade) {
      if (this.ema20.result < this.sma50.result) {
        await this.tradeAdvisor.trade();
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
