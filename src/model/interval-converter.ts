export const minutesPerDay = 1440;

export enum IntervalType {
    minute,
    hour,
    day,
    week,
}
export class Interval {
    distance: number;
    day: number;
    type: IntervalType;
    minutes!: number;
    constructor(public interval: string, divider: number = 60) {
        const endof = interval.slice(-1);
        switch (endof) {
            case 'm':
                this.type = IntervalType.minute;
                this.distance = +interval.substring(0, interval.length - 1);
                this.day = minutesPerDay / divider;
                this.minutes = this.distance;
                break;
            case 'h':
                this.type = IntervalType.hour;
                this.distance = +interval.substring(0, interval.length - 1);
                this.day = minutesPerDay / divider;
                this.minutes = divider;
                break;
            case 'd':
                this.type = IntervalType.day;
                this.distance = +interval.substring(0, interval.length - 1);
                this.day = 1;
                this.minutes = divider;
                break;
            case 'w':
                this.type = IntervalType.week;
                this.distance = 7;
                this.day = 0;
                this.minutes = divider;
                break;
            default:
                break;
        }
    }
}

export const Intervals: Interval[] = [
    new Interval('1m', 8),
    new Interval('5m', 5),
    new Interval('15m', 15),
    new Interval('30m', 30),
    new Interval('1h', 60),
    new Interval('4h', 60 * 4),
    new Interval('12h', 60 * 12),
    new Interval('1d', minutesPerDay),
    new Interval('1w'),
];
