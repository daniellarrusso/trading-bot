import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Strategy } from '../../model/strategy';
import { BaseStrategy } from '../base-strategy';

export class FibonnaciRegimeStrategy extends BaseStrategy {
    constructor(public strat: Strategy) {
        super(strat);
        this.strategyName = 'Template';
    }

    loadIndicators() { }

    async realtimeAdvice(candle: Candle) { }

    async advice() {
        // Get Periods -- turn into an indicator
        const { fetchPeriod, getHighLowForPeriod, getAverageForPeriod, getOHLCHistory } = this.candleStats;
        const fibPeriods = [2, 5, 8, 13];
        const fibCandles = fibPeriods.map(period => {
            const { high, low, closeTime } = fetchPeriod(period);
            return { high, low, closeTime }
        })

        const high = fibCandles.reduce((p, c) => p.high > c.high ? p : c).high;
        const low = fibCandles.reduce((p, c) => p.low < c.low ? p : c).low;

        const highForLast21 = getHighLowForPeriod(21, true);

        const history = getOHLCHistory(5)

        const averageClose = getAverageForPeriod(5, 'close');


        // Can Trade after certain criteria met (sometimes you don;t want to trade straight away)
        this.checkTradeStatus(() => {
            return true;
        });

        /// Alternate Timeframe
        if (!this.backtestMode && this.hasDailyCandles) {
            //   await this.getDailyCandles(this.pair, addIndicator('rsi', { weight: 14 }));
        }

        /// Go Long
        if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {

            if (this.candle.high > high && this.candle.low > low)
                this.tradeAdvisor.trade();
        }

        // Go Short
        if (this.tradeAdvisor.actionType === ActionType.Short) {
            if (this.candle.low < low && this.candle.high < high)
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
