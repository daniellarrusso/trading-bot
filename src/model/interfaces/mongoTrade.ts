export interface Transaction {
  action: string;
  amount: number;
}

export interface Trade {
  ticker: string;
  nextAction: string;
  inTrade: boolean;
  lastBuy: number;
  transactions: Transaction[];
}
