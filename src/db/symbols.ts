import { Schema, model } from 'mongoose';

export interface Symbol {
  symbol: string;
  amount: number;
  marketOrders: boolean;
}

export const SymbolModel = model<Symbol>(
  'Symbol',
  new Schema<Symbol>({
    symbol: { type: String, required: true },
    amount: { type: Number, default: 0 },
    marketOrders: { type: Boolean, default: false },
  })
);
