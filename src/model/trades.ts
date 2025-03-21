import { Trade, TradeModel } from '../db/trade';
import { IExchangeService } from '../services/IExchange-service';
import { returnPercentageIncrease } from '../utilities/utility';

export class Trades {
    private tradeResponses: Trade[] = [];

    constructor() {}

    async addTrade(trade: Trade) {
        this.tradeResponses.push(trade);
        if (trade.advisorType === 'Backtest') return;
        const doc = new TradeModel(trade);
        await doc.save();
    }

    removeTrade(trade: Trade) {
        const index = this.tradeResponses.indexOf(trade);
        this.tradeResponses.splice(index, 1);
    }

    checkTrades(isBacktest: boolean) {
        if (isBacktest) return;
    }

    async completeLimitOrder(exchange: IExchangeService) {
        try {
            const hasClosed = await exchange.updateOrder(this.lastTrade);
            this.lastTrade.status = 'complete';
            if (!hasClosed) {
                setTimeout(() => {
                    console.log('OrderId: ' + this.lastTrade.orderId + ' Not Completed');
                    this.completeLimitOrder(exchange);
                }, 10000);
            } else {
                const doc = await TradeModel.findOne({ orderId: this.lastTrade.orderId });
                doc.status = 'complete';

                await doc.save();
            }
        } catch (error) {
            console.log(error);
        }
    }

    get lastBuy(): Trade {
        const filtered = this.tradeResponses.filter((tr) => tr.side === 'BUY');
        return filtered[filtered.length - 1];
    }

    get lastSell(): Trade {
        const filtered = this.tradeResponses.filter((tr) => tr.side === 'SELL');
        return filtered[filtered.length - 1];
    }

    get numBought(): number {
        return this.tradeResponses.filter((t) => t.side === 'BUY').length;
    }

    get numSold(): number {
        return this.tradeResponses.filter((t) => t.side === 'SELL').length;
    }

    get lastTrade() {
        return this.tradeResponses[this.tradeResponses.length - 1];
    }

    get averageBuy() {
        if (this.numBought)
            return (
                this.tradeResponses
                    .filter((b) => b.side === 'BUY')
                    .map((t) => +t.price)
                    .reduce((p, c) => p + c) / this.numBought
            );
    }

    get averageSold() {
        if (this.numSold)
            return (
                this.tradeResponses
                    .filter((b) => b.side === 'SELL')
                    .map((t) => +t.price)
                    .reduce((p, c) => p + c) / this.numSold
            );
    }

    get profit() {
        let increase = returnPercentageIncrease(this.averageSold, this.averageBuy);
        if (this.averageSold > this.averageBuy) return Math.abs(+increase);
        return increase;
    }

    deleteTradeResponses() {
        this.tradeResponses = [];
    }
}
