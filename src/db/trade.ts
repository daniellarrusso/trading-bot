import { Schema, model } from 'mongoose';

export interface Trade {
    date: Date;
    side: string;
    quantity: number;
    price: number;
    cost: number;
    asset: string;
    currency: string;
    closeTime: Date;
    advisorType: string;
    orderId: string;
    status: string;
}

const schema = new Schema<Trade>({
    date: { type: Date, default: new Date() },
    side: { type: String },
    quantity: { type: Number },
    price: { type: Number },
    cost: { type: Number },
    asset: { type: String, required: true },
    currency: { type: String },
    closeTime: { type: Date },
    advisorType: { type: String, required: true },
    orderId: { type: String, required: true },
    status: { type: String, required: true },
});

export const TradeModel = model<Trade>('Trade', schema);
