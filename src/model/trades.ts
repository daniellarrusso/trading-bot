import { Trader } from '../services/trader-service';
import { returnPercentageIncrease } from '../utilities/utility';
import { TradeResponse } from './trade-response';

export class Trades {
    private tradeResponses: TradeResponse[] = [];

    constructor(public trader: Trader) {}

    async addTrade(trade: TradeResponse, backTest: boolean) {
        this.tradeResponses.push(trade);
        try {
            !backTest && (await this.trader.trade(trade));
        } catch (error) {
            this.tradeResponses.pop();
            throw new Error('Error Adding Trade to MongoDb');
        }
    }

    checkTrades(isBacktest: boolean) {
        if (isBacktest) return;
    }

    get lastBuy(): TradeResponse {
        const filtered = this.tradeResponses.filter((tr) => tr.side === 'BUY');
        return filtered[filtered.length - 1];
    }

    get lastSell(): TradeResponse {
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

    get lastTradeId() {
        return this.lastTrade?.closeTime.getTime() ?? -1;
    }

    get averageBuy() {
        if (this.numBought)
            return (
                this.tradeResponses
                    .filter((b) => b.side === 'BUY')
                    .map((t) => +t.quotePrice)
                    .reduce((p, c) => p + c) / this.numBought
            );
    }

    get averageSold() {
        if (this.numSold)
            return (
                this.tradeResponses
                    .filter((b) => b.side === 'SELL')
                    .map((t) => +t.quotePrice)
                    .reduce((p, c) => p + c) / this.numSold
            );
    }

    get profit() {
        let increase = returnPercentageIncrease(this.averageBuy, this.averageSold);
        if (this.averageSold > this.averageBuy) return Math.abs(+increase);
        return increase;
    }

    deleteTradeResponses() {
        this.tradeResponses = [];
    }
}
