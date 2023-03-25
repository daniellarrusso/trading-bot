import { Advisor } from './advisor';
import { GridSettings } from './grid-settings';
import { Strat } from './interfaces/strat';
import { FifteenHourStrategy } from '../strategies/old/fifteen-hour';
import { PaperAdvisor } from './paper-advisor';
import { TradesDb } from '../db/tradesDb';
import { AdvisorType } from './enums';
import { GridStrategy } from '../strategies/grid';
import { HeikinLongStrategy } from '../strategies/swing/heikin-long';
import { LiveAdvisor } from './live-advisor';
import { BreakoutVolumeStrategy } from '../strategies/swing/breakout-volume';
import { TemplateStrategy } from '../strategies/template-strategy';
import { DailyRSIStrategy } from '../strategies/swing/daily-rsi';
import { RSI15trategy } from '../strategies/intraday/rsi-15';
import { DCAWeeklytrategy } from '../strategies/DCA/dca-weekly.strategy';
import { DCAAdvisor } from './dca.advisor';
import { FibonnaciRegimeStrategy } from '../strategies/intraday/fibonnaci-regime';
import { SimpleMAStrategy } from '../strategies/swing/simple-ma.strategy';
import { Portfolio } from './portfolio';
import { NotifierStrategy } from '../notifiers/notifier.strategy';
import { IExchangeService } from '../services/IExchange-service';

export class Strategy {
  advisor: Advisor;
  tradesDb: TradesDb;
  strat: Strat;

  constructor(
    public strategyName: string,
    public exchange: IExchangeService,
    public portfolio: Portfolio = new Portfolio(0, 1),
    public gridSettings: GridSettings = null
  ) {
    this.init();
  }
  async init() {
    switch (this.strategyName) {
      case 'fifteen':
        this.strat = new FifteenHourStrategy(this.exchange);
        break;
      case 'grid':
        this.strat = new GridStrategy(this.exchange);
        break;
      case 'heikinSwing':
        this.strat = new HeikinLongStrategy(this.exchange);
        break;
      case 'moving-average':
        this.strat = new SimpleMAStrategy(this.exchange);
        break;
      case 'breakoutVolume':
        this.strat = new BreakoutVolumeStrategy(this.exchange);
        break;
      case 'daily-rsi':
        this.strat = new DailyRSIStrategy(this.exchange);
        break;
      case 'rsi-15':
        this.strat = new RSI15trategy(this.exchange);
        break;
      case 'dca':
        this.strat = new DCAWeeklytrategy(this.exchange);
        break;
      case 'fib-regime':
        this.strat = new FibonnaciRegimeStrategy(this.exchange);
        break;
      case 'notifier':
        this.strat = new NotifierStrategy(this.exchange);
        break;
      default:
        console.log('WARNING!!! Template Strategy is running');
        this.strat = new TemplateStrategy(this.exchange);
        break;
    }
    if (this.strategyName !== 'grid') {
      // await this.tradesDb.createNewPosition(this.portfolio.buyPrice);
    }
  }

  setAdvisor(advisor?: AdvisorType) {
    switch (advisor) {
      case (advisor = AdvisorType.paper):
        this.advisor = this.strat.setTradeAdvisor(new PaperAdvisor(this.exchange));
        break;
      case (advisor = AdvisorType.live):
        this.advisor = this.strat.setTradeAdvisor(new LiveAdvisor(this.exchange));
        break;
      case (advisor = AdvisorType.DCA):
        this.advisor = this.strat.setTradeAdvisor(new DCAAdvisor(this.exchange));
        break;
      default:
        this.advisor = this.strat.setTradeAdvisor(new PaperAdvisor(this.exchange));
        break;
    }
  }
}
