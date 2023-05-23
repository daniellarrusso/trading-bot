import { Logger } from '../../model/logger';
import { Indicator } from '../../model/indicator';
import { addIndicator } from '../../indicators/base-indicator';
import { BaseStrategy } from '../base-strategy';
import { ActionType, AdvisorType } from '../../model/enums';
import { Trader } from '../../services/trader-service';

import { Candle } from '../../model/candle';
import { StopType } from '../../model/stop';
import { CallbackDelay } from '../../model/callback-delay';
import { DelayStrategy } from '../../model/delay-strategy';
import { Wave } from '../../model/wave';
import { IExchangeService } from '../../services/IExchange-service';

export class TrendBrokenStrategy extends BaseStrategy {
    rsi: Indicator;
    cci: Indicator;
    ema: Indicator;
    sma: Indicator;
    smaLong: Indicator;
    waveCount: number = 0;
    stopPrice: number;
    bullish: boolean;
    rsiStop = new StopType(0);
    wave: Wave;
    buyTrigger: number;
    sellTrigger: number;
    sellZone1: number;
    moveLow: number;
    moveEnded: number;

    constructor(public strat: IExchangeService, advisor: AdvisorType) {
        super(strat, advisor);
        this.strategyName = 'Trend Broken Strat';
    }

    loadIndicators() {
        this.cci = addIndicator('sniper-cci', { weight: 14, name: 'sniper-cci' });
        this.rsi = addIndicator('rsi', { weight: 14, name: 'rsi' });
        this.ema = addIndicator('ema', { weight: 20, name: 'ema20' });
        this.sma = addIndicator('sma', { weight: 50, name: 'sma50' });
        this.smaLong = addIndicator('sma', { weight: 200, name: 'sma200' });
    }
    async realtimeAdvice(candle: Candle) {
        throw new Error('Method not implemented.');
    }
    async advice() {
        const candle = this.candle;
        const lastBuy = this.tradeAdvisor?.longPrice;
        const ema = this.ema.result;
        const sma = this.sma.result;
        const smaLong = this.smaLong.result;
        const rsi = this.rsi.result;
        const { result: cci, previousResult: prevCci } = this.cci;
        const low = this.candleStats.getHighLowForPeriod(21, false);
        const high = this.candleStats.getHighLowForPeriod(21, true);

        this.checkTradeStatus(() => {
            return true;
        });

        if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
            if (this.candleStats.higherHigh && !this.wave) {
                // create Wave
                this.wave = new Wave(low, high, candle);
            }
            if (this.wave && this.wave.active && candle.close > this.wave.high) {
                this.wave.activateWave(candle);
                this.tradeAdvisor.trade();
                this.resetStops();
            }
        }
        if (this.tradeAdvisor.inTrade) {
            this.wave.decrement();
            if (candle.high > this.wave.short) {
                this.tradeAdvisor.trade();
                const endOfWave = candle.high - (candle.high - this.wave.low) * 0.5;
                this.wave = null;

                this.delayStrat.start(
                    new CallbackDelay(6, () => {
                        return this.candle.close > endOfWave;
                    })
                );
            } else if (candle.close < this.wave.stop) {
                this.tradeAdvisor.trade();
                this.wave = null;
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
        let message = `${this.ticker.pair} PRICE: ${this.candle.close} ${heikin}. Advisor ${nextAction}. Profit: ${advice}`;
        this.consoleColour(message);
    }

    logColour(message: string, warning: boolean) {
        if (warning) {
            console.log('\u001b[' + 31 + 'm' + message + '\u001b[0m');
        } else {
            console.log('\u001b[' + 32 + 'm' + message + '\u001b[0m');
        }
    }

    stopSetter(stopPrice: number, stopType: StopType) {
        if (!stopType.price) {
            stopType.price = stopPrice;
            this.stopPrice = stopPrice;
        }
    }

    resetStops() {
        for (let obj in this) {
            if (this[obj] instanceof StopType) {
                this[obj]['price'] = 0;
            }
        }
    }
}
