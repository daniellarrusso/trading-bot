import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';

import { IExchangeService } from '../../services/IExchange-service';
import { BaseStrategy } from '../base-strategy';

export class TakeProfitStrategy extends BaseStrategy {
  rsi: Indicator;
  cci: Indicator;
  ema: Indicator;
  sma: Indicator;
  smaLong: Indicator;
  buyTrigger: boolean;
  stopPrice = 0;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Take Profit Strat';
  }

  loadIndicators() {
    this.cci = addIndicator('sniper-cci', { weight: 14, name: 'sniper-cci' });
    this.rsi = addIndicator('rsi', { weight: 14, name: 'rsi' });
    this.ema = addIndicator('ema', { weight: 20, name: 'ema20' });
    this.sma = addIndicator('sma', { weight: 50, name: 'sma50' });
    this.smaLong = addIndicator('sma', { weight: 200, name: 'sma200' });
  }

  async realtimeAdvice(candle: Candle) {
    throw new Error('Method not implemented.');
  }
  async advice() {
    const candle = this.candle;
    const lastBuy = this.tradeAdvisor?.lastBuy.close;
    const ema = this.ema.result;
    const sma = this.sma.result;
    const smaLong = this.smaLong.result;
    const rsi = this.rsi.result;
    const trendBroken = this.candle.close > this.candleStats.getHighLowForPeriod(21, true);
    const lowestPrice = this.candleStats.getHighLowForPeriod(21, false);

    this.checkTradeStatus(() => {
      return true;
    });

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (trendBroken) {
        this.buyTrigger = true;
        this.tradeAdvisor.trade();
        this.stopPrice =
          candle.high - (candle.high - this.candleStats.getHighLowForPeriod(21, false)) * 0.786;
      }
    }
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      if (candle.close > lastBuy) {
        if (candle.close < this.stopPrice) {
          this.tradeAdvisor.trade();
          this.stopPrice = 0;
        } else if (trendBroken) {
          // idea make stop 0.786 of rise
          const newStop = candle.high - (candle.high - lowestPrice) * 0.382;
          this.stopPrice = newStop > this.stopPrice ? newStop : this.stopPrice; // raise STOP only if its higher
        }
      } else if (candle.close < ema) {
        this.tradeAdvisor.trade();
        this.stopPrice = 0;
      }
    }
  }

  logStatus(advice: any): void {
    // logs strat specific info
    const size = this.ticker.tickSize.length - 2;
    const heikin = ` ${
      this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
    } Heikin: ${this.heikin.close} `;
    let nextAction = 'looking to: ';
    nextAction += this.tradeAdvisor.actionType === ActionType.Long ? 'BUY' : 'SELL';
    let message = `${this.ticker.pair} PRICE: ${this.candle.close.toFixed(
      size
    )} ${heikin}. Advisor ${nextAction}. Profit: ${advice}`;
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
