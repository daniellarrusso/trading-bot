import { Percentage } from './percentage';
import { LimitOrder } from './limit-order';

export class PortfolioTrade {
  id: number;
  sellOrder: LimitOrder;
  buyOrder: LimitOrder;
  roundtripComplete: boolean;
  constructor(id: number, public tickSize, public percentage: Percentage) {
    this.id = id;
  }
  createSellOrder(price, percentage: Percentage) {
    const sellPrice = round(price * percentage.percent, +this.tickSize);
    this.sellOrder = new LimitOrder(sellPrice, percentage.quantity, 'sell')
    return this.sellOrder;
  }
  createBuyOrder(price, quantity) {
    const buyPrice = round(price, +this.tickSize);
    this.buyOrder = new LimitOrder(buyPrice, quantity, 'buy');
  }

  updateTrade() {
    this.buyOrder.price;
  }

  updatePrice(price: number) {
    let trimmedPrice = price + '';
    if (trimmedPrice > this.tickSize) {
      trimmedPrice = trimmedPrice.slice(0, this.tickSize.length - trimmedPrice.length);
      price = +trimmedPrice;
    }
    return price;
  }
}

function round(amount, tickSize) {
  var precision = 100000000;
  var t = getPrecision(tickSize);

  if (Number.isInteger(t)) precision = Math.pow(10, t);

  amount *= precision;
  amount = Math.floor(amount);
  amount /= precision;

  // https://gist.github.com/jiggzson/b5f489af9ad931e3d186
  // amount = scientificToDecimal(amount);

  return amount;
}
// Effectively counts the number of decimal places, so 0.001 or 0.234 results in 3
function getPrecision(tickSize) {
  if (!isFinite(tickSize)) return 0;
  var e = 1,
    p = 0;
  while (Math.round(tickSize * e) / e !== tickSize) {
    e *= 10;
    p++;
  }
  return p;
}
