import { Candle } from './candle';
import { TelegramBot } from './telegram-bot';
import { ChatGroups, Settings } from '../../settings';
import { IExchangeService } from '../services/IExchange-service';
import { TradeResponse } from './trade-response';
import { ordertypes, Side } from './literals';
import { Ticker } from './ticker';
import { LimitOrder } from './limit-order';

export abstract class Advisor {
    profitResults: number[];
    longQuantity = 0;
    message: string = '';
    telegram: TelegramBot;
    ticker: Ticker;
    abstract type: string;

    constructor(public exchange: IExchangeService) {
        this.telegram = new TelegramBot(ChatGroups.mainAccount);
        this.ticker = exchange.ticker;
    }
    abstract trade(price?: number, side?: Side): Promise<TradeResponse>;
    abstract end(closingPrice: any);
    abstract notifyTelegramBot(message: string): void;
    abstract addProfitResults(close: number, lastBuy: TradeResponse);
    abstract logBalance(): Promise<void>;
    async doSetup(sendMessage: boolean): Promise<void> {
        const messageService = new TelegramBot(ChatGroups.mainAccount);
        const message = `${this.constructor.name} started: ${this.exchange.ticker.pair}`;
        if (sendMessage) messageService.sendMessage(message);
        if (!this.type) throw new Error('Advisor Type not defined');
        await this.exchange.getExchangeInfo();
        this.ticker = await this.exchange.getTradingBalance();
        this.setup();
    }
    async createOrder(price: number, side: Side, quantity?: number): Promise<TradeResponse> {
        quantity = quantity ? quantity : this.ticker.currencyAmount / price;
        return this.exchange.createOrder(new LimitOrder(price, quantity, side));
    }
    protected abstract setup();
}
