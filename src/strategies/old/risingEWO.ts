import { addIndicator } from '../../indicators/base-indicator';
import { CallbackDelay } from '../../model/callback-delay';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Heikin } from '../../model/heikin';
import { Indicator } from '../../model/indicator';
import { Strategy } from '../../model/strategy';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class RisingEwoStrategy extends BaseStrategy {
  rsi: Indicator;
  ewo: Indicator;
  ema: Indicator;
  sma: Indicator;
  smaLong: Indicator;
  shortLimit: number;
  volumeMa: Indicator;
  realTrader: boolean;
  upWave: boolean;
  upTrend: boolean;
  rsiHits: number = 0;

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Rising EWO MA Strategy';
  }

  loadIndicators() {
    this.rsi = addIndicator('rsi', { weight: 10, name: 'RSI 14' });
    this.volumeMa = addIndicator('sma', { weight: 20, input: 'volume', inputType: 'candle' });
    this.ema = addIndicator('ema', { weight: 20 });
    this.sma = addIndicator('sma', { weight: 50 });
    this.smaLong = addIndicator('sma', { weight: 200 });
    this.ewo = addIndicator('ewo', { weight: 14, weights: [5, 35], name: 'ewo' });
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
    const volumeIncreasePercentage = this.returnPercentageIncrease(this.candle.volume, maVolume);
    const volumeConfirmedGreen = this.candle.green && volumeIncreasePercentage > 5 && this.rsi.result < 70;
    const risingEwo = this.ewo.result > this.ewo.previousResult;

    const r = this.heikin.candles[this.heikin.candles.length - 2];

    const maCrossingDown = this.ema.result < this.sma.result;
    const maCrossingUp = this.ema.result > this.sma.result;

    this.checkTradeStatus(() => {
      return this.ewo.result < 0;
    });

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (
        this.ewo.result > -0.5 &&
        volumeConfirmedGreen &&
        this.heikin.green &&
        this.candle.close > this.smaLong.result &&
        r.duration > 1
      ) {
        this.tradeAdvisor.trade();
        this.upWave = this.upTrend = false;
        this.shortLimit = this.candle.low; // this.pricesinRed.reduce((a, b) => Math.min(a, b));
      }
    }
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      // if (!this.heikin.green) {
      //     this.sell()
      // }
      if (this.candle.close < this.shortLimit && this.profit < -1) {
        console.log('Stop Limit reached ' + this.shortLimit);
        this.sell();
      }
      if (this.rsi.result < 70 && this.rsi.previousResult > 70) {
        this.rsiHits++;
        if (this.rsiHits < 2) {
          console.log('RSI: Reached');
        }
      }
      if (this.ewo.result > 0) {
        this.upWave = true;
        // console.log('Made it to Green. Lowest low = ' + this.candleStats.lowestPrice);
      }
      if (this.upWave && maCrossingUp) {
        this.upTrend = true;
        // console.log('ma\'s have crossed up so sell when crossing down');
      }
      if (this.upTrend && maCrossingDown) {
        this.sell();
        this.delayStrat.start(new CallbackDelay(6, () => this.ewo.result > this.ewo.previousResult));
      }
      if (this.upWave && !this.upTrend && this.ewo.result < 0) {
        this.sell();
      }
    }
  }

  sell() {
    this.rsiHits = 0;
    this.tradeAdvisor.trade();
  }

  logStatus(advice: any): void {
    const heikin = ` ${this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`} `;
    let nextAction = 'looking to: ';
    let canTrade = `EWO: ${this.ewo.result}. CCI:  - READY? ${this.canTrade ? 'OK' : 'NO'}`;
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
