import { addIndicator } from '../../indicators/base-indicator';
import { BacktestAdvisor } from '../../model/backtest-advisor';
import { CallbackDelay } from '../../model/callback-delay';
import { Candle } from '../../model/candle';
import { ActionType, AdvisorType } from '../../model/enums';

import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class WickScalpStrategy extends BaseStrategy {
    lastLow: number;
    prevLiveCandle: Candle;
    notified: boolean = false;

    constructor(public strat: IExchangeService, advisor: AdvisorType) {
        super(strat, advisor);
        this.strategyName = 'Wick Scalp Strategy';
    }

    loadIndicators() {}

    async realtimeAdvice(candle: Candle) {
        const aboveEma = candle.close > this.ema20.result;
        const candleCrossingUp = candle.close < this.lastLow && this.prevLiveCandle?.close > this.lastLow;
        if (candleCrossingUp && aboveEma && !this.notified) {
            console.log(
                `${this.candle.pair} is back above it's previous low of ${this.lastLow}. Check lower timeframes for entry`
            );
            this.notified = true;
        }
        this.prevLiveCandle = candle;
    }

    async advice() {
        this.notified = false;
        this.lastLow = this.candle.low;

        this.checkTradeStatus(() => {
            return this.candle.close > this.ema20.result;
        });

        if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
        }

        if (this.tradeAdvisor.inTrade) {
        }
    }

    logStatus(advice: any): void {
        const dailyH = this.heikin.green + ' ' + this.heikin.close;
        const heikin = ` ${
            this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
        } `;
        let nextAction = 'looking to: ';
        let canTrade = `RSI:  ${this.rsi14.result}. READY? ${this.canTrade ? 'OK' : 'NO'}`;
        nextAction += !this.tradeAdvisor.inTrade ? 'BUY' : 'SELL';
        let message = `${this.ticker.pair} PRICE: ${this.candle.price} ${heikin} Dailyh = ${dailyH}. Advisor ${canTrade}. Profit: ${advice}`;
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
