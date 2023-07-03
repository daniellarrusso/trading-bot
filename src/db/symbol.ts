import { Schema, model } from 'mongoose';

export interface Symbol {
    symbol: string;
}

export const SymbolModel = model<Symbol>(
    'Symbol',
    new Schema<Symbol>({
        symbol: { type: String, required: true },
    })
);
