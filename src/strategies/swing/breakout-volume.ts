import { addIndicator } from '../../indicators/base-indicator';

import { Candle } from '../../model/candle';
import { ActionType, AdvisorType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { IExchangeService } from '../../services/IExchange-service';
import { BaseStrategy } from '../base-strategy';

export class BreakoutVolumeStrategy extends BaseStrategy {
    ewo: Indicator;
    volumeMa: Indicator;
    cci: Indicator;
    sma200: Indicator;

    constructor(public strat: IExchangeService, advisor: AdvisorType) {
        super(strat, advisor);
        this.strategyName = 'Breakout Volume';
        this.hasDailyCandles = true;
    }

    loadIndicators() {
        /// Indicator examples
        this.ewo = addIndicator('ewo', { weight: 14, weights: [5, 35], name: 'ewo' });
        this.sma200 = addIndicator('sma', { weight: 200, name: 'sma200' });
        this.cci = addIndicator('sniper-cci', { weight: 14, input: 'close', inputType: 'heikin' });
        this.volumeMa = addIndicator('sma', { weight: 90, input: 'volume', inputType: 'candle' });
    }

    async realtimeAdvice(candle: Candle) {}

    async advice() {
        // Get percentage increase
        const volumeIncreasePercentage = this.returnPercentageIncrease(
            this.candle.volume,
            this.volumeMa.result
        );

        // Can Trade after certain criteria met (sometimes you don;t want to trade straight away)
        this.checkTradeStatus(() => {
            return true;
        });

        /// Go Long
        if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
            if (
                volumeIncreasePercentage > 130 &&
                this.candle.close > this.dailyCandles.lastCandle.high &&
                this.candle.green
            ) {
                // console.log('Volume breakout Upside');
                this.tradeAdvisor.trade();
            }
        }

        // Go Short
        if (this.tradeAdvisor.inTrade) {
            if (this.candle.close < this.dailyCandles.lastCandle.low) {
                // console.log('Volume breakout Downside');
                this.tradeAdvisor.trade();
            }
        }
    }

    logStatus(advice: any): void {
        let canTrade = `EWO: ${this.ewo.result}. CanTrade? ${this.canTrade ? 'YES' : 'NO'}`;
        let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Advisor ${canTrade}. Profit: ${advice}`;
        this.consoleColour(message);
    }
}
