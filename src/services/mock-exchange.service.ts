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

const history = 1000;

export class MockExchangeService implements IExchangeService {
  exchange: any;

  constructor(public ticker: Ticker) {
    this.exchange = new Binance().options({
      APIKEY: apiKeys.crypAccount.key,
      APISECRET: apiKeys.crypAccount.secret,
      useServerTime: true,
      recvWindow: 60000,
    });
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
  async createOrder(order: LimitOrder, isMarket = false): Promise<TradeResponse> {
    const side = isMarket ? order.marketSide : order.side;
    const price = isMarket ? 0 : order.price;
    const serverResponse = await this.createServerResponse(isMarket);
    const newResponse = new TradeResponse(this.ticker.candle, order.side, price);
    const response = Object.assign(newResponse, serverResponse);
    return response;
  }

  private async createServerResponse(isMarket: boolean) {
    if (isMarket) {
      return new Promise((resolve, reject) => {
        resolve(marketData);
      });
    }
    return new Promise((resolve, reject) => {
      resolve(limitData);
    });
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

  async getExchangeInfo(): Promise<void> {
    const x = await this.exchange.exchangeInfo();
    let { pair } = this.ticker;
    const filters = x['symbols'].find((s) => s.symbol === pair).filters;
    this.ticker.tickSize = filters.find((price) => price.filterType === 'PRICE_FILTER').tickSize;
    this.ticker.minQty = filters.find((price) => price.filterType === 'LOT_SIZE').minQty;
    this.ticker.stepSize = filters.find((price) => price.filterType === 'LOT_SIZE').stepSize;
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

  getOHLCHistoryByPair(pair: string, interval: string): Promise<Candle[]> {
    return new Promise((resolve, reject) => {
      this.exchange.candlesticks(
        pair,
        interval,
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
    this.exchange.websockets.candlesticks([ticker.pair], ticker.interval, (candlesticks) => {
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
      };
      ticker.candle = tick;
      cb(tick);
    });
  }

  getBalances() {
    return this.exchange.balance();
  }

  getTradingBalance(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const aq = await this.exchange.balance();
        const cq = await this.exchange.balance();
        this.ticker.assetQuantity = aq[this.ticker.asset].available;
        this.ticker.currencyQuantity = cq[this.ticker.currency].available;
      } catch (err) {
        reject(handleError(err));
      }
    });
  }

  getBitcoinPrice() {
    return this.exchange.prices('BTCUSDT');
  }

  checkOrderStatus(id: any): Promise<any> {
    return this.exchange.orderStatus(this.ticker.pair, id);
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
    closeTime: new Date(closeTime + 1),
    isFinal: true,
    candleSize: getCandleSize(+open, +close),
    printTime: printTime(closeTime + 1),
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
function readFile(arg0: string, arg1: string): string | PromiseLike<string> {
  throw new Error('Function not implemented.');
}
