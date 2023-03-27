import moment from 'moment';
import { Exchange } from '../model/types';
import { IExchangeService } from '../services/IExchange-service';

export function returnPercentageIncrease(newNumber, originalNumber) {
  const increase = ((newNumber - originalNumber) / originalNumber) * 100;
  return increase;
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
