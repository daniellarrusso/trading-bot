import { addIndicator } from '../../indicators/base-indicator';
import { IndicatorStrategies } from '../../indicators/indicator-strategies/indicator-strats';
import { RSI } from '../../indicators/rsi';
import { ActionType } from '../../model/enums';
import { Heikin } from '../../model/heikin';
import { Indicator } from '../../model/indicator';
import { CandlesIndicatorResponse } from '../../model/multi-timeframe';
import { Strategy } from '../../model/strategy';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class FifteenHourStrategy extends BaseStrategy {
  alternateTimeframe: CandlesIndicatorResponse;
  dailyCandles: CandlesIndicatorResponse;
  currentPeriod: number;
  ema: Indicator;
  sma: Indicator;
  stopPrice: number;
  majorCandles: Heikin[] = [];
  majorCandle: Heikin;

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Fifteen Minute - Hour Strategy';
  }

  loadIndicators() {
    this.ema = addIndicator('ema', { weight: 20 });
    this.sma = addIndicator('sma', { weight: 50 });
  }

  async realtimeAdvice() {}

  async advice() {
    this.checkTradeStatus(() => {
      return true;
    });

    const endTime = new Date(this.candle.closeTime.getTime() + 1000);

    if (!this.alternateTimeframe || this.candle.time.getHours() !== endTime.getHours()) {
      try {
        this.alternateTimeframe = await this.strat.exchange.getHistoryWithIndicator(this.pair, '1h', null, null);
      } catch (error) {
        console.log(error.body);
      }
    }

    const is = new IndicatorStrategies();
    is.add(addIndicator('ema', { weight: 20 }));
    is.add(addIndicator('sma', { weight: 50 }));

    if (!this.dailyCandles || this.candle.time.getDay() !== endTime.getDay()) {
      try {
        this.dailyCandles = await this.strat.exchange.getHistoryWithIndicator(
          this.pair,
          '1d',
          addIndicator('rsi', { weight: 14 }),
          is
        );
      } catch (error) {
        console.log(error.body);
      }
    }

    const dailyRsi = this.dailyCandles;

    const canBuy = dailyRsi.indicatorStrategies.returnResult(() => {
      const ema = dailyRsi.indicatorStrategies.strategies.find((s) => s.name === 'ema');
      const sma = dailyRsi.indicatorStrategies.strategies.find((s) => s.name === 'sma');
      return ema.result > sma.result;
    });

    const prevHourHeikin = this.alternateTimeframe.heikin.candles[this.alternateTimeframe.heikin.candles.length - 3];
    const currentHeikin = this.alternateTimeframe.heikin.candles[this.alternateTimeframe.heikin.candles.length - 2];

    const isInside = this.inBetween(prevHourHeikin.open, prevHourHeikin.close, currentHeikin.close);

    const entrySize = this.returnPercentageIncrease(
      Math.max(this.heikin.open, this.heikin.close),
      Math.min(this.heikin.open, this.heikin.close)
    );

    const exitSize = this.returnPercentageIncrease(
      Math.max(prevHourHeikin.open, prevHourHeikin.close),
      Math.min(prevHourHeikin.open, prevHourHeikin.close)
    );

    let changeMajor = false;
    if (isInside && exitSize > 2) {
      if (this.majorCandles.findIndex((h) => h.time === prevHourHeikin.time) === -1) {
        this.majorCandles.push(prevHourHeikin);
        changeMajor = true;
      }
    }

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (this.heikin.green && entrySize > 1) {
        this.tradeAdvisor.trade();
        this.majorCandle = null;
      }
    }
    if (changeMajor || !this.majorCandle)
      this.majorCandle = this.majorCandles
        .filter((h) => h.close < this.heikin.close)
        .sort((a, b) => (a.close > b.close ? 1 : -1))
        .pop();

    if (this.tradeAdvisor.actionType === ActionType.Short) {
      // this.tradeAdvisor.trade();
      if (this.heikin.close < Math.min(this.majorCandle?.close, this.majorCandle?.open)) {
        this.tradeAdvisor.trade();
      }
    }
  }

  inBetween(open: number, close: number, inRange: number): boolean {
    const max = Math.max(open, close);
    const min = Math.min(open, close);
    return inRange < max && inRange > min;
  }

  resetParameters() {}

  logStatus(advice: any): void {
    const heikin = ` ${this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`} `;
    let message = `${this.ticker.pair} PRICE: ${this.candle.price} ${heikin}. Next Action: ${this.tradeStatus.nextAction}. Profit: ${advice}`;
    this.consoleColour(message);
  }
  setHeikinColour(isGreen: boolean): string {
    return isGreen ? 'Green' : 'Red';
  }
}
