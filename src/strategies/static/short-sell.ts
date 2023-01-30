import { addIndicator } from '../../indicators/base-indicator';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Strategy } from '../../model/strategy';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class ShortSellStrategy extends BaseStrategy {
  sellPrice: number;
  currVolume: number;
  prevVolume: number;
  atr: Indicator;

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Short Sell Strategy';
    this.sellPrice = this.strat.portfolio.shortLimit;
  }

  loadIndicators() {
    this.atr = addIndicator('atr', { weight: 14 });
  }

  async realtimeAdvice() {
    const stats = this.sellPrice;
  }

  async advice() {
    const { shortLimit, indicator } = this.strat.portfolio;
    this.sellPrice = shortLimit ? shortLimit : this[indicator]?.result;
    this.sellPrice -= this.atr.result;
    this.sellPrice = this.sellPrice.normalise(this.strat.exchange.ticker.tickSize);

    this.tradeAdvisor.actionType = ActionType.Short;

    this.checkTradeStatus(() => {
      return true;
    });

    if (this.tradeAdvisor.actionType === ActionType.Short && !this.backtestMode) {
      if (this.candle.close < this.sellPrice) this.tradeAdvisor.trade();
      if (this.rsi14.result < 69 && this.rsi14.previousResult > 69) this.tradeAdvisor.trade();
    }
  }

  logStatus(advice: any): void {
    const action = this.tradeAdvisor.actionType === 1 ? 'buy' : 'sell';
    let message = `${this.ticker.pair} will ${action} below: ${this.sellPrice}. Current Price: ${this.candle.price}. RSI: ${this.rsi14.result}`;
    this.consoleColour(message);
  }
  setHeikinColour(isGreen: boolean): string {
    return isGreen ? 'Green' : 'Red';
  }
}
