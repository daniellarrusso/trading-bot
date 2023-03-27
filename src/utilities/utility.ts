import moment from 'moment';
import { Exchange } from '../model/types';

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
