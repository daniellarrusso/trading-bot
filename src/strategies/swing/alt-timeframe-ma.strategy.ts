import { addIndicator } from '../../indicators/base-indicator';
import { AlternateTimeframe } from '../../model/alternate-timeframe';
import { CallbackDelay } from '../../model/callback-delay';
import { AdvisorType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Interval } from '../../model/interval-converter';
import { IExchangeService } from '../../services/IExchange-service';
import { BaseStrategy } from '../base-strategy';

export class AltTimeframeMAStrategy extends BaseStrategy {
    cci: Indicator;
    hr4: AlternateTimeframe;
    hr4fMa: Indicator;
    hr4SmA: Indicator;

    constructor(public strat: IExchangeService, advisor: AdvisorType) {
        super(strat, advisor);
        this.strategyName = 'Alt Timeframe MA Strategy';
    }

    loadIndicators() {
        this.cci = addIndicator('sniper-cci', { weight: 14, weights: [5, 35], name: 't3-cci' });
        this.logger.addIndicator(this.ema20);
        this.logger.addIndicator(this.sma50);
        this.hr4 = this.createAlternateTimeframe(new Interval('4h'));
        this.hr4fMa = this.hr4.createIndicator('ema', { weight: 20 });
        this.hr4SmA = this.hr4.createIndicator('sma', { weight: 50 });
    }

    async realtimeAdvice() {}

    async advice() {
        this.checkTradeStatus(() => {
            return this.tradeAdvisor.advisor.currentOrderStatus;
        });

        // await this.hr4.process(this.candle, this.backtestMode);
        const ema = this.hr4.indicators.find((i) => i.name === 'ema');

        if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
            if (this.ema20.result > this.sma50.result) {
                await this.tradeAdvisor.trade();
            }
        }
        if (this.tradeAdvisor.inTrade && this.canTrade) {
            if (this.ema20.result < this.sma50.result) {
                await this.tradeAdvisor.trade();
                this.delayStrat.start(new CallbackDelay(0, () => this.ema20.result < this.sma50.result));
            }
        }
    }

    logStatus(advice: any): void {
        let enabled = this.canTrade ? 'YES' : 'NO';
        const usedIndicators = this.logger.displayIndicators();
        let message = `${this.ticker.pair} PRICE: ${this.ticker.printPrice}. Enabled: ${enabled}. Strategy: ${usedIndicators} Profit: ${advice}`;
        this.consoleColour(message);
    }
}
