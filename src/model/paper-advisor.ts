import { TradeResponse } from './trade-response';
import { TelegramBot } from './telegram-bot';
import { ChatGroups } from '../../settings';
import { Advisor } from './advisor';
import { ordertypes, Side } from './literals';
import { IExchangeService } from '../services/IExchange-service';
import { ActionType } from './enums';
import { MockExchangeService } from '../services/mock-exchange.service';
import { Ticker } from './ticker';
import { LimitOrder } from './limit-order';
import { Trade } from '../db/trade';

export class PaperAdvisor extends Advisor {
    assetAmount = 0;
    currencyAmount = 10000;
    profitResults = [];
    telegram: TelegramBot;
    longQuantity: number;
    ticker: Ticker;
    type = 'Paper';

    constructor(public exchange: IExchangeService) {
        super(new MockExchangeService(exchange.ticker));
        this.telegram = new TelegramBot(ChatGroups.mainAccount);
        this.ticker = exchange.ticker;
        if (!(this.exchange instanceof MockExchangeService))
            this.exchange = new MockExchangeService(exchange.ticker);
    }

    notifyTelegramBot(message: string): void {
        this.telegram.sendMessage(message);
    }

    async setup(): Promise<void> {
        await console.log('Paper Trader set up');
    }

    async logBalance() {
        try {
            // await this.exchange.getTradingBalance();
            const { currency, asset, assetQuantity, currencyQuantity } = this.ticker;
            console.log(
                `New Balance: Currency (${currency} ${currencyQuantity}). Asset (${asset} ${assetQuantity}) `
            );
        } catch (error) {
            let errorMessage = error?.message;
            errorMessage += '. Could not get trading balance';
            console.log(errorMessage);
        }
    }

    addProfitResults(lastSell: number, lastBuy: Trade) {
        const amount = ((lastSell - lastBuy.price) / lastBuy.price) * 100;
        if (amount) this.profitResults.push(+amount.toFixed(2));
    }

    end(closingPrice: any) {
        throw new Error('Method not implemented.');
    }
}
