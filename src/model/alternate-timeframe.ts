import { addIndicator, IndicatorName } from '../indicators/base-indicator';
import { Candle } from './candle';
import { Indicator, IndicatorSettings } from './indicator';
import { Interval } from './interval-converter';
import moment from 'moment';
import { IExchangeService } from '../services/IExchange-service';
import { Observer } from './observer';

export class AlternateTimeframe implements Observer {
    interval: Interval;
    candles: Candle[];
    lastCandle: Candle;
    indicators: Indicator[] = [];
    backtestMode: boolean;
    constructor(interval: Interval, public service: IExchangeService) {
        this.interval = interval;
        this.backtestMode = this.service.ticker.backTestMode;
    }
    update() {
        this.backtestMode = this.service.ticker.backTestMode;
        console.log('BacktestMode is: ', this.backtestMode);
    }

    async process(candle: Candle) {
        if (this.processNextCandle(candle.closeTime)) {
            await this.getHistory(candle);
        }
    }

    processNextCandle(time: Date): boolean {
        let adjustedTime = new Date(time);
        if (moment(time).isDST()) {
            adjustedTime = subtractHour(adjustedTime);
        }
        switch (this.interval.minutes) {
            case 5:
                return [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].some(
                    (i) => i === adjustedTime.getMinutes()
                );
            case 15:
                return [0, 15, 30, 45].some((i) => i === adjustedTime.getMinutes());
            case 60:
                return [0].some((i) => i === adjustedTime.getHours());
            case 60 * 4:
                return [0, 4, 8, 12, 16, 20].some((i) => i === adjustedTime.getHours());
            case 60 * 24:
                return adjustedTime.getHours() === 0;
            default:
                throw Error('Interval has no conversion');
        }
    }

    async getHistory(candle: Candle) {
        if (this.backtestMode) {
            let candles;
            if (this.candles) {
                candles = this.candles.filter((c) => c.closeTime.getTime() <= candle.closeTime.getTime());
                this.lastCandle = candles[candles.length - 1];
            } else {
                this.candles = await this.service.getOHLCHistoryByPair(candle.pair, this.interval);
                candles = this.candles.filter((c) => c.closeTime.getTime() <= candle.closeTime.getTime());
                this.lastCandle = candles[candles.length - 1];
            }
            this.updateIndicator(candles);
        } else {
            this.candles = await this.service.getOHLCHistoryByPair(candle.pair, this.interval);
            const candles = this.candles.filter((c) => c.closeTime.getTime() <= candle.closeTime.getTime());
            this.lastCandle = candles[candles.length - 1];
            this.updateIndicator(candles);
        }
    }

    createIndicator(name: IndicatorName, settings: IndicatorSettings) {
        if (!this.indicators.find((i) => i.name.toLowerCase() === name.toLowerCase())) {
            const indicatorToAdd = addIndicator(name, settings);
            indicatorToAdd.manualUpdate = true;
            this.indicators.push(indicatorToAdd);
        }
        return this.indicators.find((i) => i.name.toLowerCase() === name.toLowerCase());
    }

    private updateIndicator(candlesToUpdate: Candle[]) {
        this.indicators.map((i) => candlesToUpdate.map((c) => i.update(c.close)));
    }
}

function subtractHour(date) {
    date.setHours(date.getHours() - 1);
    return date;
}
