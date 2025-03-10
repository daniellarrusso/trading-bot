import moment from 'moment';
import { Exchange } from '../model/types';
import { TradeResponse } from '../model/trade-response';
import { Ticker } from '../model/ticker';

/**
 *
 * @param newNumber
 * @param originalNumber
 * @returns string - percentage by 2 decimal places
 */
export function returnPercentageIncrease(newNumber: number, originalNumber: number): number {
    const increase = ((newNumber - originalNumber) / originalNumber) * 100;
    return +increase.toFixed(2);
}

export function printDate(date: Date) {
    return moment(date).format('DD/MM/YYYY H:mm A');
}

export function createStrategy(name: string, exchange: Exchange) {
    switch (name) {
        case 'notifier':
            return;
        default:
            break;
    }
}

export function convertDate(date: Date): Date {
    const convertedDate = new Date(date);
    convertedDate.setHours(convertedDate.getHours() - convertedDate.getTimezoneOffset() / 60);
    return convertedDate;
}

export function getDayOfWeekName(dayNumber: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
}
