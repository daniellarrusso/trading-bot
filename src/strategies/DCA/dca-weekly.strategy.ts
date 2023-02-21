import { RSI } from '../../indicators/rsi';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Strategy } from '../../model/strategy';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class DCAWeeklytrategy extends BaseStrategy {
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

    /// Go Long
    if (this.candle.green) {
      this.tradeAdvisor.trade(this.candle.close, 'buy');
    }

    // Go Short
    if (!this.candle.green) {
      this.tradeAdvisor.trade(this.candle.close, 'sell');
    }
  }

  logStatus(advice: any): void {
    let enabled = this.canTrade ? 'YES' : 'NO';
    let triggers = [];
    let displayTriggers = triggers.forEach((t) => ``);
    let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Enabled: ${enabled}. Strategy: ${displayTriggers} Profit: ${advice}`;
    this.consoleColour(message);
  }
}
