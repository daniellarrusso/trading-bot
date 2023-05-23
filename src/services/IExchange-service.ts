import { IndicatorStrategies } from '../indicators/indicator-strategies/indicator-strats';
import { Candle } from '../model/candle';
import { Indicator } from '../model/indicator';
import { LimitOrder } from '../model/limit-order';
import { Side } from '../model/literals';
import { CandlesIndicatorResponse } from '../model/multi-timeframe';
import { Ticker } from '../model/ticker';
import { TradeResponse } from '../model/trade-response';

export interface IExchangeService {
    ticker: Ticker;
    exchange: any;

    getExchangeInfo();
    // Candle
    getOHLCLatest(ticker: Ticker, cb: any): void;
    getHistory(ticker: Ticker);
    getOHLCHistoryByPair(pair: string, interval: string): Promise<Candle[]>;
    getHistoryWithIndicator(
        pair,
        interval,
        indicator?: Indicator,
        indicators?: IndicatorStrategies,
        firstLiveLoad?: boolean
    ): Promise<CandlesIndicatorResponse>;
    // orders
    getOrders(pair: string): Promise<any[]>;
    checkOrderStatus(orderId: any);
    createOrder(order: LimitOrder): Promise<TradeResponse>;
    getPrice();

    cancelOrder(orderId: any);
}
