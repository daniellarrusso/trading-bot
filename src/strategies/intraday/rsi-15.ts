import { CallbackDelay } from '../../model/callback-delay';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { IExchangeService } from '../../services/IExchange-service';
import { BaseStrategy } from '../base-strategy';

export class RSI15trategy extends BaseStrategy {
  displayIndicators: Indicator[] = [];
  sellIntervals: number;
  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Template';
    this.hasDailyCandles = false;
  }

  loadIndicators() {
    this.logger.addIndicator(this.rsi14);
  }

  async realtimeAdvice(candle: Candle) {}

  async advice() {
    // Can Trade after certain criteria met (sometimes you don;t want to trade straight away)
    this.checkTradeStatus(() => {
      return true;
    });

    /// Go Long
    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (this.rsi14.result < 30) {
        this.tradeAdvisor.trade();
        this.sellIntervals = this.intervalsInDay;
      }
    }

    // Go Short
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      this.sellIntervals--;
      if (this.tradeAdvisor.profit > 3.5) {
        this.tradeAdvisor.trade();
      }
      if (this.sellIntervals < 1) {
        this.tradeAdvisor.trade();
        this.delayStrat.start(new CallbackDelay(96 * 2));
      }
    }
  }

  logStatus(advice: any): void {
    let enabled = this.canTrade ? 'YES' : 'NO';
    let message = `${this.ticker.pair} PRICE: ${
      this.candle.price
    }. Enabled: ${enabled}. Strategy: ${this.logger.displayIndicators()} Profit: ${advice}`;
    this.consoleColour(message);
  }
}
