import { Ticker } from './ticker';
import { BinanceService } from '../services/binance-service';
import { Advisor } from './advisor';
import { GridSettings } from './grid-settings';
import { Strat } from './interfaces/strat';
import { BaseStrategy } from '../strategies/base-strategy';
import { FifteenHourStrategy } from '../strategies/old/fifteen-hour';
import { Trader } from '../services/trader-service';
import { PaperAdvisor } from './paper-advisor';
import { TradesDb } from '../db/tradesDb';
import { BacktestAdvisor } from './backtest-advisor';
import { AdvisorType } from './enums';
import { PortfolioAdvisor } from './portfolio-advisor';
import { LiveAdvisor } from './live-advisor';
import { GridStrategy } from '../strategies/grid';
import { HeikinLongStrategy } from '../strategies/swing/heikin-long';
import { PercentageAdvisor } from './percentage-advisor';
import { MAFibStrategy } from '../strategies/old/ma-fib';
import { BreakoutVolumeStrategy } from '../strategies/swing/breakout-volume';
import { TemplateStrategy } from '../strategies/template-strategy';
import { DailyRSIStrategy } from '../strategies/swing/daily-rsi';
import { RSI15trategy } from '../strategies/intraday/rsi-15';
import { DCAWeeklytrategy } from '../strategies/DCA/dca-weekly.strategy';
import { DCAAdvisor } from './dca.advisor';
import { FibonnaciRegimeStrategy } from '../strategies/intraday/fibonnaci-regime';

export class Portfolio {
  constructor(
    public total: number = 10000,
    public multiplier: number = 1,
    public buyPrice: number = 0,
    public indicator?: string,
    public shortLimit?: number,
    public longLimit?: number
  ) { }
}

export class Strategy {
  advisor: Advisor;
  tradesDb: TradesDb;
  strat: Strat;

  constructor(
    public strategyName: string,
    public exchange: BinanceService,
    public trader: Trader,
    public portfolio: Portfolio = new Portfolio(0, 1),
    public gridSettings: GridSettings = null
  ) {
    this.advisor = new BacktestAdvisor(this.exchange);
    this.tradesDb = new TradesDb(this.exchange.ticker);
    this.init();
  }
  async init() {
    switch (this.strategyName) {
      case 'fifteen':
        this.strat = new FifteenHourStrategy(this);
        break;
      case 'grid':
        this.strat = new GridStrategy(this);
        break;
      case 'heikinSwing':
        this.strat = new HeikinLongStrategy(this);
        break;
      case 'maFib':
        this.strat = new MAFibStrategy(this);
        break;
      case 'breakoutVolume':
        this.strat = new BreakoutVolumeStrategy(this);
        break;
      case 'daily-rsi':
        this.strat = new DailyRSIStrategy(this);
        break;
      case 'rsi-15':
        this.strat = new RSI15trategy(this);
        break;
      case 'dca':
        this.strat = new DCAWeeklytrategy(this);
        break;
      case 'fib-regime':
        this.strat = new FibonnaciRegimeStrategy(this);
        break;
      default:
        console.log('WARNING!!! Template Strategy is running');
        this.strat = new TemplateStrategy(this);
        break;
    }
    if (this.strategyName !== 'grid') {
      await this.tradesDb.createNewPosition(this.portfolio.buyPrice);
    }
  }

  setAdvisor(advisor?: AdvisorType) {
    switch (advisor) {
      case (advisor = AdvisorType.paper):
        this.advisor = this.strat.setTradeAdvisor(new PaperAdvisor(this));
        break;
      case (advisor = AdvisorType.portfolio):
        this.advisor = this.strat.setTradeAdvisor(new PortfolioAdvisor(this));
        break;
      case (advisor = AdvisorType.live):
        this.advisor = this.strat.setTradeAdvisor(new LiveAdvisor(this));
        break;
      case (advisor = AdvisorType.percentage):
        this.advisor = this.strat.setTradeAdvisor(new PercentageAdvisor(this));
        break;
      case (advisor = AdvisorType.DCA):
        this.advisor = this.strat.setTradeAdvisor(new DCAAdvisor(this));
        break;
      default:
        this.advisor = this.strat.setTradeAdvisor(new PaperAdvisor(this));
        break;
    }
  }
}
