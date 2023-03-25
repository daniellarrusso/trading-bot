import { IExchangeService } from '../../services/IExchange-service';
import { Advisor } from '../advisor';
import { Candle } from '../candle';
import { Ticker } from '../ticker';

export interface Strat {
  exchange: IExchangeService;
  loadIndicators();
  advice();
  loadHistory(candleHistory: Candle[]);
  update(candle: Candle): Promise<any>;
  setTradeAdvisor(advisor: Advisor);
  realtimeAdvice(candle: Candle);
}
