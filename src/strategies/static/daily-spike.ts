import { addIndicator } from '../../indicators/base-indicator';
import { CallbackDelay } from '../../model/callback-delay';
import { Candle } from '../../model/candle';
import { AdvisorType } from '../../model/enums';
import { LiveAdvisor } from '../../model/live-advisor';
import { OrderAdvisor } from '../../model/order-advisor';
import { IExchangeService } from '../../services/IExchange-service';
import { BaseStrategy } from '../base-strategy';

export class DailySpikeStrategy extends BaseStrategy {
    order = { day: -1, orderId: '' };
    constructor(exchange: IExchangeService, advisor: AdvisorType) {
        super(exchange, advisor);
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

        if (this.tradeAdvisor.advisor instanceof OrderAdvisor) {
            if (new Date().getDay() !== this.order.day) {
                await this.cancelExistingOrder();
                const price = this.candle.close * 0.9;
                const res = await this.tradeAdvisor.advisor.createOrder(price, 'buy');
                this.order.orderId = res['result'].txid[0];
                this.order.day = new Date().getDay();
            }
        }

        // run in backTest
        if (this.backtestMode && this.hasDailyCandles) {
            await this.getDailyCandles(this.pair, addIndicator('rsi', { weight: 14 }));
        }
    }
    async cancelExistingOrder() {
        try {
            await this.exchange.cancelOrder(this.order.orderId);
        } catch (error) {
            this.order.orderId = '';
        }
    }

    logStatus(advice: any): void {
        let enabled = this.canTrade ? 'YES' : 'NO';
        const usedIndicators = this.logger.displayIndicators();
        let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Enabled: ${enabled}. Indicators: ${usedIndicators} Profit: ${advice}`;
        this.consoleColour(message);
    }
}
