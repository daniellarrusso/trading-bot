import { Portfolio } from './portfolio';

export class AlternatorAdvisor {
  private readonly _orderQuantity: number;

  total: number;
  constructor(public portfolio: Portfolio) {
    this._orderQuantity = portfolio.total / portfolio.multiplier;
    this.total = portfolio.total;
  }

  get orderQuantity() {
    return this._orderQuantity;
  }

  addTotal(newPrice: number) {
    this.total += this._orderQuantity;
    this.portfolio.buyPrice = newPrice;
  }

  subtractTotal() {
    this.total -= this._orderQuantity;
  }
}
