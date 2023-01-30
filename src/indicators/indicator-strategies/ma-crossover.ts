import { Indicator } from "../../model/indicator";
import { returnPercentageIncrease } from "../../utilities/utility";
import { addIndicator } from "../base-indicator";
import { IndicatorStrategy, Trend } from "./indicator-strategy";

export class MaCrossover implements IndicatorStrategy {
    crossingUp: boolean;
    trend: Trend;
    previousTrend: any;
    ema: Indicator;
    sma: Indicator;
    smaLong: Indicator;
    maxWeight: number;

    constructor(emaWeight = 20, smaWeight = 50, smaLongWeight = 200) {
        this.ema = addIndicator('ema', { weight: emaWeight });
        this.sma = addIndicator('sma', { weight: smaWeight });
        this.smaLong = addIndicator('sma', { weight: smaLongWeight });
        this.maxWeight = [emaWeight, smaWeight, smaLongWeight].reduce((p, c) => Math.max(p, c), 0);
        this.trend = new Trend();
    }
    getWeight(): number {
        return this.maxWeight;
    }

    update(value: number) {
        this.ema.update(value);
        this.sma.update(value);
        this.smaLong.update(value);
        this.setTrend();
    }

    setTrend() {
        const crossingUp = this.ema.result > this.sma.result && this.sma.result > this.sma.previousResult && this.sma.result > this.smaLong.result;
        this.trend.setTrend(crossingUp);
    }
}