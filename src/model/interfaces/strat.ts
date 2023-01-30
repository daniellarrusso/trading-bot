import { Advisor } from '../advisor';
import { Candle } from '../candle';

export interface Strat {
  loadIndicators();
  advice();
  loadHistory(candleHistory: Candle[]);
  update(candle: Candle): Promise<any>;
  setTradeAdvisor(advisor: Advisor);
  realtimeAdvice(candle: Candle);
}
