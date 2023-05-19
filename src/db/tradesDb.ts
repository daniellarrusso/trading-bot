import { Schema, model } from 'mongoose';
import { TradeResponse } from '../model/trade-response';

export interface Trade {
  ticker: string;
  currencyQuantity: number;
  transactions: TradeResponse[];
}

const schema = new Schema<Trade>({
  ticker: { type: String },
  currencyQuantity: { type: Number },
  transactions: [],
});

export const TradeModel = model<Trade>('Trade', schema);
