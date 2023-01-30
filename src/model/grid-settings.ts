import { LimitOrder } from './limit-order';

export class GridSettings {
  interval: number = 0;
  constructor(
    public minPrice: number,
    public maxPrice: number,
    public ordersPlaced: number = 15,
    public quantity: number = 0
  ) {
    this.interval = (this.maxPrice - this.minPrice) / this.ordersPlaced;
    console.log(
      `Strategy Settings:
  Min Price: ${this.minPrice}
  Max Price: ${this.maxPrice}
  No. Orders Placed: ${this.ordersPlaced}
  Interval: ${this.interval}`
    );
  }
}

export class GridHistory {
  public history: LimitOrder[] = [];
  public lastOrder: LimitOrder;
  public gridProfit: number = 0;
  public floatPNL: number = 0;

  constructor(public entryPrice, public assetQuantity: number) {}

  public add(order: LimitOrder) {
    this.history.push(order);
    this.lastOrder = order;
    if (order.side === 'sell') this.addGridProfit();
    this.logProfit();
  }

  private addGridProfit() {
    const prices = this.history
      .map((p) => p.price)
      .filter((o) => o < this.lastOrder.price)
      .sort();

    const lastPrice = prices.pop();
    const marker = this.entryPrice > (lastPrice ? lastPrice : 0) ? this.entryPrice : lastPrice;
    this.gridProfit += (this.lastOrder.price - marker) * this.lastOrder.quantity;
  }

  private logProfit() {
    let sum = this.entryPrice;
    const buyOrders = this.history.filter((o) => o.side === 'buy');
    buyOrders.map((o) => {
      sum += o.price;
    });
    this.calculateAssetQuantity();
    const avgBuyPrice = sum > 0 ? sum / (buyOrders.length + 1) : this.entryPrice;
    this.floatPNL = (this.lastOrder.price - avgBuyPrice) * this.assetQuantity;
    console.log('Floating PNL: ' + this.floatPNL + ' Grid Profit: ' + this.gridProfit);
    console.log('Profit: ' + (this.floatPNL + this.gridProfit));
  }

  private calculateAssetQuantity() {
    this.assetQuantity = +this.assetQuantity;
    const { side, quantity } = this.lastOrder;
    this.assetQuantity = side === 'sell' ? this.assetQuantity - quantity : this.assetQuantity + quantity;
  }
}
