import { AlternateTimeframe } from '../../model/alternate-timeframe';
import { Candle } from '../../model/candle';
import { AdvisorType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Interval } from '../../model/interval-converter';
import { IExchangeService } from '../../services/IExchange-service';
import { BinanceService } from '../../services/binance-service';
import { BaseStrategy } from '../base-strategy';

export class DCAWeeklytrategy extends BaseStrategy {
    af: AlternateTimeframe;
    afSma: Indicator;
    afEma: Indicator;
    constructor(public strat: IExchangeService, advisor: AdvisorType) {
        super(strat, advisor);
        this.strategyName = 'Template';
    }

    loadIndicators() {}

    async realtimeAdvice(candle: Candle) {}

    async advice() {
        // Can Trade after certain criteria met (sometimes you don;t want to trade straight away)
        this.checkTradeStatus(() => {
            return true;
        });

        const isSundayClose = this.candle.time.getDay() === 0; // Sunday
        const lastWeeksClose =
            this.candleStats.candleHistory[this.candleStats.candleHistory.length - 8];

        const quantity =
            this.ema20.result > this.sma50.result &&
            this.sma50.result > (this.sma200?.result || this.sma50.previousResult)
                ? this.setQuantity(400)
                : this.setQuantity(300);
        /// Go Long
        if (isSundayClose && this.candle.close < lastWeeksClose.close) {
            this.tradeAdvisor.createOrder(this.candle.close, 'buy', quantity);
        }
        // Go Short
        if (isSundayClose && this.candle.close > lastWeeksClose.close) {
            this.tradeAdvisor.createOrder(this.candle.close, 'sell', quantity);
        }
    }

    setQuantity(currencyAmount: number): number {
        return currencyAmount / this.candle.close;
    }

    logStatus(advice: any): void {
        let enabled = this.canTrade ? 'YES' : 'NO';
        let triggers = [];
        let displayTriggers = triggers.forEach((t) => ``);
        let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Enabled: ${enabled}. Strategy: ${displayTriggers} Profit: ${advice}`;
        this.consoleColour(message);
    }
}
