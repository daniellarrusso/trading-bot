import { addIndicator } from '../../indicators/base-indicator';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Intervals } from '../../model/interval-converter';
import { CandlesIndicatorResponse } from '../../model/multi-timeframe';

import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class DoubleBottomStrategy extends BaseStrategy {
  atr: Indicator;
  ema: Indicator;
  sma: Indicator;
  stop: number = 10000000;
  maxPrice: number;
  priceRange: number[] = [];
  alternateTimeframe: CandlesIndicatorResponse;
  takeProfs = false;
  intervalsInTrade: number = 0;
  notificationSent: boolean;
  strongCandleCount: number = 0;

  // new
  redHeikinTouched: boolean;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Double Bottom Strategy';
  }

  loadIndicators() {
    this.ema = addIndicator('ema', { weight: 8 });
    this.sma = addIndicator('sma', { weight: 20 });
    this.atr = addIndicator('atr', { weight: 30 });
  }

  async realtimeAdvice() {}

  async advice() {
    const bearishHeikin = this.heikin.high <= this.heikin.open && !this.heikin.green;
    const bullishHeikin = this.heikin.low >= this.heikin.open && this.heikin.green;
    const prevHeikin = this.heikin.candles[this.heikin.candles.length - 2];
    const volConfirmed = this.candle.volume > this.volume20.result;
    this.tradeStatus.inTrade ? this.intervalsInTrade++ : (this.intervalsInTrade = 0);
    const heikinWick = this.returnPercentageIncrease(this.heikin.close, prevHeikin.close);

    this.checkTradeStatus(() => {
      return true;
    });

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (!prevHeikin.green && prevHeikin.duration > 3) {
        // possible reversal
        this.redHeikinTouched = true;
      }

      // change to bullishH and duration === 1
      if (this.redHeikinTouched && bullishHeikin && volConfirmed) {
        this.tradeAdvisor.trade();
      }
    }

    if (this.tradeAdvisor.actionType === ActionType.Short) {
      const pair = this.candle.pair;
      const stopPrice = this.candle.open - this.atr.result * 2;
      this.maxPrice = Math.max(this.candle.close, this.maxPrice);
      this.stop = this.candle.close === this.maxPrice ? stopPrice : this.stop;

      if (this.profit > 2) {
        this.takeProfs = true;
      }

      if (this.profit < -2) {
        this.sell('');
      }

      if (this.profit > 1.3 && !this.takeProfs && !volConfirmed) {
        this.sell(`quick sell. Profit ${this.profit}%`);
      }

      if (this.takeProfs && ((this.rsi14.result < 80 && this.rsi14.previousResult > 80) || bearishHeikin)) {
        this.sell(`2% profit reached ${this.rsi14.result} - 1st bearish Heikin Candle sell`);
      }
      if (this.takeProfs && this.profit < 2) {
        this.takeProfs = false;
      }
      if (
        !this.takeProfs &&
        this.rsi14.result < 69 &&
        this.rsi14.previousResult > 69 &&
        this.intervalsInTrade > 4
      ) {
        this.sell(`RSI: ${this.rsi14.result} SELL`);
      }

      if (this.intervalsInTrade > this.intervalsInDay / 2 && !this.notificationSent) {
        console.log(`in trade for over half a day. Profit: ${this.profit}`);
        if (!this.backtestMode)
          this.telegram.sendMessage(`${pair} in trade for over half a day. Profit: ${this.profit}`);
        this.notificationSent = true;
      }
    }
  }

  sell(reason: string) {
    const message = `${this.candle.pair} ${reason}`;
    console.log(message);
    this.redHeikinTouched = false;
    this.tradeAdvisor.trade();
  }

  logStatus(advice: any): void {
    const heikin = ` ${
      this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
    } `;
    let canTrade = `RSI: ${this.rsi14.result}. CCI:  READY? ${this.canTrade ? 'OK' : 'NO'}`;
    let message = `${this.ticker.pair} PRICE: ${this.candle.price} ${heikin}. ${canTrade}. Profit: ${advice}`;
    this.consoleColour(message);
  }

  setHeikinColour(isGreen: boolean): string {
    return isGreen ? 'Green' : 'Red';
  }
}
