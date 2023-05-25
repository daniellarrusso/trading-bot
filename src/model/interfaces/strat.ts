import { IExchangeService } from '../../services/IExchange-service';
import { Candle } from '../candle';

export interface Strat {
    exchange: IExchangeService;
    strategyName: string;
    loadIndicators();
    advice();
    loadMockExchangeInfo();
    loadHistory(candleHistory: Candle[]);
    update(candle: Candle): Promise<any>;
    setAdvisor(): Promise<void>;
    realtimeAdvice(candle: Candle);
}
