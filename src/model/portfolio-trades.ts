import { CandleStatistics } from './candle-statistics';
import { PortfolioTrade } from './portfolio-trade';
import { TelegramBot } from './telegram-bot';
import { ChatGroups } from '../../settings';
import { Percentage } from './percentage';
import { Candle } from './candle';
import { LimitOrder } from './limit-order';
import { TimeSync } from './timeSync';
import { IExchangeService } from '../services/IExchange-service';

export class PortfolioTrades {
  tradeId = 0;
  tradeList: PortfolioTrade[] = [];
  exchange: IExchangeService;
  telegram: TelegramBot;
  candle: Candle;
  timeSync: TimeSync;
  constructor(public strategy: IExchangeService, public stats: CandleStatistics) {
    this.exchange = strategy;
    this.candle = this.strategy.exchange.ticker.candle;
    this.telegram = new TelegramBot(ChatGroups.mainAccount);
    this.timeSync = new TimeSync();
  }

  addTrade(percentage: Percentage) {
    const newTrade = new PortfolioTrade(++this.tradeId, this.strategy.exchange.ticker.tickSize, percentage);
    const sellPrice = this.calculateSellPrice();
    const sellOrder = newTrade.createSellOrder(sellPrice, percentage);

    let buybackPrice =
      sellOrder.price - (sellOrder.price - this.stats.getHighLowForPeriod(21, false)) * percentage.fibRatio;
    newTrade.createBuyOrder(buybackPrice, percentage.quantity);

    this.tradeList.push(newTrade);
  }

  updateBuyPrices(trades: PortfolioTrade[]) {
    const size = this.strategy.exchange.ticker.tickSize.length - 2;
    const lowPrice = this.stats.getHighLowForPeriod(21, false);
    trades.map((t) => {
      if (!t.buyOrder.triggered) {
        t.buyOrder.price = t.sellOrder.price - (t.sellOrder.price - lowPrice) * t.percentage.fibRatio;
        t.buyOrder.price = +t.buyOrder.price.toFixed(size);
      }
    });
  }

  calculateSellPrice() {
    let result;
    // const buyPriceSet = this.strategy.portfolio.buyPrice;
    // if (buyPriceSet) {
    //   this.strategy.portfolio.buyPrice > this.strategy.exchange.ticker.candle.close
    //     ? (result = this.strategy.portfolio.buyPrice)
    //     : (result = this.strategy.exchange.ticker.candle.close);
    // } else {
    //   result = Math.max(
    //     this.stats.getHighLowForPeriod(21, false),
    //     this.strategy.exchange.ticker.candle.close
    //   );
    // }
    // return result;
  }

  calculateBuyPrice() {}

  async triggerLimitOrder(order: LimitOrder) {
    const size = this.strategy.exchange.ticker.tickSize.length - 2;
    try {
      const response = await this.exchange.createLimitOrder(order);
      order.orderId = response.orderId;
      order.triggered = true;
      let message = `${order.side.toUpperCase()} Limit order triggered for ${order.quantity} ${
        this.exchange.ticker.pair
      } at ${order.price.toFixed(size)}`;
      this.notifyTelegramGroup(message);
    } catch (error) {
      console.log(error.body);
    }
  }

  async checkOrderStatus(trade: PortfolioTrade) {
    if (trade.sellOrder.triggered && !trade.buyOrder.triggered) {
      try {
        const orderCompletion = await this.exchange.checkOrderStatus(trade.sellOrder.orderId);
        if (orderCompletion.status === 'FILLED') {
          this.updateTrade(trade.sellOrder);
          try {
            await this.triggerLimitOrder(trade.buyOrder);
          } catch (error) {
            console.log(error.body);
          }
        }
      } catch (error) {
        console.log(error.body);
        await this.timeSync.syncTime();
      }
    } else if (trade.buyOrder.triggered) {
      try {
        const orderCompletion = await this.exchange.checkOrderStatus(trade.buyOrder.orderId);
        if (orderCompletion.status === 'FILLED' || orderCompletion.status === 'CANCELED') {
          this.updateTrade(trade.buyOrder);
          trade.roundtripComplete = true;
          trade.percentage.taken = false;
          this.removeTrade(trade.id);
          this.updateBuyPrices(this.tradeList.filter((t) => t.id !== trade.id));
        }
      } catch (error) {
        console.log(error.body);
        await this.timeSync.syncTime();
      }
    }
  }

  updateTrade(order: LimitOrder) {
    order.complete = true;
  }

  removeTrade(tradeId: number) {
    const index = this.tradeList.findIndex((t) => t.id === tradeId);
    this.tradeList.splice(index, 1);
  }

  notifyTelegramGroup(message) {
    this.telegram.sendMessage(message);
  }

  long(candle: Candle, amount?: number) {
    throw new Error('Method not implemented.');
  }
  short(candle: Candle) {
    throw new Error('Method not implemented.');
  }
  end(closingPrice: any) {
    throw new Error('Method not implemented.');
  }
  notifyTelegramBot(message: any): void {
    throw new Error('Method not implemented.');
  }
  addProfitResults(lastSell: Candle, lastBuy: Candle) {
    throw new Error('Method not implemented.');
  }
}
