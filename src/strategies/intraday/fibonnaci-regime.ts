import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType, AdvisorType } from '../../model/enums';
import { IExchangeService } from '../../services/IExchange-service';
import { BaseStrategy } from '../base-strategy';

export class FibonnaciRegimeStrategy extends BaseStrategy {
    constructor(public strat: IExchangeService, advisor: AdvisorType) {
        super(strat, advisor);
        this.strategyName = 'Template';
    }

    loadIndicators() {}

    async realtimeAdvice(candle: Candle) {}

    async advice() {
        // Get Periods -- turn into an indicator
        const { fetchPeriod, getHighLowForPeriod, getAverageForPeriod, getOHLCHistory } = this.candleStats;
        const fibPeriods = [2, 5, 8, 13];
        const fibCandles = fibPeriods.map((period) => {
            const { high, low, closeTime } = fetchPeriod(period);
            return { high, low, closeTime };
        });

        const high = fibCandles.reduce((p, c) => (p.high > c.high ? p : c)).high;
        const low = fibCandles.reduce((p, c) => (p.low < c.low ? p : c)).low;

        const highForLast21 = getHighLowForPeriod(21, true);

        const history = getOHLCHistory(5);

        const averageClose = getAverageForPeriod(5, 'close');

        // Can Trade after certain criteria met (sometimes you don;t want to trade straight away)
        this.checkTradeStatus(() => {
            return true;
        });

        /// Go Long
        if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
            if (this.candle.high > high && this.candle.low > low) this.tradeAdvisor.trade();
        }

        // Go Short
        if (this.tradeAdvisor.inTrade) {
            if (this.candle.low < low && this.candle.high < high) this.tradeAdvisor.trade();
        }
    }

    logStatus(advice: any): void {
        let enabled = this.canTrade ? 'YES' : 'NO';
        const usedIndicators = this.logger.displayIndicators();
        let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Enabled: ${enabled}. Strategy: ${usedIndicators} Profit: ${advice}`;
        this.consoleColour(message);
    }
}
