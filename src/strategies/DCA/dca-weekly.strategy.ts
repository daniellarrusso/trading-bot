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

    loadIndicators() {
        // this.af = new AlternateTimeframe(new Interval('4h'), new BinanceService(this.strat.ticker));
        this.af.createIndicator('sma', { weight: 50 });
        this.af.createIndicator('ema', { weight: 20 });
        this.af = this.createAlternateTimeframe(new Interval('4h', 60 * 4), (tf: AlternateTimeframe) => {
            this.afSma = tf.createIndicator('sma', { weight: 50 });
            this.afEma = tf.createIndicator('ema', { weight: 20 });
        });
    }

    async realtimeAdvice(candle: Candle) {}

    async advice() {
        await this.af.process(this.candle);
        // Can Trade after certain criteria met (sometimes you don;t want to trade straight away)
        this.checkTradeStatus(() => {
            return true;
        });

        /// Go Long
        if (this.candle.green) {
            this.tradeAdvisor.trade(this.candle.close, 'buy');
        }

        // Go Short
        if (!this.candle.green) {
            this.tradeAdvisor.trade(this.candle.close, 'sell');
        }
    }

    logStatus(advice: any): void {
        let enabled = this.canTrade ? 'YES' : 'NO';
        let triggers = [];
        let displayTriggers = triggers.forEach((t) => ``);
        let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Enabled: ${enabled}. Strategy: ${displayTriggers} Profit: ${advice}`;
        this.consoleColour(message);
    }
}
