import { Candle } from '../model/candle';
import { Logger } from '../model/logger';
import { Heikin } from '../model/heikin';
import { Indicator } from '../model/indicator';
import { CandleStatistics } from '../model/candle-statistics';
import moment from 'moment';
import { Strategy } from '../model/strategy';
import { Strat } from '../model/interfaces/strat';
import { TradeAdvisor } from '../model/trade-advisor';
import { BacktestAdvisor } from '../model/backtest-advisor';
import { DelayStrategy } from '../model/delay-strategy';
import { Interval, Intervals } from '../model/interval-converter';
import { IAdvisor } from '../model/interfaces/advisor-interface';
import { IndicatorStrategies } from '../indicators/indicator-strategies/indicator-strats';
import { TelegramBot } from '../model/telegram-bot';
import { ChatGroups, Settings } from '../../keys';
import { addIndicator } from '../indicators/base-indicator';
import { Ticker } from '../model/ticker';
import { Trade } from '../model/interfaces/mongoTrade';
import { Advisor } from '../model/advisor';
import { ActionType } from '../model/enums';
import { CandlesIndicatorResponse } from '../model/multi-timeframe';
import { DaylightSavings } from '../model/daylight-savings';
import { AlternateTimeframe } from '../model/alternate-timeframe';

export abstract class BaseStrategy implements Strat {
  protected ticker: Ticker;
  protected logger: Logger = new Logger();
  protected ema20: Indicator;
  protected sma50: Indicator;
  protected sma200: Indicator;
  protected rsi14: Indicator;
  protected volume20: Indicator;
  public strategyName: string;
  public candle: Candle;
  protected heikin: Heikin;
  private history: number;
  private age = 0;
  protected candleStats: CandleStatistics;
  protected backtestMode: boolean;
  protected tradeAdvisor: TradeAdvisor;
  protected previousCandle: Candle;
  protected canTrade: boolean = false;
  private hasTraded: boolean;
  protected delayStrat = new DelayStrategy();
  protected delayOn: boolean;
  private _profit: number = 0;
  private indicatorWeight: number = 20;
  public indicatorStrategies = new IndicatorStrategies();
  protected telegram = new TelegramBot(ChatGroups.mainAccount);
  private profitMargins = [
    { percent: 1, notified: false },
    { percent: 3, notified: false },
    { percent: 5, notified: false },
    { percent: 8, notified: false },
    { percent: 13, notified: false },
  ];
  protected intervalsInDay: number;
  public pair: string = '';
  protected tradeStatus: Trade;
  protected dailyCandles: CandlesIndicatorResponse;
  protected hasDailyCandles: boolean = false;

  private _lastBuyprice = 0;
  get lastBuyprice() {
    return this._lastBuyprice;
  }
  protected canBuy: boolean;
  protected canSell: boolean;

  constructor(public strat: Strategy) {
    this.pair = strat.exchange.ticker.pair;
    this.ticker = strat.exchange.ticker;
    this.candleStats = new CandleStatistics(this.ticker.interval);
    this.tradeAdvisor = new TradeAdvisor(this.strat);
    this.loadDefaultIndicators();
    this.calculateIndicatorWeight();
  }

  public setTradeAdvisor(advisor: Advisor) {
    this.tradeAdvisor.advisor = advisor;
    return advisor;
  }

  get profit() {
    return +this._profit.toFixed(2);
  }
  set profit(value: number) {
    this._profit = value;
  }

  abstract loadIndicators();

  private loadDefaultIndicators() {
    this.ema20 = addIndicator('ema', { weight: 20, name: 'ema 20' });
    this.sma50 = addIndicator('sma', { weight: 50, name: 'sma 50' });
    this.sma200 = addIndicator('sma', { weight: 200, name: 'sma 200' });
    this.rsi14 = addIndicator('rsi', { weight: 14, name: 'RSI 14' });
    this.volume20 = addIndicator('sma', {
      weight: 20,
      input: 'volume',
      inputType: 'candle',
      name: 'Volume SMA20',
    });
    this.loadIndicators();
  }

  private calculateIndicatorWeight() {
    const weightArray = [];
    for (let obj in this) {
      if (this[obj] instanceof Indicator) {
        let indicator: any = this[obj];
        if (indicator.settings.weight) {
          weightArray.push(indicator.settings.weight);
        }
        this.indicatorWeight = weightArray.reduce((p, c) => Math.max(p, c), 50);
        this.indicatorWeight = Math.max(this.indicatorWeight, this.indicatorStrategies.getMaxWeight());
      }
    }
  }

  async loadHistory(candleHistory: Candle[]) {
    this.history = candleHistory.length;
    for (let i = 0; i < candleHistory.length; i++) {
      await this.update(candleHistory[i]);
    }
    // reset settings
    console.log(`${this.strategyName} running on ${this.ticker.interval} intervals against ${this.pair}`);
    this.tradeAdvisor.endAdvisor(this.candle?.close);
    this.strat.strategyName = this.strategyName;
    this.hasTraded = false;
    this.resetParameters();
  }

  createAlternateTimeframe(interval: Interval, cb: any) {
    const tf = new AlternateTimeframe(interval, this.strat.exchange);
    cb(tf);
    return tf;
  }

  updateCandles(candle) {
    this.candle = candle;
    this.tradeAdvisor.candle = candle;
    !this.heikin ? (this.heikin = new Heikin(candle)) : this.heikin.addCandle(candle);
  }

  async update(candle: Candle) {
    this.ticker.candle = candle;
    this.previousCandle ? null : (this.previousCandle = this.candle);

    if (!candle.isFinal) {
      await this.realtimeAdvice(candle);
    } else {
      this.age++;
      this.updateCandles(candle);
      this.indicatorStrategies.update(candle.close);
      for (let obj in this) {
        if (this[obj] instanceof Indicator) {
          let indicator: any = this[obj];
          let input: any = indicator.input;
          let inputType: any = indicator.inputType;
          if (!indicator.manualUpdate) {
            if (input) {
              indicator.update(this[inputType][input]);
            } else {
              indicator.update(this[inputType]);
            }
          }
        }
      }
      await this.check();
    }
  }

  private async backTest() {
    if (this.age > this.indicatorWeight) {
      try {
        this.profit = this.returnPercentageIncrease(this.candle.close, this.tradeAdvisor.lastBuyClose);

        Settings.backTest ? await this.advice() : false;
      } catch (error) {
        console.log(error);
      }
    }
  }

  private async check() {
    this.candleStats.calculateStatistics(this.candle); // 5 minute candle
    this.delayOn = this.delayStrat.checkDelay();
    this.canBuy = this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade;
    this.canSell = this.tradeAdvisor.actionType === ActionType.Short;

    if (this.age > this.history) {
      this.tradeAdvisor.advisor = this.strat.advisor;
      this.backtestMode = this.tradeAdvisor.advisor instanceof BacktestAdvisor;
      this.candleStats.logStats();
      this.tradeStatus = await this.strat.tradesDb.findTicker();
      this._lastBuyprice = this.tradeStatus?.inTrade ? this.tradeStatus.lastBuy : this.tradeAdvisor.lastBuyClose;
      if (this._lastBuyprice) {
        this.profit = this.returnPercentageIncrease(this.candle.close, this.lastBuyprice);
      }
      await Settings.trader.refreshTradeSettings();
      await this.advice();
      this.logStatus(this.profit);
      this.profitNotifier();
    } else {
      await this.backTest();
    }
    this.previousCandle = this.candle;
    this.backtestMode = this.tradeAdvisor.advisor instanceof BacktestAdvisor;
  }

  private profitNotifier() {
    if (this.profit > 0 && this.profit < 1) return;
    if (this.profit < 0) {
      this.profitMargins.map((p) => (p.notified = false));
      return;
    }

    const pr = this.profitMargins
      .map((p) => p.percent)
      .filter((p) => p <= this.profit)
      .reduce((p, c) => Math.max(p, c), 0);
    const percentToMessage = this.profitMargins.find((percent) => percent.percent == pr && !percent.notified);

    if (percentToMessage) {
      !this.backtestMode ? this.telegram.sendMessage(`${this.ticker.pair} has reached ${pr} percent profit`) : false;
      percentToMessage.notified = true;
      this.profitMargins.filter((p) => p !== percentToMessage).map((c) => (c.notified = false));
    }
  }

  returnPercentageIncrease(finalValue, startingValue) {
    if (finalValue === 0 || startingValue === 0) return 0;
    const increase = ((finalValue - startingValue) / startingValue) * 100;
    return increase;
  }

  percentageDifference(numA, numB) {
    return Number(((Math.abs(numA - numB) / ((numA + numB) / 2)) * 100).toFixed(3));
  }

  consoleColour(message: string, warning: boolean = false) {
    if (!this.tradeStatus?.inTrade || warning) {
      console.log('\u001b[' + 31 + 'm' + message + '\u001b[0m');
    } else {
      console.log('\u001b[' + 32 + 'm' + message + '\u001b[0m');
    }
  }

  checkTradeStatus(cb) {
    if (!this.hasTraded) {
      if (cb()) {
        this.canTrade = true;
        this.hasTraded = true;
        console.log(this.candle.pair + ' can now begin trading below buy threshold');
      } else {
        this.canTrade = false;
      }
    } else {
      this.canTrade = Settings.trader.canTrade();
    }
  }

  protected resetParameters() { }

  abstract realtimeAdvice(candle: Candle): Promise<void>;

  abstract advice(): Promise<void>;

  protected abstract logStatus(advice: any);

  async getDailyCandles(pair: string, indicator: any) {
    let hour = 0;
    if (isBST(this.candle.time)) hour = 1;
    const endTime = new Date(this.candle.closeTime.getTime() + 1000);
    if (!this.dailyCandles && !this.backtestMode) {
      try {
        this.dailyCandles = await this.strat.exchange.getHistoryWithIndicator(pair, '1d', indicator, null, true);
      } catch (error) {
        console.log(error.body);
      }
    }
    if (endTime.getHours() === hour) {
      try {
        this.dailyCandles = await this.strat.exchange.getHistoryWithIndicator(pair, '1d', indicator);
      } catch (error) {
        console.log(error.body);
      }
    }
  }
}

function lastSunday(month, year) {
  var d = new Date();
  var lastDayOfMonth = new Date(Date.UTC(year || d.getFullYear(), month + 1, 0));
  var day = lastDayOfMonth.getDay();
  return new Date(Date.UTC(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate() - day));
}

function isBST(date) {
  var d = date || new Date();
  var starts = lastSunday(2, d.getFullYear());
  starts.setHours(1);
  var ends = lastSunday(9, d.getFullYear());
  starts.setHours(1);
  return d.getTime() >= starts.getTime() && d.getTime() < ends.getTime();
}
