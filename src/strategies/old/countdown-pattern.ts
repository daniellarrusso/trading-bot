import { addIndicator } from '../../indicators/base-indicator';
import { AdvisorType } from '../../model/enums';
import { Indicator } from '../../model/indicator';

import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class CountdownPatternStrategy extends BaseStrategy {
    countdown: Indicator;
    atr: Indicator;
    buyTrigger: boolean = false;
    stopPrice: number;

    constructor(public strat: IExchangeService, advisor: AdvisorType) {
        super(strat, advisor);
        this.strategyName = 'Countdown Pattern Strategy';
    }

    loadIndicators() {
        this.countdown = addIndicator('countdown', {
            weight: 3,
            inputType: 'candle',
        });
        this.atr = addIndicator('atr', { weight: 14 });
    }

    async realtimeAdvice() {}

    async advice() {
        const countdownBuy = -10;
        const countdownSell = 10;

        this.checkTradeStatus(() => {
            return this.countdown.result < 10;
        });

        // BUY
        if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
            if (!this.buyTrigger && this.countdown.result < countdownBuy) {
                // buyTriggerSet
                this.buyTrigger = true;
            }
            if (this.buyTrigger && this.countdown.result > this.countdown.previousResult) {
                this.buyTrigger = false;
                this.stopPrice = this.candle.low - this.atr.result * 2;
                this.tradeAdvisor.trade();
            }
        }

        // SELL
        if (this.tradeAdvisor.inTrade) {
            if (this.countdown.result > countdownSell) {
                this.sell();
            }
        }
    }

    setStop(newStopPrice) {
        if (this.stopPrice > newStopPrice) return;
        this.stopPrice = newStopPrice;
    }

    sell(reason?: string) {
        const message = `${this.candle.pair} ${reason}`;
        if (reason) console.log(message);
        this.tradeAdvisor.trade();
    }

    resetParameters() {
        this.buyTrigger = false;
    }

    logStatus(advice: any): void {
        let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Countdown Indicator: ${this.countdown.result}. Advisor ${this.canTrade}. Trigger: ${this.buyTrigger} Profit: ${advice}`;
        this.consoleColour(message);
    }
    setHeikinColour(isGreen: boolean): string {
        return isGreen ? 'Green' : 'Red';
    }
}
