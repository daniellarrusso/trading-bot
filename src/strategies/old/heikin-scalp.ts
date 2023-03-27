import { addIndicator } from '../../indicators/base-indicator';
import { BuyTrigger } from '../../model/buyTrigger';
import { CallbackDelay } from '../../model/callback-delay';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Heikin } from '../../model/heikin';
import { Indicator } from '../../model/indicator';
import { CandlesIndicatorResponse } from '../../model/multi-timeframe';
import { PriceTracker } from '../../model/price-tracker';

import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class HeikinScalpStrategy extends BaseStrategy {
  rsi: Indicator;
  mas: Indicator;
  cci: Indicator;
  shortLimit: number;
  stopLoss: number;
  volumeMa: Indicator;
  realTrader: boolean;
  upWave: boolean;
  upTrend: boolean;
  rsiHits: number = 0;
  profitTake: boolean;
  lowTracker: PriceTracker;
  profitLadder = [1, 3, 5, 8, 13, 21, 34];
  profitReached: number;
  alternateTimeframe: CandlesIndicatorResponse;
  currentHour: number;
  made80: boolean;
  sellTrigger: BuyTrigger = new BuyTrigger();

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Heikin Scalp Strategy';
  }

  loadIndicators() {
    this.rsi = addIndicator('rsi', { weight: 14, input: 'close', inputType: 'heikin', name: 'RSI 14' });
    this.cci = addIndicator('sniper-cci', {
      weight: 14,
      input: 'close',
      inputType: 'heikin',
      name: 'Sniper CCI',
    });
    this.volumeMa = addIndicator('sma', { weight: 20, input: 'volume', inputType: 'candle' });
  }

  async realtimeAdvice() {
    // Testing REMOVE before live
    // if (!this.realTrader) {
    //     this.realTrader = true;
    //     this.tradeAdvisor.trade();
    // }
  }

  async advice() {
    const bullishHeikin = this.heikin.low >= this.heikin.open && this.heikin.green;
    const bearishHeikin = this.heikin.high <= this.heikin.open && !this.heikin.green;

    this.checkTradeStatus(() => {
      return !this.heikin.green;
    });

    // const mas = this.alternateTimeframe.indicator.movingAverages;
    // const hourlyCandle = this.alternateTimeframe.candlesticks[this.alternateTimeframe.candlesticks.length - 1];

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (
        this.ema20.result > this.ema20.previousResult &&
        this.ema20.result < this.sma50.result &&
        this.ema20.result > this.sma200.result
      ) {
        this.tradeAdvisor.trade();
      }
    }
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      this.sellTrigger.set(() => {
        return this.ema20.previousResult < this.sma50.previousResult && this.ema20.result > this.sma50.result;
      });
      if (this.sellTrigger.active && this.ema20.result < this.sma50.result) {
        this.tradeAdvisor.trade();
        this.sellTrigger.active = false;
      }
    }

    this.currentHour = this.candle.time.getHours();
  }

  sell() {
    this.made80 = false;
    this.tradeAdvisor.trade();
  }

  logStatus(advice: any): void {
    const heikin = ` ${
      this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
    } `;
    let nextAction = 'looking to: ';
    let canTrade = `RSI: - ${this.rsi.result}. CCI:  - READY? ${this.canTrade ? 'OK' : 'NO'}`;
    nextAction += this.tradeAdvisor.actionType === ActionType.Long ? 'BUY' : 'SELL';
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
