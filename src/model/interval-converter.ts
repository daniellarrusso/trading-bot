export const minutesPerDay = 1440;

export enum IntervalType {
    minute,
    hour,
    day,
    week,
}
export class Interval {
    distance: number;
    type: IntervalType;
    minutes!: number;
    intervals = [];
    constructor(public interval: string, intervalNumber?: number) {
        const endof = interval.slice(-1);
        switch (endof) {
            case 'm':
                this.type = IntervalType.minute;
                this.distance = +interval.substring(0, interval.length - 1);
                this.minutes = this.distance;
                break;
            case 'h':
                this.type = IntervalType.hour;
                this.distance = +interval.substring(0, interval.length - 1);
                this.minutes = (intervalNumber || 60) * this.distance;
                break;
            case 'd':
                this.type = IntervalType.day;
                this.distance = +interval.substring(0, interval.length - 1);
                this.minutes = intervalNumber || minutesPerDay;
                break;
            case 'w':
                this.type = IntervalType.week;
                this.distance = 7;
                this.minutes = intervalNumber || minutesPerDay * 7;
                break;
            default:
                break;
        }

        this.createIntervals();
    }

    createIntervals() {
        switch (this.interval) {
            case '5m':
                this.intervals = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
                break;
            case '15m':
                this.intervals = [0, 15, 30, 45];
                break;

            default:
                break;
        }
    }
}

export const Intervals: Interval[] = [
    new Interval('1m', 1),
    new Interval('5m', 5),
    new Interval('15m', 15),
    new Interval('30m', 30),
    new Interval('1h', 60),
    new Interval('4h', 60),
    new Interval('12h', 60),
    new Interval('1d', minutesPerDay),
    new Interval('1w', minutesPerDay * 7),
];
