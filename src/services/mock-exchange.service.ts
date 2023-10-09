import Binance from 'node-binance-api';
import { Candle } from '../model/candle';
import { apiKeys } from '../../keys';
import { Ticker } from '../model/ticker';
import { IExchangeService } from './IExchange-service';
import { IndicatorStrategies } from '../indicators/indicator-strategies/indicator-strats';
import { Indicator } from '../model/indicator';
import { LimitOrder } from '../model/limit-order';
import { CandlesIndicatorResponse } from '../model/multi-timeframe';
import { printDate } from '../utilities/utility';
import marketData from './responses/binance-market-buy.json';
import limitData from './responses/binance-limit-buy.json';
import { TradeResponse } from '../model/trade-response';
import { MockOrders } from './mock-orders';
import { Trade } from '../db/trade';
import { Interval } from '../model/interval-converter';

const history = 1000;

export class MockExchangeService implements IExchangeService {
    exchange: any;
    mockOrders = new MockOrders();

    constructor(public ticker: Ticker) {
        this.exchange = new Binance().options({
            APIKEY: apiKeys.crypAccount.key,
            APISECRET: apiKeys.crypAccount.secret,
            useServerTime: true,
            recvWindow: 60000,
        });
    }
    updateOrder(trade: Trade): Promise<boolean> {
        throw new Error('Method not implemented.');
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
        const side = this.ticker.isMarketOrders ? order.marketSide : order.side;
        order.quantity = this.exchange.roundStep(order.quantity, this.ticker.stepSize);
        const priceString = this.normalisePrice(order.price);
        const res = await this.mockOrders[side](
            this.ticker.pair,
            order.quantity,
            priceString
        );
        return this.assignQuoteQtyAndPrice(res);
    }

    private assignQuoteQtyAndPrice(res: TradeResponse): Trade {
        if (res.type === 'MARKET')
            res.quotePrice = +res.cummulativeQuoteQty / +res.origQty;
        else {
            res.quotePrice = +res.price;
            res.cummulativeQuoteQty = (+res.origQty * +res.price).toString();
        }
        return {
            date: new Date(),
            quantity: +res.origQty,
            asset: this.ticker.asset,
            currency: this.ticker.currency,
            cost: +res.cummulativeQuoteQty,
            price: +res.quotePrice,
            side: res.side,
            closeTime: this.ticker.candle.closeTime,
            orderId: res.orderId,
            status: res.status,
            advisorType: '',
        };
    }

    normalisePrice(price: number): string {
        if (typeof price === 'string') {
            return price;
        }
        return price.toFixed(this.ticker.tickSize.indexOf('1') - 1);
    }

    getOHLCHistory(): Promise<Candle[]> {
        return new Promise((resolve, reject) => {
            this.exchange.candlesticks(
                this.ticker.pair,
                this.ticker.interval,
                (error: any, ticks: any) => {
                    const history = [];
                    for (let i = 0; i < ticks.length; i++) {
                        history.push(this.getCandle(ticks[i]));
                    }
                    history.pop(); // removes latest none final candle
                    resolve(history);
                },
                { limit: history }
            );
        });
    }

    getOrders(pair: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.exchange.openOrders(pair, (error: any, openOrders: any) => {
                if (error) reject(error);
                resolve(openOrders);
            });
        });
    }

    async getExchangeInfo(): Promise<Ticker> {
        console.log('Loading Binance (Mock) Exchange config');
        const x = await this.exchange.exchangeInfo();
        let { pair } = this.ticker;
        const filters = x['symbols'].find((s) => s.symbol === pair).filters;
        this.ticker.tickSize = filters.find(
            (price) => price.filterType === 'PRICE_FILTER'
        ).tickSize;
        this.ticker.minQty = filters.find(
            (price) => price.filterType === 'LOT_SIZE'
        ).minQty;
        this.ticker.stepSize = filters.find(
            (price) => price.filterType === 'LOT_SIZE'
        ).stepSize;
        return this.ticker;
    }

    async getPrice() {
        const price = await this.exchange.prices(this.ticker.pair);
        return price[this.ticker.pair];
    }

    getHistory(ticker: Ticker): Promise<any> {
        return new Promise((resolve, reject) => {
            this.exchange.candlesticks(
                ticker.pair,
                ticker.interval,
                (error, ticks, symbol) => {
                    const history = [];
                    for (let i = 0; i < ticks.length; i++) {
                        history.push(getCandle(ticks[i], ticker));
                    }
                    history.pop();
                    resolve(history);
                },
                { limit: history }
            );
        });
    }

    getOHLCHistoryByPair(pair: string, interval: Interval): Promise<Candle[]> {
        return new Promise((resolve, reject) => {
            this.exchange.candlesticks(
                pair,
                interval.interval,
                (error: any, ticks: any) => {
                    if (error) reject(error);
                    const history = [];
                    for (let i = 0; i < ticks.length; i++) {
                        history.push(this.getCandle(ticks[i]));
                    }
                    history.pop(); // removes latest none final candle
                    resolve(history);
                },
                { limit: 1000 }
            );
        });
    }

    getOHLCLatest(ticker: Ticker, cb) {
        this.exchange.websockets.candlesticks(
            [ticker.pair],
            ticker.interval,
            (candlesticks) => {
                let { e: eventType, E: eventTime, s: symbol, k: ticks } = candlesticks;
                const {
                    t: time,
                    o: open,
                    h: high,
                    l: low,
                    c: close,
                    v: volume,
                    n: trades,
                    i: interval,
                    x: isFinal,
                    q: quoteVolume,
                    V: buyVolume,
                    Q: quoteBuyVolume,
                    T: closeTime,
                } = ticks;

                const tick: Candle = {
                    pair: ticker.pair,
                    open: +open,
                    high: +high,
                    low: +low,
                    close: +close,
                    price: close,
                    volume: +volume,
                    trades: +trades,
                    green: +close > +open,
                    time: new Date(+time),
                    closeTime: new Date(+closeTime + 1),
                    isFinal: isFinal,
                    candleSize: getCandleSize(+open, +close),
                    printTime: printTime(closeTime + 1),
                } as Candle;
                ticker.candle = tick;
                cb(tick);
            }
        );
    }

    getBalances() {
        return this.exchange.balance();
    }

    getTradingBalance(): Promise<Ticker> {
        return new Promise(async (resolve, reject) => {
            try {
                const aq = await this.exchange.balance();
                const cq = await this.exchange.balance();
                this.ticker.assetQuantity = aq[this.ticker.asset].available;
                this.ticker.currencyQuantity = cq[this.ticker.currency].available;
                resolve(this.ticker);
            } catch (err) {
                reject(handleError(err));
            }
        });
    }

    getBitcoinPrice() {
        return this.exchange.prices('BTCUSDT');
    }

    checkOrderStatus(id: any): Promise<any> {
        return this.exchange.orderStatus('ALPHAUSDT', id);
    }

    cancelOrder(orderId: any) {
        return this.exchange.cancel(this.ticker.pair, orderId);
    }

    private getCandle(tick: any): Candle {
        if (tick == null) {
            return {
                open: 0,
                low: 0,
                close: 0,
                high: 0,
                green: false,
            } as Candle;
        }
        const [
            time,
            open,
            high,
            low,
            close,
            volume,
            closeTime,
            assetVolume,
            trades,
            buyBaseVolume,
            buyAssetVolume,
            ignored,
        ] = tick;
        const candle = {
            pair: this.ticker.pair,
            open: +open,
            high: +high,
            low: +low,
            close: +close,
            price: close,
            trades: +trades,
            volume: +volume,
            time: new Date(time),
            closeTime: new Date(closeTime + 1),
            isFinal: true,
            candleSize: getCandleSize(+open, +close),
        } as Candle;
        return candle;
    }

    private extractNearestHour(date: Date) {
        date.setHours(-1, 59, 0);
        return date;
    }
}

function getCandle(tick, ticker): Candle {
    if (tick == null) {
        return {
            open: 0,
            low: 0,
            close: 0,
            high: 0,
            green: false,
        } as Candle;
    }
    const [
        time,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
        assetVolume,
        trades,
        buyBaseVolume,
        buyAssetVolume,
        ignored,
    ] = tick;
    const candle = {
        pair: ticker.pair,
        open: +open,
        high: +high,
        low: +low,
        close: +close,
        price: close,
        trades: +trades,
        volume: +volume,
        green: +close > +open,
        time: new Date(time),
        closeTime: addMinute(new Date(closeTime)),
        isFinal: true,
        candleSize: getCandleSize(+open, +close),
        printTime: printTime(addMinute(new Date(closeTime))),
    } as Candle;
    return candle;
}

const printTime = printDate;

function getCandleSize(numA: number, numB: number) {
    return Number(((Math.abs(numA - numB) / ((numA + numB) / 2)) * 100).toFixed(3));
}

function handleError(err: any) {
    const newError = { ...err, ...new Error() };
    if (newError.statusCode) {
        newError.message = newError.body;
        console.log(newError.statusCode + ' ' + newError.statusMessage);
        return newError;
    } else {
        return err;
    }
}

function addMinute(date: Date) {
    date.setSeconds(date.getSeconds() + 1);

    return date;
}
