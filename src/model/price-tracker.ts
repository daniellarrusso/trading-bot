export class PriceTracker {
    currentValue: number;
    previousValue: number;
    updated: boolean;
    values = [];
    callback: any;

    constructor(callback: any) { this.callback = callback }

    update(value: number, isHigh: boolean) {
        if (this.callback()) {
            this.addValue(value);
        } else if (this.values.length > 0) {
            this.calculate(isHigh);
        }
    }

    addCurrentValue(value: number) {
        if (!this.previousValue)
            this.addPreviousValue(value)
        this.currentValue = value;
    }

    addPreviousValue(value: number) {
        this.previousValue = value;
    }

    addValue(value: number) {
        this.values.push(value);
        this.updated = false;
    }

    calculate(isHigh: boolean) {
        if (this.currentValue && this.previousValue) {
            // both have values so copy to previous
            this.previousValue = this.currentValue;
        }
        const val = isHigh ? this.values.reduce((p, c) => Math.max(p, c), 0) : this.values.reduce((p, c) => Math.min(p, c), 10000000);
        this.addCurrentValue(val);
        this.values.length = 0;
        this.updated = true;
    }
}