export interface IndicatorStrategy {
    trend: Trend;
    update(value: any): void;
    getWeight(): number;
}

export class Trend {
    active: boolean;
    duration: number = 0;
    isUp: boolean;
    communicated: boolean;

    setTrend(isUp: boolean) {
        this.duration++;
        this.activateTrend(isUp);
        if (this.isUp != isUp && this.active) {
            this.duration = 0;
        }
        this.isUp = isUp;
    }

    activateTrend(up: boolean): void {
        if (!up && this.duration > 0 && !this.active) 
            this.active = true;
    }
}