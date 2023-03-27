import { IExchangeService } from '../../services/IExchange-service';
import { Candle } from '../candle';
import { AdvisorType } from '../enums';
import { ordertypes } from '../literals';

export interface Strat {
  exchange: IExchangeService;

  loadIndicators();
  advice();
  loadHistory(candleHistory: Candle[]);
  update(candle: Candle): Promise<any>;
  setAdvisor(advisor: AdvisorType, ordertype: ordertypes): Promise<void>;
  realtimeAdvice(candle: Candle);
}
