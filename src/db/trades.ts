import { Schema, model } from 'mongoose';
import { TradeResponse } from '../model/trade-response';

export interface Trade {
  ticker: string;
  currencyAmount: number;
  marketOrders: boolean;
  transactions: TradeResponse[];
}

const schema = new Schema<Trade>({
  ticker: { type: String },
  currencyAmount: { type: Number },
  marketOrders: { type: Boolean },
  transactions: [],
});

export const TradeModel = model<Trade>('Trade', schema);
