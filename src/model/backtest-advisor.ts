import { TradeResponse } from './trade-response';
import { Advisor } from './advisor';
import { Settings } from '../../settings';
import { Side } from './literals';
import { ActionType } from './enums';
import { MockExchangeService } from '../services/mock-exchange.service';
import { Ticker } from './ticker';
import { IExchangeService } from '../services/IExchange-service';
import { LimitOrder } from './limit-order';
import { Trade } from '../db/trades';

export class BacktestAdvisor extends Advisor {
    assetAmount = 0;
    currencyAmount = 1000;
    profitResults = [];
    ticker: Ticker;
    type = 'Backtest';

    constructor(public exchange: IExchangeService) {
        super(exchange);

        this.ticker.setActionType(ActionType.Long);
        if (!(this.exchange instanceof MockExchangeService))
            this.exchange = new MockExchangeService(exchange.ticker);
    }

    async trade(price?: number, side?: Side): Promise<Trade> {
        if (!price) price = this.ticker.candle.close;
        if (!side) side = this.ticker.action === ActionType.Long ? 'buy' : 'sell';
        const quantity = this.ticker.currencyAmount / price;
        return this.exchange.createOrder(new LimitOrder(price, quantity, side));
    }

    async logBalance() {
        // try {
        //     // await this.exchange.getTradingBalance();
        //     const { currency, asset, assetQuantity, currencyQuantity } = this.ticker;
        //     console.log(
        //         `New Balance: Currency (${currency} ${currencyQuantity}). Asset (${asset} ${assetQuantity}) `
        //     );
        // } catch (error) {
        //     let errorMessage = error?.message;
        //     errorMessage += '. Could not get trading balance';
        //     console.log(errorMessage);
        // }
    }

    addProfitResults(closingPrice: number, lastBuy: Trade) {
        const amount = ((closingPrice - lastBuy.price) / lastBuy.price) * 100;
        if (amount) this.profitResults.push(+amount.toFixed(2));
    }

    end(prices) {
        if (prices.lastBuyPrice) {
            this.addProfitResults(prices.closingPrice, prices.lastBuyPrice);
        }
        if (this.profitResults.length > 0) {
            const finalResult = this.profitResults.reduce((p, c) => p + c, 0);
            console.log('Profit from Backtest: ' + finalResult);
        }

        console.log(
            'Market Rise/Fall: ' + ((prices.closingPrice - prices.startingPrice) / prices.startingPrice) * 100
        );
        this.profitResults.length = 0;
        this.currencyAmount = !this.currencyAmount
            ? this.assetAmount * prices.closingPrice
            : this.currencyAmount;
        this.assetAmount = !this.assetAmount ? this.currencyAmount / prices.closingPrice : this.assetAmount;
        console.log(
            `USDT Profit: ${this.currencyAmount}, Asset Profit: ${this.currencyAmount / prices.closingPrice}`
        );
    }

    setup() {
        console.log('No setup required');
    }

    notifyTelegramBot() {}
}
