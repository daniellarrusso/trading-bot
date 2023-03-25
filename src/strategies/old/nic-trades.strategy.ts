import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Logger } from '../../model/logger';
import { Strategy } from '../../model/strategy';
import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class NicTradesStrategy extends BaseStrategy {
  logger: Logger;
  rsi: Indicator;
  cci: Indicator;
  ema: Indicator;
  ema4hr: Indicator;
  sma: Indicator;
  smaLong: Indicator;
  buyTrigger: boolean;

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Nic Trades Strategy';
  }

  async realtimeAdvice(candle: Candle) {}

  loadIndicators() {
    this.cci = addIndicator('sniper-cci', {
      weight: 14,
      name: 'sniper-cci',
      input: 'close',
      inputType: 'heikin',
    });
    this.rsi = addIndicator('rsi', { weight: 14, name: 'rsi', input: 'close', inputType: 'heikin' });
    this.ema = addIndicator('ema', { weight: 20, name: 'ema20', input: 'close', inputType: 'heikin' });
    this.ema4hr = addIndicator('ema', { weight: 20, name: 'ema20', input: 'close', inputType: 'heikin' });
    this.sma = addIndicator('sma', { weight: 50, name: 'sma50', input: 'close', inputType: 'heikin' });
    this.smaLong = addIndicator('sma', { weight: 200, name: 'sma200', input: 'close', inputType: 'heikin' });
  }

  async advice() {
    const { result: cci, previousResult: prevCci } = this.cci;

    const ema = this.ema.result;
    const sma = this.sma.result;
    const smaLong = this.smaLong.result;
    const rsi = this.rsi.result;
    const ema4h = this.ema4hr.result;

    const masBullTrend = ema > sma;
    const heikinRedGreen = this.heikin.trend === 'up' && this.heikin.duration === 1;
    //const trendBroken = this.candle.close >= this.candleStats.highestPrice;

    this.checkTradeStatus(() => {
      return this.cci.result < 0;
    });

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (cci > 0) {
        /// buy
        this.buyTrigger = true;
        this.tradeAdvisor.trade();
      }
    }
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      // if (cci < 150 && prevCci > 150) {
      //   this.tradeAdvisor.trade();
      //   this.delayStrat.start(new CCIDelay(6, this.cci));
      // }
      if (this.heikin.close < ema) {
        this.buyTrigger = false;
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
    nextAction += this.tradeAdvisor.actionType === ActionType.Long ? 'BUY' : 'SELL';
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
