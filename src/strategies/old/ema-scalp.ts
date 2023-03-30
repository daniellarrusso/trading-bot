import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Intervals } from '../../model/interval-converter';
import { CandlesIndicatorResponse } from '../../model/multi-timeframe';

import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class EMAScalpStrategy extends BaseStrategy {
  atr: Indicator;
  stop: number = 10000000;
  maxPrice: number;
  priceRange: number[] = [];
  alternateTimeframe: CandlesIndicatorResponse;
  takeProfs = false;
  intervalsInTrade: number = 0;
  intervalsInDay: number;
  notificationSent: boolean;
  strongCandleCount: number = 0;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Quick Scalp Strategy';
  }

  loadIndicators() {
    this.atr = addIndicator('atr', { weight: 30 });
  }

  async realtimeAdvice(candle: Candle) {
    // add a real time check to take profit on a 5%?
    if (this.tradeAdvisor.inTrade) {
      const candleIncrease = this.returnPercentageIncrease(candle.close, this.candle.open);
      if (candleIncrease > 6) {
        console.log('Sold as price increased over 6%');
        this.tradeAdvisor.trade();
      }
    }
  }

  async advice() {
    const bearishHeikin = this.heikin.high <= this.heikin.open && !this.heikin.green;
    const bullishHeikin = this.heikin.low >= this.heikin.open && this.heikin.green;
    const prevHeikin = this.heikin.candles[this.heikin.candles.length - 2];
    const volConfirmed = this.candle.volume > this.volume20.result;
    this.ticker.isLong ? this.intervalsInTrade++ : (this.intervalsInTrade = 0);

    if (volConfirmed && this.heikin.green) {
      this.strongCandleCount++;
    } else {
      this.strongCandleCount = 0;
    }

    this.checkTradeStatus(() => {
      return this.candle.close > this.ema20.result;
    });

    if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
      if (this.candle.close < this.ema20.result) {
        this.tradeAdvisor.trade();
        //console.log(prevHeikin.duration, this.rsi14.result, volConfirmed)
        this.stop = this.candle.open - this.atr.result * 1.5;
        this.priceRange.length = 0;
        this.maxPrice = this.candle.close;
        this.takeProfs = this.notificationSent = false;
      }
    }

    if (this.tradeAdvisor.inTrade) {
      const pair = this.candle.pair;
      const stopPrice = this.candle.open - this.atr.result * 2;
      this.maxPrice = Math.max(this.candle.close, this.maxPrice);
      this.stop = this.candle.close === this.maxPrice ? stopPrice : this.stop;

      if (this.profit > 2) {
        this.takeProfs = true;
      }

      if (this.profit > 1.3 && !this.takeProfs) {
        this.sell(`quick sell. Profit ${this.profit}%`);
      }

      if (this.takeProfs && this.rsi14.result > 80) {
        this.sell(`2% profit reached - 1st bearish Heikin Candle sell`);
      }
      if (this.takeProfs && this.profit < 2) {
        this.takeProfs = false;
      }
      if (this.candle.close < this.tradeAdvisor.longPrice && this.rsi14.result > 69) {
        this.sell(`RSI: ${this.rsi14.result} and still not in profit`);
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
