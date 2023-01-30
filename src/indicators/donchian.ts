import { Candle } from "../model/candle";
import { Indicator } from "../model/indicator";

export class Donchian extends Indicator {
    candlesticks: Candle[] = [];
    highs = [];
    lows = [];
    constructor(public settings) {
        super(settings);
        this.input = null;

    }
    update(candle: Candle) {
        this.candlesticks.push(candle);
        if (this.candlesticks.length > this.weight) {
            this.candlesticks.shift();
            this.highs = this.candlesticks.map(c => c.high);
            this.lows = this.candlesticks.map(c => c.low);
            this.resultEntity.high = this.highs.reduce((p, c) => Math.max(p, c));
            this.resultEntity.low = this.lows.reduce((p, c) => Math.min(p, c));
            this.resultEntity.average = (this.resultEntity.high + this.resultEntity.low) / 2;
        }
    }
    reset() {

    }

}