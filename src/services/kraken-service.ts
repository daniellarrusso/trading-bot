import KrakenClient from 'kraken-api-na';
import { apiKeys } from '../../keys';
import { IndicatorStrategies } from '../indicators/indicator-strategies/indicator-strats';
import { Candle } from '../model/candle';
import { Indicator } from '../model/indicator';
import { LimitOrder } from '../model/limit-order';
import { Side } from '../model/literals';
import { CandlesIndicatorResponse } from '../model/multi-timeframe';
import { Ticker } from '../model/ticker';
import { TradeResponse } from '../model/trade-response';
import { IExchangeService } from './IExchange-service';
import { Interval, Intervals } from '../model/interval-converter';
import { printDate } from '../utilities/utility';
import { Trade } from '../db/trade';
import moment from 'moment';

class Mapper {
    [pair: string]: string;
}

const CurrencyMapper: Mapper = {
    BTC: 'XXBT',
    GBP: 'ZGBP',
    ETH: 'XETH',
};

export interface KrakenOrderResponse {
    error: [];
    result: {
        descr: {
            order: string;
            close: string;
        };
        txid: string[];
    };
}

export class KrakenService implements IExchangeService {
    exchange: any;
    _last: number = 0;
    trys: number = 0;

    set lastProcessed(val: number) {
        if (this._last != val) this._last = val;
    }

    constructor(public ticker: Ticker) {
        this.exchange = new KrakenClient(
            apiKeys.krakenAccount.key,
            apiKeys.krakenAccount.secret
        );
    }

    async updateOrder(trade: Trade): Promise<boolean> {
        const res = await this.exchange.api('ClosedOrders');
        const result = res?.result?.closed?.[trade.orderId]?.status === 'closed';
        return result;
    }
    async getHistory(ticker: Ticker) {
        const { krakenPair: pair } = this.ticker;

        try {
            const { result } = await this.exchange.api('OHLC', {
                pair,
                interval: ticker.intervalObj.minutes,
            });
            this.lastProcessed = result.last;
            const history: Candle[] = result[pair].map((candle: Candle) =>
                this.createCandle(candle)
            );
            history.pop();
            return history;
        } catch (error: any) {
            console.log(error.message);
        }
    }

    async getOHLCHistoryByPair(pair: string, interval: Interval): Promise<Candle[]> {
        const { krakenPair: pair2 } = this.ticker;

        try {
            const { result } = await this.exchange.api('OHLC', {
                pair: pair2,
                interval: interval.minutes,
            });
            const history: Candle[] = result[pair2].map((candle: Candle) =>
                this.createCandle(candle, interval.minutes)
            );
            history.pop();
            return history;
        } catch (error: any) {
            console.log(error.message);
        }
    }

    getHistoryWithIndicator(
        pair: any,
        interval: any,
        indicator?: Indicator,
        indicators?: IndicatorStrategies,
        firstLiveLoad?: boolean
    ): Promise<CandlesIndicatorResponse> {
        throw new Error('Method not implemented.');
    }
    async createOrder(order: LimitOrder): Promise<Trade> {
        const limitOrder = {
            pair: this.ticker.pair,
            type: order.side,
            ordertype: 'limit',
            price: order.price.toFixed(this.ticker.pairDecimals),
            volume: order.quantity.toFixed(this.ticker.lotDecimals),
        };
        try {
            const res: KrakenOrderResponse = await this.exchange.api(
                'AddOrder',
                limitOrder
            );
            return this.generateTradeResponse(res, order);
        } catch (error) {
            console.log(error);
        }
    }

    private generateTradeResponse(res: KrakenOrderResponse, order: LimitOrder): Trade {
        return {
            date: new Date(),
            quantity: order.quantity,
            asset: this.ticker.asset,
            currency: this.ticker.currency,
            cost: +order.quantity * order.price,
            price: order.price,
            side: order.side,
            closeTime: this.ticker.candle.closeTime,
            orderId: res.result.txid[0],
            status: 'NEW',
            advisorType: '',
        };
    }

    async cancelOrder(orderId: any) {
        const price = await this.exchange.api('CancelOrder', { txid: orderId });
        return price.result;
    }

    async getExchangeInfo(): Promise<void> {
        console.log('Loading Kraken Exchange config');
        const { krakenPair: pair } = this.ticker;
        try {
            const { result } = await this.exchange.api('AssetPairs', { info: {}, pair });
            const { [pair]: settings } = result;
            this.ticker.pairDecimals = settings.pair_decimals;
            this.ticker.lotDecimals = settings.lot_decimals;
            // this.ticker.asset = settings.base;
            // this.ticker.currency = settings.quote;
            await this.getTradingBalance();
        } catch (error: any) {
            throw new Error('something went wrong: ' + error?.message);
        }
    }

    async getTradingBalance(): Promise<Ticker> {
        try {
            const cq = await this.getBalance(CurrencyMapper[this.ticker.currency]);
            const aq = await this.getBalance(CurrencyMapper[this.ticker.asset]);
            this.ticker.currencyQuantity = +cq;
            this.ticker.assetQuantity = +aq;
            return this.ticker;
        } catch (error: any) {
            console.log(error.message, ' Unable to update currency/asset balances');
        }
    }

    private async getBalance(currency: string): Promise<string> {
        const bal = await this.exchange.api('Balance');
        if (CurrencyMapper[currency]) {
            return bal.result[CurrencyMapper[currency]];
        }
        return bal.result[currency];
    }

    async getOHLCLatest(ticker: Ticker, cb) {
        const { krakenPair: pair, interval } = this.ticker;
        try {
            if (new Date().getSeconds() === 5) {
                const { result } = await this.exchange.api('OHLC', {
                    pair,
                    interval: ticker.intervalObj.minutes,
                });
                const lastCandles: Array<Candle> = result[pair].map((candle: Candle) =>
                    this.createCandle(candle)
                );
                if (this._last !== result.last) {
                    this.trys = 0;
                    const candle = lastCandles[lastCandles.length - 2];
                    this._last = result.last;
                    cb(candle);
                }
            }
            setTimeout(() => this.getOHLCLatest(this.ticker, cb), 800);
        } catch (error) {
            console.log(
                'Error getting latest Candle',
                error.message,
                `\nLast Candle processed ${this.ticker.candle.closeTime}`
            );
            this.trys++;
            console.log(`Try: ${this.trys} trying again`);
            if (this.trys < 60)
                setTimeout(() => this.getOHLCLatest(this.ticker, cb), 10000); // try next minute
        }
    }

    async createLimitOrder(
        side: Side,
        quantity: number,
        price: number = 0
    ): Promise<TradeResponse> {
        // const order = this.baseOrder.createOrder(side, quantity, price | this.ticker.candle.close);
        try {
            const res = await this.exchange.api('AddOrder', {});
            await this.getTradingBalance();
            return res;
        } catch (error: any) {
            throw new Error('Error Creating Limit Order: ' + error.message);
        }
    }

    getLatest(): void {
        throw new Error('Method not implemented.');
    }

    getOrders(pair: string): Promise<any[]> {
        throw new Error('Method not implemented.');
    }
    checkOrderStatus(orderId: any) {
        throw new Error('Method not implemented.');
    }

    async getTickerSettings(pair: string) {
        const res = await this.exchange.api('AssetPairs', { info: {}, pair: pair });
        const result = res.result[pair];
        return result;
    }

    async getPrice(ticker?: string) {
        const price = await this.exchange.api('Ticker', { pair: ticker });
        return price.result;
    }

    async addOrder(limitOrder: any) {
        const res = await this.exchange.api('AddOrder', limitOrder);
        return res.result;
    }
    async getAssetPairs(pair?: string) {
        const res = await this.exchange.api('AssetPairs', pair);
        return res.result;
    }

    private createCandle(arr: any, minutes?: number) {
        const [time, open, high, low, close, vwap, volume] = arr;
        const candle: Candle = {
            pair: this.ticker.pair,
            open: +open,
            high: +high,
            low: +low,
            close: +close,
            price: close,
            volume,
            green: +close > +open,
            isFinal: true,
            time: new Date(time * 1000),
            closeTime: addMinutes(
                new Date(time * 1000),
                minutes || this.ticker.intervalObj.minutes
            ),
            printTime: printDate(
                addMinutes(
                    new Date(time * 1000),
                    minutes || this.ticker.intervalObj.minutes
                )
            ),
        } as Candle;

        return candle;
    }
}

function addMinutes(date, minutes) {
    date.setMinutes(date.getMinutes() + minutes);

    return date;
}
