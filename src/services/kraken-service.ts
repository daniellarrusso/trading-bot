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
import { Intervals } from '../model/interval-converter';
import { printDate } from '../utilities/utility';

// import { Exchange } from '../interfaces/exchange';
// import { KrakenOrder } from '../model/baseOrder';
// import { Intervals } from '../model/interval';
// import { Trade } from '../model/tradeResponse';

class Mapper {
    [pair: string]: string;
}

const CurrencyMapper: Mapper = {
    XBT: 'XXBT',
    GBP: 'ZGBP',
    ETH: 'XETH',
};

const PairMapper: Mapper = {
    BTCGBP: 'XXBTZGBP',
    BTCUSDT: 'XBTUSDT',
};

export class KrakenService implements IExchangeService {
    exchange: any;
    _last: number = 0;

    set lastProcessed(val: number) {
        if (this._last != val) this._last = val;
    }

    constructor(public ticker: Ticker) {
        this.exchange = new KrakenClient(apiKeys.krakenAccount.key, apiKeys.krakenAccount.secret);
    }
    async getHistory(ticker: Ticker) {
        const { krakenPair: pair, interval } = this.ticker;
        const intervalConverted = Intervals.find((i) => i.interval === interval);
        try {
            const { result } = await this.exchange.api('OHLC', {
                pair,
                interval: intervalConverted?.minutes,
            });
            this.lastProcessed = result.last;
            const history: Candle[] = result[pair].map((candle: Candle) => this.createCandle(candle));
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
    async createOrder(order: LimitOrder): Promise<TradeResponse> {
        const limitOrder = {
            pair: this.ticker.pair,
            type: order.side,
            ordertype: 'limit',
            price: order.price.toFixed(this.ticker.pairDecimals),
            volume: order.quantity.toFixed(this.ticker.lotDecimals),
        };
        return this.exchange.api('AddOrder', limitOrder);
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
            this.ticker.asset = settings.base;
            this.ticker.currency = settings.quote;
            await this.getTradingBalance();
        } catch (error: any) {
            throw new Error('something went wrong: ' + error?.message);
        }
    }

    async getTradingBalance(): Promise<Ticker> {
        try {
            const cq = await this.getBalance(this.ticker.currency);
            const aq = await this.getBalance(this.ticker.asset);
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
        const intervalConverted = Intervals.find((i) => i.interval === interval);
        try {
            if (new Date().getSeconds() === 5) {
                console.log('Calling API', new Date());
                const { result } = await this.exchange.api('OHLC', {
                    pair,
                    interval: intervalConverted?.minutes,
                });
                const lastCandles: Array<Candle> = result[pair].map((candle: Candle) =>
                    this.createCandle(candle)
                );
                if (this._last !== result.last) {
                    const candle = lastCandles[lastCandles.length - 1];
                    this._last = result.last;
                    cb(candle);
                } else {
                    console.log('candle wasnt ready', new Date());
                }
            }
            setTimeout(() => this.getOHLCLatest(this.ticker, cb), 800);
        } catch (error: any) {
            console.log(error.message);
        }
    }

    async getOHLCHistory(): Promise<Candle[] | undefined> {
        const { pair, interval } = this.ticker;
        const intervalConverted = Intervals.find((i) => i.interval === interval);
        try {
            const { result } = await this.exchange.api('OHLC', {
                pair,
                interval: intervalConverted?.minutes,
            });
            this.lastProcessed = result.last;
            const history: Candle[] = result[pair].map((candle: Candle) => this.createCandle(candle));
            history.pop();
            for (let i = 0; i < history.length; i++) {
                history.push(this.createCandle(history[i]));
            }
            return history;
        } catch (error: any) {
            console.log(error.message);
        }
    }

    async createLimitOrder(side: Side, quantity: number, price: number = 0): Promise<TradeResponse> {
        // const order = this.baseOrder.createOrder(side, quantity, price | this.ticker.candle.close);
        try {
            const res = await this.exchange.api('AddOrder', {});
            await this.getTradingBalance();
            return res;
        } catch (error: any) {
            throw new Error('Error Creating Limit Order: ' + error.message);
        }
    }

    getOHLCHistoryByPair(): Promise<Candle[]> {
        throw new Error('Method not implemented.');
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

    private createCandle(arr: any) {
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
            printTime: printDate(new Date(time * 1000)),
        } as Candle;

        return candle;
    }
}
