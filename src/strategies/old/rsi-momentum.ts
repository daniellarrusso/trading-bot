import { addIndicator } from '../../indicators/base-indicator';
import { CallbackDelay } from '../../model/callback-delay';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';

import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class RsiMomentumStrategy extends BaseStrategy {
  rsiFast: Indicator;
  rsiSlow: Indicator;
  atr: Indicator;
  rsiDifferences: number[] = [];
  stopLimit: number;
  profitTake: number;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'RSI Momentum Strategy';
  }

  loadIndicators() {
    this.rsiFast = addIndicator('rsi', { weight: 4 });
    this.rsiSlow = addIndicator('rsi', { weight: 9 });
    this.atr = addIndicator('atr', { weight: 30 });
  }

  async realtimeAdvice() {}

  async advice() {
    const emaCross =
      this.ema20.result > this.sma50.result && this.ema20.previousResult < this.sma50.previousResult;
    const bullishHeikin = this.heikin.low >= this.heikin.open && this.heikin.green;
    const bearishHeikin = this.heikin.high <= this.heikin.open && !this.heikin.green;
    const rsiDiff = this.rsiFast.result - this.rsiSlow.result;

    this.rsiDifferences.push(rsiDiff);
    if (this.rsiDifferences.length > 3) this.rsiDifferences.shift();

    const cleanRsiBuy = this.rsiDifferences.filter((v, i) => i < 2).some((r) => r < -10);
    const cleanRsiSell = this.rsiDifferences.filter((v, i) => i < 2).some((r) => r < 10);

    this.checkTradeStatus(() => {
      return true;
    });

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (rsiDiff < -10 && !cleanRsiBuy) {
        this.tradeAdvisor.trade();
        this.stopLimit = this.candle.close - this.atr.result * 1;
        this.profitTake = this.candle.close + this.atr.result * 2;
      }
    }
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      if (rsiDiff > 10 && cleanRsiSell) {
        this.tradeAdvisor.trade();
      }
      if (this.candle.close < this.stopLimit) {
        this.tradeAdvisor.trade();
      }
      if (this.candle.close > this.profitTake) {
        this.tradeAdvisor.trade();
      }
    }
  }

  logStatus(advice: any): void {
    const heikin = ` ${
      this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
    } `;
    let nextAction = 'looking to: ';
    let canTrade = `RSI: - . CCI:  - READY? ${this.canTrade ? 'OK' : 'NO'}`;
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
