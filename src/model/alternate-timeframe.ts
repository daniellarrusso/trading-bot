import { addIndicator, IndicatorName } from '../indicators/base-indicator';
import { Candle } from './candle';
import { Indicator, IndicatorSettings } from './indicator';
import { Interval, IntervalType } from './interval-converter';
import { Observer } from './observer';
import { DaylightSavings } from './daylight-savings';
import moment from 'moment';
import { IExchangeService } from '../services/IExchange-service';

export class AlternateTimeframe implements Observer {
    interval: Interval;
    candles: Candle[];
    lastCandle: Candle;
    indicators: Indicator[] = [];
    private nextInterval;
    daylightSavings: DaylightSavings;
    isBacktest: boolean;
    constructor(interval: Interval, public service: IExchangeService) {
        this.interval = interval;
        this.daylightSavings = new DaylightSavings();
        this.daylightSavings.addObserver(this);
    }

    get nextIntervalDate() {
        return new Date(this.nextInterval);
    }

    update() {
        console.log('Daylight Savings updated');
        let nextIntervalDate = new Date(this.nextInterval);
        if (this.daylightSavings.isDST) {
            nextIntervalDate.setHours(nextIntervalDate.getHours() + 1);
        } else {
            nextIntervalDate.setHours(nextIntervalDate.getHours() - 1);
        }
        this.nextInterval = nextIntervalDate.getTime();
    }
    private updateInterval(closeTime: Date) {
        const nextDate = new Date(closeTime);
        switch (this.interval.type) {
            case IntervalType.minute:
                nextDate.setMinutes(nextDate.getMinutes() + this.interval.distance);
                break;
            case IntervalType.hour:
                nextDate.setHours(nextDate.getHours() + this.interval.distance);
                break;
            case IntervalType.day:
                nextDate.setDate(nextDate.getDate() + this.interval.distance);
                break;
            case IntervalType.week:
                nextDate.setDate(nextDate.getDate() + this.interval.distance);
                break;
            default:
                break;
        }
        this.nextInterval = nextDate.toLocaleString();
    }

    async process(candle: Candle, isBacktest: boolean) {
        this.isBacktest = isBacktest;
        this.daylightSavings.update(moment(candle.time).isDST());

        if (this.processNextCandle(candle.closeTime)) {
            await this.getHistory(candle);
            this.updateInterval(candle.closeTime);
        }
    }

    processNextCandle(time: Date): boolean {
        if (moment(time).isDST()) {
            time = subtractHour(time);
        }

        switch (this.interval.minutes) {
            case 5:
                return [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].some((i) => i === time.getMinutes());
            case 15:
                return [0, 15, 30, 45].some((i) => i === time.getMinutes());
            case 60:
                return [0].some((i) => i === time.getHours());
            case 60 * 4:
                return [0, 4, 8, 12, 16, 20].some((i) => i === time.getHours());
            case 60 * 24:
                return time.getHours() === 0;
            default:
                throw Error('Interval has no conversion');
        }
    }

    async processHigherTimeframe(candle: Candle, isBacktest: boolean) {
        const monthsago = moment().subtract(4, 'months');

        this.daylightSavings.update(moment(candle.time).isDST());
        if (moment(candle.time) < monthsago) return;
        await this.getHistory(candle);
        this.updateInterval(this.lastCandle?.closeTime);
    }

    async getHistory(candle: Candle) {
        if (this.isBacktest) {
            if (this.candles) {
                const candles = this.candles.filter(
                    (c) => c.closeTime.getTime() <= candle.closeTime.getTime()
                );
                this.lastCandle = candles[candles.length - 1];
            } else {
                this.candles = await this.service.getOHLCHistoryByPair(candle.pair, this.interval);
                const candles = this.candles.filter(
                    (c) => c.closeTime.getTime() <= candle.closeTime.getTime()
                );
                this.lastCandle = candles[candles.length - 1];
            }
            this.updateIndicator();
        } else {
            this.candles = await this.service.getOHLCHistoryByPair(candle.pair, this.interval);
            const candles = this.candles.filter((c) => c.closeTime.getTime() <= candle.closeTime.getTime());
            this.lastCandle = candles[candles.length - 1];
            this.updateIndicator();
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

    private updateIndicator() {
        if (this.nextInterval) {
            this.indicators.map((i) => {
                i.update(this.lastCandle.close);
            });
        } else {
            this.indicators.map((i) => this.candles.map((c) => i.update(c.close)));
        }
    }
}

function subtractHour(date) {
    date.setHours(date.getHours() - 1);

    return date;
}
