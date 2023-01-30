import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { CandlesIndicatorResponse } from '../../model/multi-timeframe';
import { Strategy } from '../../model/strategy';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class AstralPatternStrategy extends BaseStrategy {
  rsi: Indicator;
  atr: Indicator;
  ema: Indicator;
  sma: Indicator;
  stop: number = 0;
  maxPrice: number = 0;
  profitStopSet: boolean;
  astralArray: Candle[] = [];
  buyCloseCount = 0;
  sellCloseCount = 0;
  newQuarter: boolean;
  quarters = [0, 15, 30, 45];
  alternateTimeframe: CandlesIndicatorResponse;
  takeProfs = false;
  astralCountMet: boolean;
  takeProfit: number;

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Astral Pattern Strategy';
  }

  loadIndicators() {
    this.rsi = addIndicator('rsi', { weight: 14 });
    this.ema = addIndicator('ema', { weight: 8 });
    this.sma = addIndicator('sma', { weight: 20 });
    this.atr = addIndicator('atr', { weight: 30 });
  }

  async realtimeAdvice() { }

  async advice() {
    const candle3 = this.astralArray[this.astralArray.length - 3];
    let candle5: Candle;
    if (this.astralArray.length > 5) candle5 = this.astralArray.shift();

    if (this.candle.close < candle3?.close && this.candle.low < candle5?.low) {
      this.buyCloseCount++;
    } else {
      this.buyCloseCount = 0;
    }

    if (this.candle.close > candle3?.close && this.candle.high > candle5?.high) {
      this.sellCloseCount++;
    } else {
      this.sellCloseCount = 0;
    }

    const prevHeikin = this.heikin.candles[this.heikin.candles.length - 2];
    const prevBearish = prevHeikin.high <= prevHeikin.open && !prevHeikin.green;
    const volConfirmed = this.candle.volume > this.volume20.result;

    this.checkTradeStatus(() => {
      return this.astralArray.length > 4;
    });

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (this.astralCountMet && this.heikin.green) {
        // Count reset or met 13
        this.astralCountMet = false;
        this.tradeAdvisor.trade();
        this.takeProfit = this.candle.close + this.atr.result * 4;
      } else {
        this.astralCountMet = false;
      }
      if (this.buyCloseCount >= 8) {
        this.astralCountMet = true;
      }
    }
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      const stopPrice = this.candle.low - this.atr.result * 2;
      this.maxPrice = Math.max(this.candle.close, this.maxPrice);
      this.stop = this.candle.close === this.maxPrice ? stopPrice : this.stop;

      if (this.candle.close > this.takeProfit) {
        this.sell(`Profit Target Hit ` + this.profit);
      }
      if (this.candle.close < this.stop) {
        this.sell(`Stop Hit ` + this.profit);
      }

      // if (this.candle.close > this.ema20.result) {
      //   this.takeProfs = true;
      // }
      // if (this.takeProfs && this.profit > 4) {
      //   this.sell(`2% profit reached - RSI over 80: ` + this.profit);
      // }
      // if (this.profit < -4) {
      //   this.sell('Profit dropped below 10%: ' + this.profit);
      // }
      // if (this.candle.close < this.lastBuyPrice && this.rsi14.result > 75) {
      //   this.sell('Sell as no longer in profs: ' + this.profit);
      // }
      // if (this.sellCloseCount >= 8 || this.profit > 12) {
      //     this.sell('Sell count reached: ' + this.profit)
      // }
    }

    this.astralArray.push(this.candle);
  }

  sell(reason: string) {
    const message = `${this.candle.pair} ${reason}`;
    console.log(message);
    this.takeProfs = false;
    this.takeProfit = 0;
    this.stop = 0;
    this.maxPrice = 0;
    this.tradeAdvisor.trade();
    this.astralCountMet = false;
  }

  resetParameters() {
    console.log('parameters reset');
    this.astralCountMet = false;
    this.takeProfs = false;
  }

  logStatus(advice: any): void {
    const heikin = ` ${this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`} `;
    let nextAction = 'looking to: ';
    let canTrade = `Met: ${this.astralCountMet}, Buy Count: - ${this.buyCloseCount}. SellCount: ${this.sellCloseCount
      }  - READY? ${this.canTrade ? 'OK' : 'NO'}`;
    nextAction += this.tradeAdvisor.actionType === ActionType.Long ? 'BUY' : 'SELL';
    let message = `${this.ticker.pair} PRICE: ${this.candle.price} ${heikin}. Advisor ${canTrade}. Profit: ${advice}`;
    this.consoleColour(message);
  }
  setHeikinColour(isGreen: boolean): string {
    return isGreen ? 'Green' : 'Red';
  }
}
