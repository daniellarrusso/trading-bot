import { addIndicator } from '../indicators/base-indicator';
import { CallbackDelay } from '../model/callback-delay';
import { Candle } from '../model/candle';
import { ActionType } from '../model/enums';
import { IExchangeService } from '../services/IExchange-service';
import { BaseStrategy } from './base-strategy';

export class TemplateStrategy extends BaseStrategy {
    constructor(exchange: IExchangeService) {
        super(exchange);
        this.strategyName = 'Test';
    }

    loadIndicators() {}

    async realtimeAdvice(candle: Candle) {}

    async advice() {
        // Get percentage increase

        // Can Trade after certain criteria met (sometimes you don't want to trade straight away)
        this.checkTradeStatus(() => {
            return true;
        });

        /// Alternate Timeframe
        if (!this.backtestMode && this.hasDailyCandles) {
            await this.getDailyCandles(this.pair, addIndicator('rsi', { weight: 14 }));
        }

        /// Go Long
        if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
            await this.tradeAdvisor.trade();
        }

        // Go Short
        if (this.tradeAdvisor.inTrade) {
            await this.tradeAdvisor.trade();
            this.delayStrat.start(new CallbackDelay(0));
        }
        // run in backTest
        if (this.backtestMode && this.hasDailyCandles) {
            await this.getDailyCandles(this.pair, addIndicator('rsi', { weight: 14 }));
        }
    }

    logStatus(advice: any): void {
        let enabled = this.canTrade ? 'YES' : 'NO';
        const usedIndicators = this.logger.displayIndicators();
        let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Enabled: ${enabled}. Indicators: ${usedIndicators} Profit: ${advice}`;
        this.consoleColour(message);
    }
}
