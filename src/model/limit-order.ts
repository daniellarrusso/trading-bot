import { BinanceService } from '../services/binance-service';
import { OrderType } from './enums';
import { TradeResponse } from './trade-response';

export class LimitOrder {
  orderId: number;
  triggered: boolean;
  complete: boolean = false;
  constructor(public price: any, public quantity: number, public side: string) { }
}

export interface IOrder {
  exchange: BinanceService;
  price: number;
  FEE: number;
  type: string;
  quantity: number;
  isLong: boolean;
  inTrade: boolean;
  tradeResponse: TradeResponse;
  createOrder(exchange: BinanceService, percentage: number);
  executeOrder();
  cancelOrder();
  handleResponse();
}

export class MarketOrder implements IOrder {
  exchange: BinanceService;
  FEE: number = 0.999;
  type: string;
  quantity: number = 0;
  tradeResponse: TradeResponse;
  inTrade: boolean;
  constructor(public price: number, public isLong: boolean, quantity: number = 0) {
    this.inTrade = true;
    this.quantity = quantity;
    this.type = this.isLong ? 'marketBuy' : 'marketSell';
  }

  async createOrder(exchange, percentage) {
    this.exchange = exchange;
    await this.setQuantity(percentage);
  }
  private async setQuantity(percentage) {
    const exchange = this.exchange;
    try {
      await exchange.getTradingBalance();
      if (this.isLong) {
        this.quantity = ((exchange.ticker.currencyQuantity / this.price) * this.FEE) / percentage;
        this.quantity = exchange.round(+this.quantity, +exchange.ticker.minQty);
      } else {
        this.quantity = exchange.round(+exchange.ticker.assetQuantity, +exchange.ticker.minQty);
      }
    } catch (error) {
      console.error(
        `${this.type} ${exchange.ticker.pair} Error: ${error.body} \nPrice: ${this.price} Amount: ${this.quantity}`
      );
    }
  }
  async executeOrder(exchange?: any) {
    if (exchange) {
      this.exchange = exchange;
    }
    if (!this.exchange) {
      throw new Error('Exchange not created...');
    }
    const response = await this.exchange.marketOrderSpoof(this);
    this.inTrade = false;
    return response;
  }
  cancelOrder() {
    throw new Error('Method not implemented.');
  }
  handleResponse() {
    throw new Error('Method not implemented.');
  }
}

export class LimitOrderPercentage implements IOrder {
  exchange: BinanceService;
  FEE: number = 0.999;
  type: string;
  quantity: number = 0;
  tradeResponse: TradeResponse;
  inTrade: boolean;
  constructor(public price: number, public isLong: boolean) { }

  async createOrder(exchange: BinanceService, percentage) {
    this.exchange = exchange;
    this.inTrade = true;
    this.type = this.isLong ? 'buy' : 'sell';
    await this.getQuantity(percentage);
  }
  private async getQuantity(percentage) {
    const exchange = this.exchange;
    try {
      await exchange.getTradingBalance();
      if (this.isLong) {
        this.quantity = ((exchange.ticker.currencyQuantity / this.price) * this.FEE) / percentage;
        this.quantity = exchange.round(+this.quantity, +exchange.ticker.minQty);
      } else {
        this.quantity = exchange.round(+exchange.ticker.assetQuantity, +exchange.ticker.minQty);
      }
    } catch (error) {
      console.error(
        `${this.type} ${exchange.ticker.pair} Error: ${error.body} \nPrice: ${this.price} Amount: ${this.quantity}`
      );
    }
  }
  executeOrder() {
    if (!this.exchange) {
      throw new Error('Exchange not created...');
    }
    // this.exchange.limitOrder(this);
  }
  cancelOrder() {
    throw new Error('Method not implemented.');
  }
  handleResponse() {
    throw new Error('Method not implemented.');
  }
}
