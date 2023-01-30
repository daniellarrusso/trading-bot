import { Indicator } from '../../model/indicator';
import { addIndicator } from '../../indicators/base-indicator';
import { BaseStrategy } from '../base-strategy';
import { Trader } from '../../services/trader-service';
import { Strategy } from '../../model/strategy';
import { PaperAdvisor } from '../../model/paper-advisor';
import { PortfolioStrategy } from '../portfolio-strategy';
import { PortfolioAdvisor } from '../../model/portfolio-advisor';
import { BacktestAdvisor } from '../../model/backtest-advisor';
import { Candle } from '../../model/candle';

export class AlternatorStrategy extends BaseStrategy {
  rsi: Indicator;
  portfolio: PortfolioStrategy;

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Alternator Strategy';
  }

  loadIndicators() {
    this.rsi = addIndicator('rsi', { weight: 14, name: 'rsi' });
    this.portfolio = new PortfolioStrategy(this.strat, this.candleStats);
  }

  async realtimeAdvice(candle: Candle) {}

  async advice() {
    if (!(this.tradeAdvisor.advisor instanceof BacktestAdvisor)) {
      await this.portfolio.update();
    }

    this.checkTradeStatus(() => {
      return true;
    });
  }

  logStatus(advice: any): void {
    const size = this.ticker.tickSize.length - 2;
    if (this.candle.close !== this.previousCandle.close) this.portfolio.messageLogged = false;
    let warning = !this.portfolio.trades.tradeList.some((o) => this.candle.close > o.buyOrder.price);
    let message = `${this.ticker.pair} LAST PRICE: ${this.candle.close.toFixed(size)}\n`;
    this.portfolio.trades.tradeList.map((o) => {
      const percent = o.percentage.percent.toString().split('.')[1];
      message += `Buy: ${this.labelGreen(
        o.buyOrder.price.toFixed(size),
        !o.buyOrder.triggered
      )}\tSell: ${this.labelGreen(o.sellOrder.price.toFixed(size), !o.sellOrder.triggered)}\t${percent}% \t ${
        o.sellOrder.quantity
      }\n`;
    });
    if (!this.portfolio.messageLogged) {
      this.consoleColour(message);
      this.portfolio.messageLogged = true;
    }
  }

  labelGreen(text, success: boolean) {
    return success ? '\u001b[' + 31 + 'm' + text + '\u001b[0m' : '\u001b[' + 32 + 'm' + text + '\u001b[0m';
  }

  logColour(message: string, warning: boolean) {
    if (warning) {
      console.log('\u001b[' + 31 + 'm' + message + '\u001b[0m');
    } else {
      console.log('\u001b[' + 32 + 'm' + message + '\u001b[0m');
    }
  }
}
