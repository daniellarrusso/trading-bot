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
  private nextInterval: number = 0;
  daylightSavings: DaylightSavings;
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
    this.nextInterval = nextDate.getTime();
  }

  async process(candle: Candle, isBacktest: boolean) {
    this.daylightSavings.update(moment(candle.time).isDST());

    const conditional = isBacktest ? candle.time.getTime() : candle.closeTime.getTime();
    const canProcess = !this.nextInterval || this.nextInterval === conditional;
    if (canProcess) {
      await this.getHistory(candle);
      this.updateInterval(this.lastCandle.closeTime);
    }
  }

  async getHistory(candle: Candle) {
    const res: Candle[] = await this.service.getOHLCHistoryByPair(candle.pair, this.interval.interval);
    this.candles = res.filter((c) => c.closeTime.getTime() <= candle.closeTime.getTime());
    this.lastCandle = this.candles[this.candles.length - 1];
    this.updateIndicator();
  }

  createIndicator(name: IndicatorName, settings: IndicatorSettings) {
    if (!this.indicators.find((i) => i.name.toLowerCase() === name.toLowerCase())) {
      const indicatorToAdd = addIndicator(name, settings);
      indicatorToAdd.manualUpdate = true;
      this.indicators.push(indicatorToAdd);
    }
    return this.indicators.find((i) => i.name.toLowerCase() === name.toLowerCase());
  }

  updateIndicator() {
    if (this.nextInterval) {
      this.indicators.map((i) => {
        i.update(this.lastCandle.close);
      });
    } else {
      this.indicators.map((i) => this.candles.map((c) => i.update(c.close)));
    }
  }
}
