import { ChatGroups } from '../../settings';
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
    trade(price?: number, side?: Side): Promise<TradeResponse> {
        throw new Error('Method not implemented.');
    }
    end(closingPrice: any) {
        throw new Error('Method not implemented.');
    }
    notifyTelegramBot(message: string): void {
        throw new Error('Method not implemented.');
    }
    addProfitResults(close: number, lastBuy: TradeResponse) {
        throw new Error('Method not implemented.');
    }
    protected async setup() {
        try {
            this.ticker = await this.exchange.getTradingBalance();
            console.log(
                `Starting Live Advisor: Currency (${this.ticker.currency} ${this.ticker.currencyQuantity}). Asset (${this.ticker.asset} ${this.ticker.assetQuantity})`
            );
        } catch (error) {
            console.log(error);
        }
    }
}
