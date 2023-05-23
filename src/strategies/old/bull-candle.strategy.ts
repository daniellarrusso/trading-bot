import { addIndicator } from '../../indicators/base-indicator';
import { CallbackDelay } from '../../model/callback-delay';
import { Candle } from '../../model/candle';
import { DelayStrategy } from '../../model/delay-strategy';
import { SellReason, ActionType, AdvisorType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class BullCandleStrategy extends BaseStrategy {
    // 4 hr candle
    // if Bullish Candle and above previous high - then buy
    // if Bearish Candle and low lower than previous low - then sell
    sma: Indicator;
    ema: Indicator;
    smaLong: Indicator;
    rsi: Indicator;
    stopPrice: number;
    delayStrat = new DelayStrategy();
    profitTake: boolean;

    constructor(public pair, advisor: AdvisorType) {
        super(pair, advisor);
        this.strategyName = 'Bull Candle SMA 50';
    }

    loadIndicators() {
        this.ema = addIndicator('ema', { weight: 20, name: 'ema' });
        this.sma = addIndicator('sma', { weight: 50, name: 'sma50' });
        this.smaLong = addIndicator('sma', { weight: 200, name: 'sma200' });
        this.rsi = addIndicator('rsi', { weight: 10, name: 'rsi10' });
    }
    async realtimeAdvice(candle: Candle) {}
    async advice() {
        // set up locals
        const sma = this.sma.result;
        const smaLong = this.smaLong.result;
        const candle = this.candle;
        const emaRise = this.returnPercentageIncrease(this.ema.result, this.ema.previousResult) > 0;

        this.checkTradeStatus(() => {
            return this.candle.low < this.sma.result;
        });

        const { result: rsi, previousResult: previousRsi } = this.rsi;
        const rsiBuy = rsi < 80;
        const reasonsToSell = [];
        this.profitTake = rsi < 80 && previousRsi > 80;
        // think of something better to do with this

        // Sell reasons to refactor
        candle.low < sma && this.rsi.result > 30 ? reasonsToSell.push(SellReason.Downside) : SellReason.noop;
        if (this.profitTake) {
            this.stopPrice = this.previousCandle.low;
        }
        this.profitTake && candle.close < this.stopPrice
            ? reasonsToSell.push(SellReason.Profit)
            : SellReason.noop;
        candle.close < this.stopPrice ? reasonsToSell.push(SellReason.StopLoss) : SellReason.noop;
        // end of refactor

        if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
            if (candle.close > candle.open && candle.low > sma && rsiBuy && emaRise) {
                if (smaLong > sma) {
                    // place a stop Limit on previous candle low
                    this.stopPrice = this.previousCandle.low;
                }
                this.tradeAdvisor.trade();
            }
        } else {
            if (this.tradeAdvisor.inTrade) {
                const sellReason = reasonsToSell[0];
                switch (sellReason) {
                    case SellReason.Profit:
                        this.tradeAdvisor.trade();
                        this.delayStrat.start(new CallbackDelay(6, () => this.rsi.result > 40));
                        this.profitTake = false;
                        break;
                    case SellReason.Downside:
                        this.tradeAdvisor.trade();
                        if (this.profit > 3) {
                            this.delayStrat.start(new CallbackDelay(6, () => this.rsi.result > 50));
                        }
                        break;
                    case SellReason.StopLoss:
                        this.tradeAdvisor.trade();
                        this.delayStrat.start(new CallbackDelay(6, () => this.rsi.result > 40));
                        this.stopPrice = 0;
                        break;
                    default:
                        break;
                }
            }
        }
    }

    logStatus(advice: any): void {
        // logs strat specific info
        const heikin = ` ${
            this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
        } Heikin: ${this.heikin.close} `;
        let nextAction = 'looking to: ';
        nextAction += !this.tradeAdvisor.inTrade ? 'BUY' : 'SELL';
        let message = `${this.ticker.pair} PRICE: ${this.candle.close} ${heikin}. Advisor ${nextAction}. Profit: ${advice?.profit}`;
        this.consoleColour(message);
    }
}
