import { ChatGroups } from '../../settings';
import { Trade } from '../db/trade';
import { IExchangeService } from '../services/IExchange-service';
import { Advisor } from './advisor';
import { Side, ordertypes } from './literals';
import { TelegramBot } from './telegram-bot';
import { Ticker } from './ticker';
import { TradeResponse } from './trade-response';

export class OrderAdvisor extends Advisor {
    profitResults = [];
    type = 'Orders';

    constructor(exchange: IExchangeService) {
        super(exchange);
    }

    end(closingPrice: any) {
        throw new Error('Method not implemented.');
    }
    notifyTelegramBot(message: string): void {
        console.log('Method not implemented.');
    }
    addProfitResults(close: number, lastBuy: Trade) {
        throw new Error('Method not implemented.');
    }

    logBalance() {
        const { currency, asset, assetQuantity, currencyQuantity } = this.ticker;
        console.log(
            `New Balance: Currency (${currency} ${currencyQuantity}). Asset (${asset} ${assetQuantity}) `
        );
    }

    protected async setup() {
        try {
            this.ticker = await this.exchange.getTradingBalance();
            console.log(
                `Starting Order Advisor: Currency (${this.ticker.currency} ${this.ticker.currencyQuantity}). Asset (${this.ticker.asset} ${this.ticker.assetQuantity})`
            );
        } catch (error) {
            console.log(error);
        }
    }
}
