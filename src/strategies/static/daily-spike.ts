import { addIndicator } from '../../indicators/base-indicator';
import { CallbackDelay } from '../../model/callback-delay';
import { Candle } from '../../model/candle';
import { AdvisorType } from '../../model/enums';
import { LiveAdvisor } from '../../model/live-advisor';
import { OrderAdvisor } from '../../model/order-advisor';
import { IExchangeService } from '../../services/IExchange-service';
import { getDayOfWeekName } from '../../utilities/utility';
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

        const candleDay = this.candle.closeTime.getDay();

        if (this.tradeAdvisor.advisor instanceof OrderAdvisor) {
            if (candleDay !== this.order.day) {
                await this.cancelExistingOrder();
                const price = this.candle.close * 0.95;
                const res = await this.tradeAdvisor.createOrder(price, 'buy');
                this.order = { orderId: res.orderId, day: candleDay };
            }
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
        let message = `${this.ticker.pair} PRICE: ${this.candle.price}. OrderId: ${
            this.order.orderId
        }. Day: ${getDayOfWeekName(this.order.day)}`;
        this.consoleColour(message);
    }
}
