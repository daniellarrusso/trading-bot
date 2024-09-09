import { Schema, model } from 'mongoose';

export interface TickerDb {
    ticker: string;
    amount: number;
    marketOrders: boolean;
    count: number;
}

export const TickerDbModel = model<TickerDb>(
    'Ticker',
    new Schema<Symbol>({
        ticker: { type: String, required: true },
        amount: { type: Number, default: 0 },
        marketOrders: { type: Boolean, default: false },
        count: { type: Number, default: 1 }
    })
);
