import { addIndicator } from '../../indicators/base-indicator';
import { BuyTrigger } from '../../model/buyTrigger';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Intervals } from '../../model/interval-converter';
import { CandlesIndicatorResponse } from '../../model/multi-timeframe';

import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class QuickScalpStrategy extends BaseStrategy {
  atr: Indicator;
  ema: Indicator;
  sma: Indicator;
  stop: number = 10000000;
  maxPrice: number;
  priceRange: number[] = [];
  alternateTimeframe: CandlesIndicatorResponse;
  intervalsInTrade: number = 0;
  intervalsInDay: number;
  notificationSent: boolean;
  buyTrigger: BuyTrigger = new BuyTrigger();
  sellTrigger: BuyTrigger = new BuyTrigger();
  tradingTooLong: boolean;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Quick Scalp Strategy';
  }

  loadIndicators() {
    this.ema = addIndicator('ema', { weight: 8 });
    this.sma = addIndicator('sma', { weight: 20 });
    this.atr = addIndicator('atr', { weight: 30 });
  }

  async realtimeAdvice(candle: Candle) {
    // add a real time check to take profit on a 5%?
    if (this.tradeAdvisor.actionType === ActionType.Short) {
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
    this.tradeStatus.inTrade ? this.intervalsInTrade++ : (this.intervalsInTrade = 0);

    this.checkTradeStatus(() => {
      return true;
    });

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      this.buyTrigger.set(() => {
        return (
          !prevHeikin.green &&
          prevHeikin.duration > 3 &&
          this.heikin.green &&
          this.ema20.result > this.sma50.result
        );
      });

      this.buyTrigger.unset(() => {
        return !this.heikin.green;
      });
      if (this.buyTrigger.active && volConfirmed) {
        this.tradeAdvisor.trade();
        //console.log(prevHeikin.duration, this.rsi14.result, volConfirmed)
        this.stop = this.candle.open - this.atr.result * 1.5;
        this.priceRange.length = 0;
        this.maxPrice = this.candle.close;
        this.sellTrigger.active = this.buyTrigger.active = this.notificationSent = false;
      }
    }

    if (this.tradeAdvisor.actionType === ActionType.Short) {
      const pair = this.candle.pair;
      const stopPrice = this.candle.open - this.atr.result * 2;
      this.maxPrice = Math.max(this.candle.close, this.maxPrice);
      this.stop = this.candle.close === this.maxPrice ? stopPrice : this.stop;

      this.sellTrigger.set(() => {
        return this.profit > 2;
      });

      const sellTriggered = this.sellTrigger.active;

      this.sellTrigger.unset(() => {
        return sellTriggered && this.profit < 2;
      });

      if (this.profit > 1 && !sellTriggered && !volConfirmed) {
        this.sell(`quick sell. Profit ${this.profit}%`);
      }

      if ((sellTriggered && this.rsi14.result > 80) || this.profit > 20) {
        this.sell(`2% profit reached - RSI above 80`);
      }

      if (this.tradingTooLong && this.rsi14.result < 69 && this.rsi14.previousResult > 69) {
        this.sell(`RSI: ${this.rsi14.result} and still not in profit`);
      }

      if (this.intervalsInTrade > this.intervalsInDay / 2 && !this.notificationSent) {
        this.tradingTooLong = true;
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
    this.tradingTooLong = false;
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
