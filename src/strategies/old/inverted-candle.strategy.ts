import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';

import { IExchangeService } from '../../services/IExchange-service';
import { BaseStrategy } from '../base-strategy';

export class InvertedCandleStrategy extends BaseStrategy {
  rsi: Indicator;
  cci: Indicator;
  ema: Indicator;
  sma: Indicator;
  smaLong: Indicator;
  buyTrigger: boolean;
  stopPrice: number;
  boughtAbove70: boolean;
  candleCounter = 0;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Inverted Candle Strategy';
  }

  loadIndicators() {
    this.rsi = addIndicator('rsi', { weight: 14, name: 'rsi' });
    this.ema = addIndicator('ema', { weight: 20, name: 'ema20' });
    this.sma = addIndicator('sma', { weight: 50, name: 'sma50' });
  }
  async realtimeAdvice(candle: Candle) {}

  async advice() {
    const candle = this.candle;
    const lastBuy = this.tradeAdvisor?.longPrice;
    const rsi = this.rsi.result;
    const lowestPrice = this.candleStats.getHighLowForPeriod(21, false);
    const highestPrice = this.candleStats.getHighLowForPeriod(21, true);
    const choppines = this.returnPercentageIncrease(lowestPrice, highestPrice);

    this.checkTradeStatus(() => {
      return true;
    });
    // const tradingHours = candle.time.getHours() > 6;
    if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
      if (rsi < 80 && this.ema.result > this.sma.result && !candle.green && this.previousCandle.green) {
        if (choppines > 2) {
          this.tradeAdvisor.trade();
          this.candleCounter = 0;
          this.stopPrice = candle.close;
        } else {
          // console.log('Wont buy at', candle.time);
        }
      }
    }

    if (this.tradeAdvisor.inTrade) {
      if (candle.close > lastBuy) {
        if (candle.close < this.stopPrice) {
          this.tradeAdvisor.trade();
          this.stopPrice = 0;
        } else {
          this.stopPrice = this.previousCandle.open; // increase stop
        }
      } else if (candle.close < lastBuy) {
        this.tradeAdvisor.trade();
      }
    }
  }

  logStatus(advice: any): void {
    // logs strat specific info
    const heikin = ` ${
      this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
    } Heikin: ${this.heikin.close} `;
    let nextAction = 'looking to: ';
    nextAction += !this.tradeAdvisor.inTrade ? 'BUY' : 'SELL';
    let message = `${this.ticker.pair} PRICE: ${this.candle.close} ${heikin}. Advisor ${nextAction}. Profit: ${advice}`;
    this.consoleColour(message);
  }

  logColour(message: string, warning: boolean) {
    if (warning) {
      console.log('\u001b[' + 31 + 'm' + message + '\u001b[0m');
    } else {
      console.log('\u001b[' + 32 + 'm' + message + '\u001b[0m');
    }
  }
}
