import { addIndicator } from '../../indicators/base-indicator';
import { CallbackDelay } from '../../model/callback-delay';
import { Candle } from '../../model/candle';
import { LiveAdvisor } from '../../model/live-advisor';
import { IExchangeService } from '../../services/IExchange-service';
import { BaseStrategy } from '../base-strategy';

export class DailySpikeStrategy extends BaseStrategy {
    order = { day: -1, orderId: null };
    constructor(exchange: IExchangeService) {
        super(exchange);
        this.strategyName = 'Daily Spike';
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

        if (this.tradeAdvisor.advisor instanceof LiveAdvisor) {
            if (new Date().getDay() !== this.order.day) {
                this.cancelExistingOrder();
                const price = this.candle.close * 0.9;
                const order = await this.tradeAdvisor.trade(price, 'buy');
                this.order = { ...order, day: new Date().getDay() };
            }
        }

        // run in backTest
        if (this.backtestMode && this.hasDailyCandles) {
            await this.getDailyCandles(this.pair, addIndicator('rsi', { weight: 14 }));
        }
    }
    async cancelExistingOrder() {
        if (!this.order.orderId) return;
        const res = await this.exchange.cancelOrder(this.order.orderId);
        res;
    }

    logStatus(advice: any): void {
        let enabled = this.canTrade ? 'YES' : 'NO';
        const usedIndicators = this.logger.displayIndicators();
        let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Enabled: ${enabled}. Indicators: ${usedIndicators} Profit: ${advice}`;
        this.consoleColour(message);
    }
}
