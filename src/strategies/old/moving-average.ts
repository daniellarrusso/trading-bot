import { BuyTrigger } from '../../model/buyTrigger';
import { ActionType, AdvisorType } from '../../model/enums';

import { IExchangeService } from '../../services/IExchange-service';
import { BaseStrategy } from '../base-strategy';

export class MovingAverageStrategy extends BaseStrategy {
    buyTrigger = new BuyTrigger();
    constructor(public strat: IExchangeService, advisor: AdvisorType) {
        super(strat, advisor);
        this.strategyName = 'Moving Average Strategy';
    }

    loadIndicators() {}

    async realtimeAdvice() {}

    async advice() {
        this.checkTradeStatus(() => {
            return true;
        });

        const maCrossDown =
            this.ema20.result < this.sma50.result && this.ema20.previousResult > this.sma50.previousResult;
        const maCrossUp =
            this.ema20.result > this.sma50.result && this.ema20.previousResult < this.sma50.previousResult;

        if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
            this.buyTrigger.set(() => maCrossUp);
            this.buyTrigger.unset(() => maCrossDown);
            if (this.buyTrigger.active && this.rsi14.result < 60) {
                this.tradeAdvisor.trade();
                this.buyTrigger.active = false;
            }
        }
        if (this.tradeAdvisor.inTrade) {
            if (maCrossDown && this.candle.close < this.sma50.result) {
                this.tradeAdvisor.trade();
            }
        }
    }

    sell() {}

    logStatus(advice: any): void {
        const heikin = ` ${
            this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
        } `;
        let nextAction = 'looking to: ';
        let canTrade = `RSI: - ${this.rsi14.result}. READY? ${this.canTrade ? 'OK' : 'NO'}`;
        nextAction += !this.tradeAdvisor.inTrade ? 'BUY' : 'SELL';
        let message = `${this.ticker.pair} PRICE: ${this.candle.price} ${heikin}. Advisor ${canTrade}. Profit: ${advice}`;
        this.consoleColour(message);
    }
    setHeikinColour(isGreen: boolean): string {
        return isGreen ? 'Green' : 'Red';
    }
}

function extractNearestHour(date: Date) {
    date.setMinutes(0, 0, 0);
    return date;
}
