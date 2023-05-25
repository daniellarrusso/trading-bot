import { Schema, model } from 'mongoose';

export interface Symbol {
    ticker: string;
    amount: number;
    marketOrders: boolean;
}

export const SymbolModel = model<Symbol>(
    'Symbol',
    new Schema<Symbol>({
        ticker: { type: String, required: true },
        amount: { type: Number, default: 0 },
        marketOrders: { type: Boolean, default: false },
    })
);
