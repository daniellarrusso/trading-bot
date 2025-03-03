import { AlternateTimeframe } from '../model/alternate-timeframe';
import { CallbackDelay } from '../model/callback-delay';
import { Candle } from '../model/candle';
import { AdvisorType } from '../model/enums';
import { Indicator } from '../model/indicator';
import { IExchangeService } from '../services/IExchange-service';
import { BaseStrategy } from './base-strategy';

export class HeikinAshiStrategy extends BaseStrategy {
  hr4: AlternateTimeframe;
  hr4fMa: Indicator;
  hr4SmA: Indicator;
  constructor(exchange: IExchangeService, advisor: AdvisorType) {
    super(exchange, advisor);
    this.strategyName = 'Heikin Ashi Strategy';
  }

  loadIndicators() {

  }

  async realtimeAdvice(candle: Candle) { }

  async advice() {
    // Get percentage increase
    this.heikin;

    // Can Trade after certain criteria met (sometimes you don't want to trade straight away)
    this.setCanTrade(() => {
      return this.candle.close > this.ema20.result;
    });



    await this.hr4.process(this.candle);
    const bullish = this.hr4fMa.result > this.hr4SmA.result;

    /// Go Long
    if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
      if (this.ema20.result > this.sma50.result && bullish)
        await this.tradeAdvisor.trade();
    }

    // Go Short
    if (this.tradeAdvisor.inTrade) {
      if (this.ema20.result < this.sma50.result) {
        await this.tradeAdvisor.trade();
        this.delayStrat.start(new CallbackDelay(0));
      }
    }
  }

  logStatus(advice: any): void {
    let enabled = this.canTrade ? 'YES' : 'NO';
    const usedIndicators = this.logger.displayIndicators();
    let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Enabled: ${enabled}. Indicators: ${usedIndicators} Profit: ${advice}`;
    this.consoleColour(message);
  }
}
