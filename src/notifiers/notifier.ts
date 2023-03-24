import { ChatGroups } from '../../settings';
import { Indicator } from '../model/indicator';
import { Strategy } from '../model/strategy';
import { TelegramBot } from '../model/telegram-bot';
import { Ticker } from '../model/ticker';
import { BaseStrategy } from '../strategies/base-strategy';

export interface Notification {
  type: string;
  notify: () => boolean;
  clear?: () => boolean;
}

export interface Notifier {
  id: number;
  notification: Notification;
  canNotify: boolean;
}

export class Notifications {
  id = 1;
  telegram = new TelegramBot(ChatGroups.mainAccount);
  notifiers: Notifier[] = [];

  constructor(public ticker: Ticker) {}

  addNotifier(notification: Notification) {
    const notifier: Notifier = {
      id: this.id++,
      notification,
      canNotify: true,
    };
    this.notifiers.push(notifier);
  }

  notifiy() {
    const { time, close } = this.ticker.candle;

    this.notifiers.map((n) => {
      if (n.canNotify) {
        if (n.notification.notify()) {
          console.log(`${this.ticker.pair} ${n.notification.type} ${close} at ${time}`);
          n.canNotify = false;
        }
      } else {
        n.canNotify = n.notification.clear();
      }
    });
  }
}

export class NotifierStrategy extends BaseStrategy {
  notifcations = new Notifications(this.ticker);

  constructor(public strat: Strategy) {
    super(strat);
    this.strategyName = 'Notifier';
  }

  loadIndicators() {
    // this.notifcations.addNotifier(this.rsiNotification(this.rsi14, 30, true));
    this.notifcations.addNotifier(this.rsiMaNotification(this.rsi14, 30, true));
    // this.notifcations.addNotifier(this.rsiNotification(this.rsi14, 70, false));
  }

  rsiNotification(rsiIndicator: Indicator, threshold: number, isLong: boolean): Notification {
    const notification: Notification = {
      type: `RSI ${isLong ? 'Long' : 'Short'} ${threshold}`,
      notify: () => rsiIndicator.result < threshold && rsiIndicator.previousResult > threshold,
    };
    return notification;
  }

  rsiMaNotification(rsi: Indicator, threshold: number, isLong: boolean) {
    const notification: Notification = {
      type: `RSI MA ${isLong ? 'Long' : 'Short'} ${threshold}`,
      notify: isLong ? () => rsi.movingAverage < threshold : () => rsi.movingAverage > threshold,
      clear: () => rsi.movingAverage > threshold,
    };
    return notification;
  }

  async realtimeAdvice() {}

  async advice() {
    this.notifcations.notifiy();
  }

  logStatus(advice: any): void {
    let enabled = this.canTrade ? 'YES' : 'NO';
    const usedIndicators = this.logger.displayIndicators();
    let message = `${this.ticker.pair} PRICE: ${this.ticker.printPrice}. Enabled: ${enabled}. Strategy: ${usedIndicators} Profit: ${advice}`;
    this.consoleColour(message);
  }
}
