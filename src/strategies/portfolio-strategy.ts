import { Candle } from '../model/candle';
import { Strategy } from '../model/strategy';
import { Percentage } from '../model/percentage';
import { CandleStatistics } from '../model/candle-statistics';
import { PortfolioTrades } from '../model/portfolio-trades';
import { PortfolioTrade } from '../model/portfolio-trade';
import { Portfolio } from '../model/portfolio';

export class PortfolioStrategy {
  candle: Candle;
  trades: PortfolioTrades;
  portfolio: Portfolio;
  orderQuantity: number;
  messageLogged: boolean;
  // percentages: Percentage[] = [new Percentage(1.01), new Percentage(1.03), new Percentage(1.05), new Percentage(1.08), new Percentage(1.13)];
  // percentages: Percentage[] = [new Percentage(1.08), new Percentage(1.13),new Percentage(1.21)];
  percentages: Percentage[] = [
    new Percentage(1.03),
    new Percentage(1.05),
    new Percentage(1.08),
    new Percentage(1.13),
  ];
  constructor(public strat: Strategy, public stats: CandleStatistics) {
    this.trades = new PortfolioTrades(this.strat, this.stats);
    this.portfolio = this.strat.portfolio;
    this.orderQuantity = this.portfolio.total / this.portfolio.multiplier;
  }

  async update() {
    this.candle = this.strat.exchange.ticker.candle;
    this.generateTrades();
    for (let i = 0; i < this.trades.tradeList.length; i++) {
      await this.trade(this.trades.tradeList[i]);
    }
  }

  generateTrades() {
    this.percentages.map((p) => {
      if (this.trades.tradeList.length < this.portfolio.multiplier) {
        if (!p.taken) {
          p.quantity = this.orderQuantity;
          this.trades.addTrade(p);
          p.taken = true;
        }
      }
    });
  }

  async trade(trade: PortfolioTrade) {
    await this.trades.checkOrderStatus(trade);
    if (this.candle.close >= trade.sellOrder.price && !trade.sellOrder.triggered) {
      await this.trades.triggerLimitOrder(trade.sellOrder);
      this.messageLogged = true;
    }
  }
}
