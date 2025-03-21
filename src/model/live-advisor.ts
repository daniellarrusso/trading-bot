import { BinanceService } from '../services/binance-service';
import { Ticker } from './ticker';
import { TelegramBot } from './telegram-bot';
import { ChatGroups, Settings } from '../../settings';
import { Advisor } from './advisor';
import { TradeResponse } from './trade-response';
import { ActionType } from './enums';
import { ordertypes, Side } from './literals';
import { Portfolio } from './portfolio';
import { IExchangeService } from '../services/IExchange-service';
import { LimitOrder } from './limit-order';

export class LiveAdvisor extends Advisor {
    profitResults = [];
    type = 'Live';

    constructor(exchange: IExchangeService) {
        super(exchange);
    }

    setup() {
        console.log(
            `Starting Live Advisor: Currency (${this.ticker.currency} ${this.ticker.currencyQuantity}). Asset (${this.ticker.asset} ${this.ticker.assetQuantity})`
        );
    }

    async logBalance() {
        try {
            await this.exchange.getTradingBalance();
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

    addProfitResults(lastSell, lastBuy) {
        const amount = ((lastSell.close - lastBuy.close) / lastBuy.close) * 100;
        this.profitResults.push(amount);
    }

    end(closingPrice: number) {
        throw new Error('Method not implemented.');
    }

    async notifyTelegramBot(message: string): Promise<void> {
        await this.telegram.sendMessage(message);
    }
}
