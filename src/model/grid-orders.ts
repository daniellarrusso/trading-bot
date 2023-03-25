import { IExchangeService } from '../services/IExchange-service';
import { Candle } from './candle';
import { GridHistory, GridSettings } from './grid-settings';
import { LimitOrder, MarketOrder } from './limit-order';
import { Strategy } from './strategy';
import { TradeResponse } from './trade-response';

export class GridOrders {
  orderList: LimitOrder[] = [];
  history: LimitOrder[] = [];
  lastTrade: LimitOrder;
  tickSize: number;
  canCreateGrid: boolean;
  candle: Candle;
  statusUpdate: boolean = false;
  pair: string;
  gridHistory: GridHistory;

  constructor(public settings: GridSettings, public strat: IExchangeService) {
    this.tickSize = this.strat.ticker.tickSize.length - 2;
    this.pair = this.strat.ticker.pair;
  }

  async createGridOrder(midPrice: number) {
    if (!this.gridHistory)
      this.gridHistory = new GridHistory(midPrice, this.strat.exchange.ticker.assetQuantity);
    const { pair } = this.strat.exchange.ticker;
    const existingBuyOrder = await this.getExistingOrder('BUY');
    const existingSellOrder = await this.getExistingOrder('SELL');
    if (!existingBuyOrder) {
      await this.createLimitOrder(midPrice, 'buy');
    } else {
      const limitOrder = new LimitOrder(existingBuyOrder.price, +existingBuyOrder.origQty, 'buy');
      limitOrder.orderId = existingBuyOrder.orderId;
      this.orderList.push(limitOrder);
    }
    if (!existingSellOrder) {
      await this.createLimitOrder(midPrice, 'sell');
    } else {
      const limitOrder = new LimitOrder(existingSellOrder.price, +existingSellOrder.origQty, 'sell');
      limitOrder.orderId = existingSellOrder.orderId;
      this.orderList.push(limitOrder);
    }

    this.orderList.map((o) => {
      if (!o) {
        // this.strat.advisor.notifyTelegramBot('Deprecated');
      }
      console.log(
        `grid-orders.orderList:: Side ${o.side}, ${pair} Amount: ${o.quantity}, @${o.price}, OrderId: ${o.orderId}`
      );
    });
    return Promise.resolve(true);
  }

  async getExistingOrder(side: string): Promise<TradeResponse> {
    const orders: TradeResponse[] = await this.strat.exchange.getOrders(this.strat.exchange.ticker.pair);
    const matchedOrders = orders.filter((o) => o?.side === side);
    if (matchedOrders.length > 0) {
      return this.matchExistingOrder(matchedOrders);
    }
    return null;
  }

  matchExistingOrder(arr: TradeResponse[]): TradeResponse {
    const closest = arr.find((o) => Number(o.origQty) == this.settings.quantity);
    return closest;
  }

  async createLimitOrder(price: number, side: string) {
    const interval = this.settings.interval;
    price = side === 'buy' ? price - interval : price + interval;
    const order = new LimitOrder(+price.toFixed(this.tickSize), this.settings.quantity, side);
    if (
      (price < this.settings.minPrice && side == 'buy') ||
      (side == 'sell' && price > this.settings.maxPrice)
    ) {
      console.log(side.toUpperCase() + ' ' + this.pair + ': Price exceeds range!!');
      // this.strat.advisor.notifyTelegramBot('deprecated');
      return false;
    }
    try {
      const response = await this.strat.exchange.createLimitOrder(order);
      order.orderId = response.orderId;
      this.orderList.push(order);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async checkOrderStatus(order: LimitOrder) {
    try {
      const orderCompletion = await this.strat.exchange.checkOrderStatus(order.orderId);
      if (orderCompletion.status === 'FILLED') {
        order.complete = true;
        const cancelledId = await this.cancelOrder(); // should remove cancelled order if present
        this.removeFromOrderList(+cancelledId);
        this.gridHistory.add(order);
        this.lastTrade = order;
        this.removeFromOrderList(order.orderId);
        await this.createGridOrder(+order.price);
        this.statusUpdate = true;
        return this.statusUpdate;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error.body);
    }
  }

  async cancelOrder(): Promise<any> {
    const cancelledOrder = this.orderList.find((o) => o.complete != true);
    try {
      if (cancelledOrder) {
        const response: TradeResponse = await this.strat.exchange.cancelOrder(cancelledOrder.orderId);
        console.log(`${cancelledOrder.side} order cancelled: Id: ${cancelledOrder.orderId}`);
        return response.orderId;
      } else {
        return Promise.resolve(1);
      }
    } catch (error) {
      console.log(error);
    }
  }

  removeFromOrderList(id: number) {
    const orderIndex = this.orderList.findIndex((o) => o.orderId == id);
    this.orderList.splice(orderIndex, 1);
    if (this.orderList.length > 0) {
      this.orderList.map((o) => {
        console.log(`${this.strat.exchange.ticker.pair} Order: ${o.orderId} - ${o.side} - $${o.price}`);
      });
    }
  }

  buyAsset(price: number, quantity: number) {
    const order = new MarketOrder(price, true, quantity);
    return order.executeOrder();
  }
}
