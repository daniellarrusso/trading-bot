import { addIndicator } from '../indicators/base-indicator';
import { Candle } from '../model/candle';
import { ActionType } from '../model/enums';
import { Strategy } from '../model/strategy';
import { BaseStrategy } from './base-strategy';

export class TemplateStrategy extends BaseStrategy {
  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Template';
  }

  loadIndicators() {}

  async realtimeAdvice(candle: Candle) {}

  async advice() {
    // Get percentage increase

    // Can Trade after certain criteria met (sometimes you don;t want to trade straight away)
    this.checkTradeStatus(() => {
      return true;
    });

    /// Alternate Timeframe
    if (!this.backtestMode && this.hasDailyCandles) {
      await this.getDailyCandles(this.pair, addIndicator('rsi', { weight: 14 }));
    }

    /// Go Long
    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      this.tradeAdvisor.trade();
    }

    // Go Short
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      this.tradeAdvisor.trade();
    }
    // run in backTest
    if (this.backtestMode && this.hasDailyCandles) {
      await this.getDailyCandles(this.pair, addIndicator('rsi', { weight: 14 }));
    }
  }

  logStatus(advice: any): void {
    let enabled = this.canTrade ? 'YES' : 'NO';
    const usedIndicators = this.logger.displayIndicators();
    let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Enabled: ${enabled}. Strategy: ${usedIndicators} Profit: ${advice}`;
    this.consoleColour(message);
  }
}
