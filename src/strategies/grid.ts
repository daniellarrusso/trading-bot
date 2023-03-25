import { Candle } from '../model/candle';
import { GridHistory, GridSettings } from '../model/grid-settings';
import { LimitOrder } from '../model/limit-order';
import { Strategy } from '../model/strategy';
import { Ticker } from '../model/ticker';
import { BaseStrategy } from './base-strategy';
import { GridOrders } from '../model/grid-orders';
import { Portfolio } from '../model/portfolio';
import { IExchangeService } from '../services/IExchange-service';

export class GridStrategy extends BaseStrategy {
  settings: GridSettings;
  entryPrice: number;
  gridInitialised: boolean;
  tickSize: number;
  gridOrders: GridOrders;
  ticker: Ticker;
  portfolio: Portfolio;
  gridHistory: GridHistory;
  isBusy: boolean = false;

  constructor(public strat: IExchangeService) {
    super(strat);
    // this.settings = {} // strat.gridSettings;
    if (!this.settings) throw new Error('Grid Settings Required');
    this.ticker = this.strat.exchange.ticker;
    this.strategyName = 'GRID BOT Strategy';

    this.tickSize = this.ticker.tickSize.length - 2;
    this.gridOrders = new GridOrders(this.settings, this.strat);
  }

  async realtimeAdvice(candle: Candle) {
    if (this.gridInitialised && !this.isBusy) {
      for (let i = 0; i < this.gridOrders.orderList.length; i++) {
        const order = this.gridOrders.orderList[i];
        // if (this.priceReached(order, candle.close)) {
        this.isBusy = true;
        try {
          const msg = await this.gridOrders.checkOrderStatus(order);
          if (msg) this.logMessage();
        } catch (error) {
          console.log(`realtimeAdvice:: ${error}`);
        }
        this.isBusy = false;
        // }
      }
    } else {
      await this.initialiseGrid();
    }
  }

  async initialiseGrid() {
    if (!this.gridInitialised && !this.isBusy) {
      this.isBusy = true;
      console.log(`Initilising Grid Bot for ${this.pair}`);

      this.ticker = await this.strat.exchange.getTradingBalance();
      const currentPrice = Number(await this.strat.exchange.getPrice());
      // this.gridHistory = new GridHistory(currentPrice, this.ticker.assetQuantity);
      // this.gridHistory.add(new LimitOrder(0.0051186, 0.00933, 'sell'));
      // this.gridHistory.add(new LimitOrder(48976, 0.00933, 'sell'));
      // this.gridHistory.add(new LimitOrder(50109, 0.00933, 'sell'));
      // this.gridHistory.add(new LimitOrder(48976, 0.00933, 'buy'));
      // this.gridHistory.add(new LimitOrder(46709, 0.00933, 'buy'));
      // this.gridHistory.add(new LimitOrder(48976, 0.00933, 'sell'));

      if (!this.settings.quantity) this.settings.quantity = +this.ticker.assetQuantity;
      this.settings.quantity /= this.settings.ordersPlaced;
      this.settings.quantity = this.strat.exchange.exchange.roundStep(
        this.settings.quantity,
        this.ticker.stepSize
      );
      this.logSellOrders(currentPrice);
      this.logBuyOrders(currentPrice);
      try {
        const init = await this.gridOrders.createGridOrder(currentPrice);
        this.gridInitialised = init;
      } catch (error) {
        console.log(error);
        this.gridInitialised = false;
      }
      this.isBusy = false;
    }
  }

  priceReached(order: LimitOrder, close): boolean {
    if (!order.orderId) return false;
    if (order.side === 'buy' && close <= order.price) {
      return true;
    }
    if (order.side === 'sell' && close >= order.price) {
      return true;
    }
    return false;
  }

  logStatus() {
    if (this.gridOrders.statusUpdate) {
      console.log(`${this.ticker.asset} updated and new orders created: ${this.candle.closeTime}`);
      this.gridOrders.statusUpdate = false;
    }
  }

  private logMessage() {
    const { asset } = this.ticker;
    const trade = this.gridOrders.lastTrade;
    const message = `${trade.quantity} ${asset} ${trade.side} for ${this.strat.exchange.normalisePrice(
      trade.price
    )}`;
    this.consoleColour(message);
    this.telegram.sendMessage(message);
  }

  loadIndicators() {
    console.log('Indicators Loaded... This strat will not use Indicators or Advisors');
  }

  async advice() {}

  private logSellOrders(price: number) {
    let { interval } = this.settings;
    let i = 1;
    const sellList = [];
    do {
      const origPrice = price;
      price = price + interval;
      const p = ((price - origPrice) / origPrice) * 100;
      sellList.push(
        `${this.pair} Sell order ${i}: ${price.toFixed(this.tickSize)} quantity: ${
          this.settings.quantity
        }. Percent: ${p.toFixed(2)}. Amount: ${(price * this.settings.quantity).toFixed(2)}`
      );
      i++;
    } while (price < this.settings.maxPrice);

    sellList.reverse().map((i) => console.log(i));
  }

  private logBuyOrders(price: number) {
    const { interval, quantity } = this.settings;
    let i = 1;
    let currencyRequired = 0;
    do {
      price = price - interval;
      currencyRequired += price * quantity;
      console.log(`${this.pair} Buy order ${i}: ${price.toFixed(this.tickSize)} quantity: ${quantity}`);
      i++;
    } while (price > this.settings.minPrice);
    this.hasCurrency(currencyRequired);
  }

  private hasCurrency(currencyRequired: number) {
    if (this.ticker.currencyQuantity < currencyRequired) {
      console.info(`\nStrategy requires ${currencyRequired} ${this.ticker.currency} to continue`);
      // process.exit(1);
    }
  }
}
