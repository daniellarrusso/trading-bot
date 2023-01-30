import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Logger } from '../../model/logger';
import { Strategy } from '../../model/strategy';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class FourWeekStrategy extends BaseStrategy {
  logger: Logger;
  fourWeek: Indicator;

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Four Week Strategy';
  }

  loadIndicators() {
    this.fourWeek = addIndicator('donchian', { weight: 20, name: '4 week' });
  }
  async realtimeAdvice(candle: Candle) {}
  async advice() {
    this.checkTradeStatus(() => {
      return true;
    });

    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (this.candle.high >= this.fourWeek.resultEntity.high) {
        this.tradeAdvisor.trade();
      }
    }
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      if (this.candle.low <= this.fourWeek.resultEntity.low) {
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
