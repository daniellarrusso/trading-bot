import { Candle } from '../../model/candle';
import { ActionType, AdvisorType } from '../../model/enums';

import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class VolumeCatcherStrategy extends BaseStrategy {
    sellPrice: number = 0;
    currVolume: number;
    prevVolume: number;
    stop: number;

    constructor(public strat: IExchangeService, advisor: AdvisorType) {
        super(strat, advisor);
        this.strategyName = 'Volume Catcher Strategy';
        this.sellPrice = 100000000;
    }

    loadIndicators() {}

    async realtimeAdvice(candle: Candle) {}

    async advice() {
        // const { shortLimit, indicator } = this.strat.portfolio;
        // if (indicator) {
        //   this.sellPrice = this[indicator].result;
        // }

        // this.sellPrice = this.sellPrice.normalise(this.candle.ticker.tickSize)

        const volDifference = this.returnPercentageIncrease(this.candle.volume, this.volume20.result);
        const priceIncrease = this.candle.close > this.previousCandle.close;

        this.checkTradeStatus(() => {
            return true;
        });

        if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
            if (volDifference > 350 && priceIncrease) {
                this.tradeAdvisor.trade();
                this.stop =
                    this.candle.low > this.sma200.result ? this.sma200.result : this.previousCandle.low;
            }
        }

        if (this.tradeAdvisor.inTrade) {
            if (this.profit > 3) {
                this.stop = this.ema20.result;
            }
            if (this.candle.low > this.sma200.result) {
                this.stop = this.sma200.result;
            }
            if (this.candle.close < this.stop) {
                this.tradeAdvisor.trade();
            }
        }
    }

    logStatus(advice: any): void {
        let message = `${this.ticker.pair} will sell below: ${this.sellPrice}. Current Price: ${this.candle.price}`;
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
