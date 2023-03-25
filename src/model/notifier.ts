import { ChatGroups } from '../../settings';
import { printDate } from '../utilities/utility';
import { Notification } from './notification';
import { TelegramBot } from './telegram-bot';
import { Ticker } from './ticker';

export class Notifier {
  telegram = new TelegramBot(ChatGroups.mainAccount);
  notifiers: Notification[] = [];

  constructor(public ticker: Ticker) {}

  addNotifier(notification: Notification) {
    this.notifiers.push(notification);
  }

  notifiy(isBackTest: boolean) {
    const { time, close } = this.ticker.candle;

    this.notifiers.map((n) => {
      if (n.canNotify && n.notify()) {
        const message = `${this.ticker.pair} ${close} ${n.type} ${printDate(time)}`;
        if (!isBackTest) this.telegram.sendMessage(message);
        console.log(message);
        n.canNotify = false;
      }
      n.canNotify = n.clear();
    });
  }
}
