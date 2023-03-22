import { Indicator } from '../model/indicator';

// required indicators
// Simple Moving Average - O(1) implementation

export class SMA extends Indicator {
    sum: number;
    name = 'sma';
    prices = [];

    constructor(public settings) {
        super(settings);
        this.sum = 0;
    }
    reset() {
        throw new Error('Method not implemented.');
    }
    update(price: number) {
        this.previousResult = this.result;
        var tail = this.prices[this.age] || 0; // oldest price in window
        this.prices[this.age] = price;
        this.sum += price - tail || 0;
        this.result = this.sum / this.prices.length;

        this.age = (this.age + 1) % this.settings.weight;
        this.returnPercentageIncrease();
    }
}
