import { Candle } from '../model/candle';
import { Logger } from '../model/logger';
import { Heikin } from '../model/heikin';
import { Indicator } from '../model/indicator';
import { CandleStatistics } from '../model/candle-statistics';
import { Strat } from '../model/interfaces/strat';
import { TradeAdvisor } from '../model/trade-advisor';
import { BacktestAdvisor } from '../model/backtest-advisor';
import { DelayStrategy } from '../model/delay-strategy';
import { Interval } from '../model/interval-converter';
import { IndicatorStrategies } from '../indicators/indicator-strategies/indicator-strats';
import { TelegramBot } from '../model/telegram-bot';
import { ChatGroups, Settings } from '../../settings';
import { addIndicator } from '../indicators/base-indicator';
import { Ticker } from '../model/ticker';
import { AdvisorType } from '../model/enums';
import { CandlesIndicatorResponse } from '../model/multi-timeframe';
import { AlternateTimeframe } from '../model/alternate-timeframe';
import { printDate } from '../utilities/utility';
import { IExchangeService } from '../services/IExchange-service';
import { PaperAdvisor } from '../model/paper-advisor';
import { ordertypes } from '../model/literals';
import { LiveAdvisor } from '../model/live-advisor';
import { MockExchangeService } from '../services/mock-exchange.service';
import { OrderAdvisor } from '../model/order-advisor';

export abstract class BaseStrategy implements Strat {
    telegram = new TelegramBot(ChatGroups.mainAccount);
    strategyName: string;
    protected indicatorStrategies = new IndicatorStrategies();
    protected pair: string = '';
    protected ticker: Ticker;
    protected logger: Logger;
    protected ema20: Indicator;
    protected sma50: Indicator;
    protected sma200: Indicator;
    protected rsi14: Indicator;
    protected volume20: Indicator;
    protected candle: Candle;
    protected heikin: Heikin;
    private history: number;
    private age = 0;
    protected candleStats: CandleStatistics;
    protected canTrade: boolean = true;
    protected backtestMode: boolean;
    protected previousCandle: Candle;
    private hasTraded: boolean = false;
    protected delayStrat = new DelayStrategy();
    protected delayOn: boolean;
    private indicatorWeight: number = 20;
    protected tradeAdvisor: TradeAdvisor;
    private profitMargins = [
        { percent: 1, notified: false },
        { percent: 3, notified: false },
        { percent: 5, notified: false },
        { percent: 8, notified: false },
        { percent: 13, notified: false },
    ];
    protected intervalsInDay: number;
    protected dailyCandles: CandlesIndicatorResponse;
    protected hasDailyCandles: boolean = false;
    protected canBuy: boolean;
    protected canSell: boolean;

    get profit() {
        return this.tradeAdvisor.profit;
    }

    constructor(public exchange: IExchangeService, public advisorType: AdvisorType = AdvisorType.paper) {
        this.ticker = this.exchange.ticker;
        this.pair = this.ticker.pair;
        this.logger = new Logger(this.ticker);
        this.candleStats = new CandleStatistics(this.ticker.interval);
        this.tradeAdvisor = new TradeAdvisor(this.ticker);
        this.loadDefaultIndicators();
    }

    async loadMockExchangeInfo() {
        const ex = new MockExchangeService(this.ticker);
        try {
            this.ticker = await ex.getExchangeInfo();
        } catch (error) {
            throw Error('MockExchange: LoadInfo');
        }
    }

    async setAdvisor() {
        switch (this.advisorType) {
            case (this.advisorType = AdvisorType.paper):
                this.tradeAdvisor.advisor = new PaperAdvisor(new MockExchangeService(this.ticker));
                break;
            case (this.advisorType = AdvisorType.live):
                this.tradeAdvisor.advisor = new LiveAdvisor(this.exchange);
                break;
            case (this.advisorType = AdvisorType.order):
                this.tradeAdvisor.advisor = new OrderAdvisor(this.exchange);
                break;
            default:
                this.tradeAdvisor.advisor = new PaperAdvisor(new MockExchangeService(this.ticker));
                break;
        }
        await this.tradeAdvisor.advisor.doSetup(false);
        await this.tradeAdvisor.trader.addSymbolMongoDb(this.ticker);
    }

    abstract loadIndicators();

    private async loadDefaultIndicators() {
        this.ema20 = addIndicator('ema', { weight: 20, name: 'ema20' });
        this.sma50 = addIndicator('sma', { weight: 50, name: 'sma50' });
        // this.sma200 = addIndicator('sma', { weight: 200, name: 'sma200' });
        this.rsi14 = addIndicator('rsi', { weight: 14, name: 'rsi14' });
        this.volume20 = addIndicator('sma', {
            weight: 20,
            input: 'volume',
            inputType: 'candle',
            name: 'Volume SMA20',
        });
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
                this.indicatorWeight = Math.max(
                    this.indicatorWeight,
                    this.indicatorStrategies.getMaxWeight()
                );
            }
        }
    }

    async loadHistory(candleHistory: Candle[]) {
        this.loadIndicators();
        this.calculateIndicatorWeight();
        this.history = candleHistory.length;
        try {
            await this.tradeAdvisor.advisor.exchange.getExchangeInfo();
            for (let i = 0; i < candleHistory.length; i++) {
                await this.update(candleHistory[i]);
            }
            // reset settings
            console.log(
                `${this.strategyName} running on ${this.ticker.interval} intervals against ${this.pair}`
            );
            this.tradeAdvisor.endAdvisor(this.candle?.close);
            this.strategyName = this.strategyName;
            this.resetParameters();
            await this.setAdvisor();
        } catch (error) {
            throw new Error('BaseStraat: loadHistory() Failed');
        }
    }

    createAlternateTimeframe(interval: Interval, cb?: any) {
        const tf: AlternateTimeframe = new AlternateTimeframe(interval, this.exchange);
        if (cb) cb(tf);
        return tf;
    }

    updateCandles(candle) {
        this.candle = candle;
        this.tradeAdvisor.candle = candle;
        !this.heikin ? (this.heikin = new Heikin(candle)) : this.heikin.addCandle(candle);
    }

    async update(candle: Candle) {
        this.ticker.candle = candle;
        // this.previousCandle ? null : (this.previousCandle = this.candle);
        if (!candle.isFinal) {
            await this.realtimeAdvice(candle);
        } else {
            this.age++;
            this.ticker.updateTicks();
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
                Settings.backTest && (await this.advice());
            } catch (error) {
                console.log(error);
            }
        }
    }

    private async check() {
        this.candleStats.calculateStatistics(this.candle); // 5 minute candle
        this.delayOn = this.delayStrat.checkDelay();
        this.backtestMode = this.tradeAdvisor.advisor instanceof BacktestAdvisor;
        if (this.age > this.history) {
            await this.tradeAdvisor.trader.updateCurrencyAmountMongoDb(this.ticker);
            await this.advice();
            this.profitNotifier();
            this.logStatus(this.tradeAdvisor.profit);
        } else {
            await this.backTest();
        }
        this.previousCandle = this.candle;
    }

    profitNotifier() {
        const profit = +this.tradeAdvisor.profit;
        if (profit > 0 && profit < 1) return;
        if (profit < 0) {
            this.profitMargins.map((p) => (p.notified = false));
            if (profit < -10) this.telegram.sendMessage('Profit now below 10%. consider Selling');
            return;
        }

        const pr = this.profitMargins
            .map((p) => p.percent)
            .filter((p) => p <= profit)
            .reduce((p, c) => Math.max(p, c), 0);
        const percentToMessage = this.profitMargins.find(
            (percent) => percent.percent == pr && !percent.notified
        );

        if (percentToMessage) {
            !this.backtestMode
                ? this.telegram.sendMessage(`${this.ticker.pair} has reached ${pr} percent profit`)
                : false;
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
        if (!this.ticker.isLong || warning) {
            console.log('\u001b[' + 31 + 'm' + message + '\u001b[0m');
        } else {
            console.log('\u001b[' + 32 + 'm' + message + '\u001b[0m');
        }
    }

    checkTradeStatus(cb: any) {
        this.canTrade = cb();
    }

    printDate = printDate;

    protected resetParameters() {}

    abstract realtimeAdvice(candle: Candle): Promise<void>;

    abstract advice(): Promise<void>;

    protected abstract logStatus(advice: any);
}

function lastSunday(month, year) {
    var d = new Date();
    var lastDayOfMonth = new Date(Date.UTC(year || d.getFullYear(), month + 1, 0));
    var day = lastDayOfMonth.getDay();
    return new Date(
        Date.UTC(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate() - day)
    );
}

function isBST(date) {
    var d = date || new Date();
    var starts = lastSunday(2, d.getFullYear());
    starts.setHours(1);
    var ends = lastSunday(9, d.getFullYear());
    starts.setHours(1);
    return d.getTime() >= starts.getTime() && d.getTime() < ends.getTime();
}
