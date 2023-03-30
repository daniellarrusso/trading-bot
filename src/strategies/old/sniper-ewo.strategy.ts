import { addIndicator } from '../../indicators/base-indicator';
import { BacktestAdvisor } from '../../model/backtest-advisor';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Logger } from '../../model/logger';
import { CandlesIndicatorResponse } from '../../model/multi-timeframe';

import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class SniperEwoStrategy extends BaseStrategy {
  logger: Logger;
  rsi: Indicator;
  cci: Indicator;
  ema: Indicator;
  sma: Indicator;
  smaLong: Indicator;
  ewo: Indicator;
  shortLimit: number;
  longLimit: number;
  heikin4hr: Candle;
  heikinRequest: any;
  sniperCCI: number;
  currentCCI;
  volumeMa: Indicator;
  alternateTimeFrameCandle: CandlesIndicatorResponse;
  realTrader: boolean;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Sniper Heikin Strategy';
  }

  loadIndicators() {
    this.rsi = addIndicator('rsi', { weight: 10, name: 'RSI 10' });
    this.volumeMa = addIndicator('sma', { weight: 20, input: 'volume', inputType: 'candle' });
    // EW Oscillator
    this.ewo = addIndicator('ewo', { weight: 14, weights: [5, 35], name: 'sma5' });
    this.ema = addIndicator('ema', { weight: 20, name: 'ema' });
    this.sma = addIndicator('sma', { weight: 50, name: 'sma50' });
    this.smaLong = addIndicator('sma', { weight: 200, name: 'sma200' });
  }

  async realtimeAdvice() {
    // if (!this.realTrader) {
    //     this.realTrader = true;
    //     this.tradeAdvisor.trade();
    // }
  }

  async advice() {
    const isBackTest = this.tradeAdvisor.advisor instanceof BacktestAdvisor == true;
    const maVolume = this.volumeMa.result;
    const volumeConfirmed = this.candle.green && this.candle.volume > maVolume;

    const myCCI = addIndicator('sniper-cci', { weight: 14 });
    const time = new Date(this.candle.time);
    extractNearestHour(time);
    if (this.candle.time.getMinutes() === 0) {
      try {
        this.alternateTimeFrameCandle = await this.strat.exchange.getHistoryWithIndicator(
          this.strat.exchange.ticker.pair,
          '1h',
          myCCI
        );
      } catch (error) {
        console.log(error.body);
      }
    }
    const buyCandle =
      this.alternateTimeFrameCandle?.candlesticks[this.alternateTimeFrameCandle.candlesticks.length - 1];
    this.sniperCCI = myCCI.previousResult ? myCCI.previousResult : this.sniperCCI;
    this.currentCCI = myCCI.result ? myCCI.result : this.currentCCI;
    const sniperCCIBuy = this.sniperCCI > -50 && this.ema.result > this.sma.result;

    this.checkTradeStatus(() => {
      return this.ewo.result < 0 && this.sniperCCI < 0;
    });

    if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
      if (this.ewo.result > 0 && sniperCCIBuy && volumeConfirmed) {
        this.tradeAdvisor.trade();
      }
    }
    if (this.tradeAdvisor.inTrade) {
      if (this.ewo.result < 0 && this.sniperCCI < 0 && !buyCandle.green) {
        this.tradeAdvisor.trade();
      }
      if (this.rsi.result > 70 && !isBackTest) {
        this.telegram.sendMessage(
          `${this.ticker.pair} is above ${this.rsi.result}. Price: ${this.candle.price} Profit: ${this.profit}`
        );
      }
    }
  }

  logStatus(advice: any): void {
    // logs strat specific info
    const heikin = ` ${
      this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
    } `;
    let nextAction = 'looking to: ';
    let canTrade = `EWO: ${this.ewo.result}. CCI: ${this.sniperCCI} - READY? ${this.canTrade ? 'OK' : 'NO'}`;
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
