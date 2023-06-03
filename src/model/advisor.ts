import { Candle } from './candle';
import { TelegramBot } from './telegram-bot';
import { ChatGroups, Settings } from '../../settings';
import { IExchangeService } from '../services/IExchange-service';
import { TradeResponse } from './trade-response';
import { ordertypes, Side } from './literals';
import { Ticker } from './ticker';
import { LimitOrder } from './limit-order';
import { Trade, TradeModel } from '../db/trades';
import { Trades } from './trades';
import { ActionType } from './enums';
import { Subject } from './subject';
import { SymbolModel } from '../db/symbols';

export abstract class Advisor extends Subject {
    profitResults: number[];
    longQuantity = 0;
    message: string = '';
    telegram: TelegramBot;
    ticker: Ticker;
    abstract type: string;
    trades: Trades;
    currentOrderStatus = true;
    lastTrade: Trade;

    constructor(public exchange: IExchangeService) {
        super();
        this.telegram = new TelegramBot(ChatGroups.mainAccount);
        this.ticker = exchange.ticker;
        this.trades = new Trades();
    }

    async trade(price?: number, side?: Side): Promise<Trade> {
        if (!price) price = this.ticker.candle.close;
        if (!side) side = this.ticker.action === ActionType.Long ? 'buy' : 'sell';
        const quantity = this.ticker.currencyAmount / price;
        this.lastTrade = await this.exchange.createOrder(new LimitOrder(price, quantity, side));
        // this.currentOrderStatus = trade.status === 'COMPLETE'? 0 : 1;
        this.lastTrade.advisorType = this.type;

        await this.trades.addTrade(this.lastTrade);
        // await this.checkOrderStatus();
        return this.lastTrade;
    }

    async checkOrderStatus() {
        try {
            const order = await SymbolModel.findOne({ ticker: 'BTCUSDT' });
            if (order.amount === 20) {
                this.currentOrderStatus = false;
                setTimeout(() => {
                    this.checkOrderStatus();
                }, 1000);
            } else {
                this.currentOrderStatus = true;
            }
        } catch (error) {
            console.log(error);
        }
    }

    async createOrder(price: number, side: Side, quantity?: number) {
        quantity = quantity ? quantity : this.ticker.currencyAmount / price;
        const trade = await this.exchange.createOrder(new LimitOrder(price, quantity, side));
        trade.advisorType = this.type;
        await this.trades.addTrade(trade).catch(async (error) => {
            this.trades.removeTrade(trade);
            await this.exchange.cancelOrder(trade.orderId);
            console.log(error.message);
            process.abort();
        });
        return trade;
    }

    abstract end(closingPrice: any);
    abstract notifyTelegramBot(message: string): void;
    abstract addProfitResults(close: number, lastBuy: Trade);
    abstract logBalance(): void;
    async doSetup(sendMessage: boolean): Promise<void> {
        const messageService = new TelegramBot(ChatGroups.mainAccount);
        const message = `${this.constructor.name} started: ${this.exchange.ticker.pair}`;
        if (sendMessage) messageService.sendMessage(message);
        if (!this.type) throw new Error('Advisor Type not defined');
        await this.exchange.getExchangeInfo();
        this.ticker = await this.exchange.getTradingBalance();
        this.setup();
    }

    protected abstract setup();
}
