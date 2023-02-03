import Binance from 'node-binance-api';
import { Candle } from '../model/candle';
import { apiKeys, Settings } from '../../keys';
import { Ticker } from '../model/ticker';
import { TradeResponse } from '../model/trade-response';
import { IOrder, LimitOrder } from '../model/limit-order';
import { Indicator } from '../model/indicator';
import { Heikin } from '../model/heikin';
import { CandlesIndicatorResponse } from '../model/multi-timeframe';
import { IndicatorStrategies } from '../indicators/indicator-strategies/indicator-strats';
import { IExchangeService } from './IExchange-service';
import { Side } from '../model/literals';
import moment from 'moment';

const FEE = Settings.fee;
const history = Settings.history;

export class BinanceService implements IExchangeService {
  exchange: any;

  constructor(public ticker: Ticker) {
    this.exchange = new Binance().options({
      APIKEY: apiKeys.crypAccount.key,
      APISECRET: apiKeys.crypAccount.secret,
      useServerTime: true,
      recvWindow: 60000,
    });
  }

  getOrders(pair: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.exchange.openOrders(pair, (error, openOrders, symbol) => {
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
    this.ticker.roundStep = this.exchange.roundStep;
  }

  async getPrice() {
    const price = await this.exchange.prices(this.ticker.pair);
    return price[this.ticker.pair];
  }

  roundStep(qty) {
    return this.exchange.roundStep(+qty, this.ticker.stepSize);
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
        (error, ticks, symbol) => {
          const history = [];
          for (let i = 0; i < ticks.length; i++) {
            history.push(getCandle(ticks[i], this.ticker));
          }
          history.pop(); // removes latest none final candle
          resolve(history);
        },
        { limit: history }
      );
    });
  }

  getHistoryWithIndicator(
    pair,
    interval,
    indicator?: Indicator,
    indicators?: IndicatorStrategies,
    firstLiveLoad?: boolean
  ): Promise<CandlesIndicatorResponse> {
    let endTime = new Date(this.ticker.candle.time).getTime();
    const liveTime = new Date(this.ticker.candle.time).setHours(-24);
    if (firstLiveLoad) {
      endTime = liveTime;
    }
    return new Promise((resolve, reject) => {
      this.exchange.candlesticks(
        pair,
        interval,
        (error, ticks, symbol) => {
          const response = new CandlesIndicatorResponse();
          response.heikin = new Heikin(getCandle(ticks[0], pair));
          response.candlesticks = [];
          response.indicator = indicator;
          response.indicatorStrategies = indicators;
          const hasIndicatorInput = indicator?.input.length > 0;
          for (let i = 0; i < ticks.length; i++) {
            const candle = getCandle(ticks[i], pair);
            if (hasIndicatorInput) {
              indicator.update(candle[indicator.input]);
            } else if (indicator) {
              indicator.update(candle);
            }
            if (indicators) {
              response.indicatorStrategies.update(candle.close);
            }
            response.heikin.addCandle(candle);
            response.candlesticks.push(candle);
            response.lastCandle = candle;
          }
          resolve(response);
        },
        { limit: 200, endTime }
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

  async createLimitOrder(order: LimitOrder): Promise<TradeResponse> {
    order.quantity = this.exchange.roundStep(order.quantity, this.ticker.stepSize);
    const priceString = this.normalisePrice(order.price);
    try {
      const limitOrder = await this.exchange[order.side](this.ticker.pair, order.quantity, priceString);
      await this.getTradingBalance();
      return limitOrder;
    } catch (error) {
      console.log(error);
    }
  }

  placeStopLimitOrder(side: Side, quantity: number, price: number, stopPrice: number) {
    quantity = this.exchange.roundStep(quantity, this.ticker.stepSize);
    const priceString = this.normalisePrice(price);
    const stop = this.normalisePrice(stopPrice);
    return this.exchange[side](this.ticker.pair, quantity, priceString, {
      stopPrice: stop,
      type: 'STOP_LOSS',
    });
  }

  placeLimitOrder(side: Side, quantity: number, price: number) {
    quantity = this.exchange.roundStep(quantity, this.ticker.stepSize);
    return this.exchange[side](this.ticker.pair, quantity, this.normalisePrice(price));
  }

  placeMarketOrder(side: Side, quantity: number) {
    // return Promise.resolve(this.fakeTradeResponse(quantity));
    quantity = this.exchange.roundStep(quantity, this.ticker.stepSize);
    if (side === 'buy') return this.exchange.marketBuy(this.ticker.pair, quantity);
    return this.exchange.marketSell(this.ticker.pair, quantity);
  }

  fakeTradeResponse(quantity: number) {
    const { pair, close } = this.ticker.candle;
    const res = new TradeResponse(close, pair, (close * quantity).toFixed(2), this.ticker.action);
    return res;
  }

  marketOrderSpoof(order: IOrder): Promise<any> {
    order.quantity = this.exchange.roundStep(order.quantity, this.ticker.stepSize);
    return new Promise((resolve, reject) => {
      console.log(
        `${order.isLong ? 'Buying' : 'Selling'} using this.exchange[${order.type}](${this.ticker.pair},${
          order.quantity
        })`
      );
      setTimeout(() => {
        const response = {} as TradeResponse;
        response.cummulativeQuoteQty = String(order.quantity);
        resolve(response);
      }, 1000);
    });
  }

  normalisePrice(price: number): string {
    if (typeof price === 'string') {
      return price;
    }
    return price.toFixed(this.ticker.tickSize.indexOf('1') - 1);
  }

  async staticOrder(tradeType: string, quantity: number) {
    let assetAmount = 0;
    try {
      await this.getTradingBalance(); // todo: maybe check if I have enough based on currency
      if (tradeType === 'marketSell') {
        quantity = +this.ticker.assetQuantity;
      }
      assetAmount = round(quantity, +this.ticker.tickSize);
      return this.exchange[tradeType](this.ticker.pair, assetAmount);
    } catch (error) {
      console.error(
        `Get Balance Error Error ${this.ticker.pair} Error: ${error.body} \nAmount: ${assetAmount}`
      );
      assetAmount = round(quantity, +this.ticker.tickSize);
      return this.exchange[tradeType](this.ticker.pair, assetAmount);
    }
  }

  checkOrderStatus(id: any): Promise<any> {
    return this.exchange.orderStatus(this.ticker.pair, id);
  }

  cancelOrder(orderId: any) {
    return this.exchange.cancel(this.ticker.pair, orderId);
    // , (error, response, symbol) => {
    //   console.info(symbol+" cancel response:", response);
    // });
  }

  private extractNearestHour(date: Date) {
    date.setHours(-1, 59, 0);
    return date;
  }

  round(amount: number, tickSize) {
    var precision = 100000000;
    var t = getPrecision(tickSize);

    if (Number.isInteger(t)) precision = Math.pow(10, t);

    amount *= precision;
    amount = Math.floor(amount);
    amount /= precision;

    // https://gist.github.com/jiggzson/b5f489af9ad931e3d186
    // amount = scientificToDecimal(amount);

    return amount;
  }
}
function getCandleSize(numA: number, numB: number) {
  return Number(((Math.abs(numA - numB) / ((numA + numB) / 2)) * 100).toFixed(3));
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

function handleError(err) {
  const newError = { ...err, ...new Error() };
  if (newError.statusCode) {
    newError.message = newError.body;
    console.log(newError.statusCode + ' ' + newError.statusMessage);
    return newError;
  } else {
    return err;
  }
}

function printTime(dt: Date) {
  return moment(dt).format('h:mma Do MMM YYYY');
}

function round(amount: number, tickSize) {
  var precision = 100000000;
  var t = getPrecision(tickSize);

  if (Number.isInteger(t)) precision = Math.pow(10, t);

  amount *= precision;
  amount = Math.floor(amount);
  amount /= precision;

  // https://gist.github.com/jiggzson/b5f489af9ad931e3d186
  // amount = scientificToDecimal(amount);

  return amount;
}
// Effectively counts the number of decimal places, so 0.001 or 0.234 results in 3
function getPrecision(tickSize) {
  if (!isFinite(tickSize)) return 0;
  var e = 1,
    p = 0;
  while (Math.round(tickSize * e) / e !== tickSize) {
    e *= 10;
    p++;
  }
  return p;
}
