import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Logger } from '../../model/logger';
import { CandlesIndicatorResponse } from '../../model/multi-timeframe';

import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class IntradayRSIStrategy extends BaseStrategy {
  logger: Logger;
  rsi: Indicator;
  cci: Indicator;
  ewo: Indicator;
  ema: Indicator;
  sma: Indicator;
  smaLong: Indicator;
  buyTrigger: boolean;
  shortLimit: number;
  longLimit: number;
  heikin4hr: Candle;
  heikinRequest: any;
  sniperCCI: number;
  previousSniperCCI;
  volumeMa: Indicator;
  alternateTimeFrameCandle: CandlesIndicatorResponse;
  atr: Indicator;
  onePercent: boolean;
  threePercent: boolean;
  realTrader: boolean;
  newUpTrend: boolean;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'RSI Intraday Strategy';
  }

  loadIndicators() {
    this.rsi = addIndicator('rsi', { weight: 10, name: 'RSI 10' });
    this.volumeMa = addIndicator('sma', { weight: 20, input: 'volume', inputType: 'candle' });

    // EW Oscillator
    this.ewo = addIndicator('ewo', { weight: 14, weights: [5, 35], name: 'ewo' });
    this.cci = addIndicator('sniper-cci', { weight: 14 });
  }

  async realtimeAdvice() {
    // Testing REMOVE before live
    // if (!this.realTrader) {
    //     this.realTrader = true;
    //     this.tradeAdvisor.trade();
    // }
  }

  async advice() {
    const maVolume = this.volumeMa.result;
    const volumeConfirmedGreen = this.candle.green && this.candle.volume > maVolume;

    this.checkTradeStatus(() => {
      return this.ewo.result < 0;
    });

    if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
      if (this.rsi.previousResult < 30 && volumeConfirmedGreen && this.ewo.previousResult < -1) {
        this.newUpTrend = false;
        this.tradeAdvisor.trade();
        this.shortLimit = this.candle.open;
      }
    }
    if (this.tradeAdvisor.inTrade) {
      if (this.ewo.result > 0 && this.ewo.previousResult < 0) {
        this.newUpTrend = true;
      }
      if (this.rsi.result < 70 && this.rsi.previousResult > 70) {
        this.shortLimit = this.candle.low;
      }
      if (this.candle.close < this.shortLimit) {
        this.tradeAdvisor.trade();
      }
      if (this.newUpTrend && this.ewo.result < 0) {
        // downtrend without reaching 70 RSI
        // this.tradeAdvisor.trade();
        this.newUpTrend = false;
      }
    }
  }

  logStatus(advice: any): void {
    const heikin = ` ${
      this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
    } `;
    let nextAction = 'looking to: ';
    let canTrade = `EWO: ${this.ewo.result}. RSI: ${this.rsi.result}  - READY? ${
      this.canTrade ? 'OK' : 'NO'
    }`;
    nextAction += !this.tradeAdvisor.inTrade ? 'BUY' : 'SELL';
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
