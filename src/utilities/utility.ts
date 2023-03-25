import moment from 'moment';

export function returnPercentageIncrease(newNumber, originalNumber) {
  const increase = ((newNumber - originalNumber) / originalNumber) * 100;
  return increase;
}

export function printDate(date: Date) {
  return moment(date).format('DD/MM/YYYY H:mm A');
}
