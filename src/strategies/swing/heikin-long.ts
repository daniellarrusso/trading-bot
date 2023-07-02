import { addIndicator } from '../../indicators/base-indicator';
import { AlternateTimeframe } from '../../model/alternate-timeframe';
import { Candle } from '../../model/candle';
import { ActionType, AdvisorType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { Interval } from '../../model/interval-converter';

import { IExchangeService } from '../../services/IExchange-service';

import { BaseStrategy } from '../base-strategy';

export class HeikinLongStrategy extends BaseStrategy {
    ewo: Indicator;
    volumeMa: Indicator;
    cci: Indicator;
    sma200: Indicator;
    majorCandle: Candle;
    longTriggered: boolean = false;
    buyTrigger: number = 0;
    altTf: AlternateTimeframe;
    altRSI: Indicator;

    constructor(public strat: IExchangeService, advisor: AdvisorType) {
        super(strat, advisor);
        this.strategyName = 'Heikin Long Strategy';
    }

    loadIndicators() {
        this.ewo = addIndicator('ewo', { weight: 14, weights: [5, 35], name: 'ewo' });
        this.sma200 = addIndicator('sma', { weight: 200, name: 'sma200' });
        this.cci = addIndicator('sniper-cci', { weight: 14, input: 'close', inputType: 'heikin' });
        this.volumeMa = addIndicator('sma', { weight: 90, input: 'volume', inputType: 'candle' });

        this.altTf = this.createAlternateTimeframe(new Interval('1d'));
        this.altRSI = this.altTf.createIndicator('rsi', { weight: 14 });
    }

    async realtimeAdvice(candle: Candle) {}

    async advice() {
        const volumeIncreasePercentage = this.returnPercentageIncrease(
            this.candle.volume,
            this.volumeMa.result
        );
        const longArray = [];
        longArray.push({ type: 'cci', result: this.cci.result > 0 });
        longArray.push({ type: 'aboveSma', result: this.candle.close > this.sma200.result });
        longArray.push({ type: 'heikin', result: this.heikin.green });

        const trues = longArray.filter((a) => a.result).length;

        this.checkTradeStatus(() => {
            return this.altRSI.movingAverage < 50;
        });

        await this.altTf.process(this.candle);

        this.longTriggered = trues > 2 && this.cci.result > 0;

        if (!this.tradeAdvisor.inTrade && !this.delayOn && this.canTrade) {
            if (this.altRSI.movingAverage > 50 && this.cci.result > 0) {
                await this.tradeAdvisor.trade();
            }
        }

        if (this.tradeAdvisor.inTrade) {
            if (this.altRSI.movingAverage < 50) {
                await this.tradeAdvisor.trade();
            }
            if (this.profit > 5 || this.profit < -5) {
                // trailing stop
                await this.tradeAdvisor.trade();
            }
        }

        this.majorCandle = this.candle.candleSize > 1.8 && this.candle.green ? this.candle : this.majorCandle;
    }

    logStatus(advice: any): void {
        let canTrade = `EWO: ${this.ewo.result}. CanTrade? ${this.canTrade ? 'YES' : 'NO'}`;
        let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Advisor ${canTrade}. Profit: ${advice}`;
        this.consoleColour(message);
    }
}
