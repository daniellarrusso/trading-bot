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

export class KrakenService implements IExchangeService {
  kraken: any;
  constructor() {
    this.kraken = new KrakenClient(apiKeys.krakenAccount.key, apiKeys.krakenAccount.secret);
  }

  createOrder(order: LimitOrder, advisorType?: string, isMarket?: boolean): Promise<TradeResponse> {
    throw new Error('Method not implemented.');
  }
  getHistory(ticker: Ticker) {
    throw new Error('Method not implemented.');
  }
  ticker: Ticker;
  exchange: any;
  getExchangeInfo() {
    throw new Error('Method not implemented.');
  }
  getOHLCLatest(ticker: Ticker, cb: any): void {
    throw new Error('Method not implemented.');
  }
  getOHLCHistoryByPair(pair: string, interval: string): Promise<Candle[]> {
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
  getOrders(pair: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  checkOrderStatus(orderId: any) {
    throw new Error('Method not implemented.');
  }
  placeLimitOrder(side: Side, quantity: number, price: number) {
    throw new Error('Method not implemented.');
  }
  placeStopLimitOrder(side: Side, quantity: number, price: number, stopPrice: number) {
    throw new Error('Method not implemented.');
  }
  placeMarketOrder(side: Side, quantity: number) {
    throw new Error('Method not implemented.');
  }
  getPrice() {
    throw new Error('Method not implemented.');
  }
  cancelOrder(orderId: any) {
    throw new Error('Method not implemented.');
  }

  async getTickerSettings(pair?: string) {
    const res = await this.kraken.api('AssetPairs', { info: {}, pair: pair });
    const result = res.result[pair];
    return result;
  }

  // async getPrice(ticker: string) {
  //     const price = await this.kraken.api('Ticker', { pair: ticker });
  //     return price.result;
  // }

  async getTradeBalance(baseCurrency: string) {
    const bal = await this.kraken.api('Balance', { asset: baseCurrency });
    return bal.result[baseCurrency];
  }

  async addOrder(limitOrder: any) {
    const res = await this.kraken.api('AddOrder', limitOrder);
    return res.result;
  }
  async getAssetPairs(pair?: string) {
    const res = await this.kraken.api('AssetPairs', pair);
    return res.result;
  }
}
