import { Indicator } from '../model/indicator';
import { BaseStrategy } from '../strategies/base-strategy';
import { Notification } from '../model/notification';
import { Notifier } from '../model/notifier';
import { IExchangeService } from '../services/IExchange-service';

export class NotifierStrategy extends BaseStrategy {
  notifcations = new Notifier(this.ticker);

  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Notifier';
  }

  loadIndicators() {
    this.notifcations.addNotifier(this.rsiNotification(this.rsi14, 30, true));
    this.notifcations.addNotifier(this.rsiNotification(this.rsi14, 70, false));
    this.notifcations.addNotifier(this.rsiMaNotification(this.rsi14, 30, true));
    this.notifcations.addNotifier(this.rsiMaNotification(this.rsi14, 70, false));
    this.notifcations.addNotifier(this.emaSmaCrossNotification(this.ema20, this.sma50, true));
    this.notifcations.addNotifier(this.emaSmaCrossNotification(this.ema20, this.sma50, false));
  }

  rsiNotification(rsiIndicator: Indicator, threshold: number, isLong: boolean): Notification {
    const notification: Notification = {
      type: `RSI ${isLong ? 'Below' : 'Above'} ${threshold}`,
      notify: isLong ? () => rsiIndicator.result < threshold : () => rsiIndicator.result > threshold,
      clear: !isLong ? () => rsiIndicator.result < threshold : () => rsiIndicator.result > threshold,
    };
    return notification;
  }

  rsiMaNotification(rsi: Indicator, threshold: number, isLong: boolean) {
    const notification: Notification = {
      type: `RSI MA ${isLong ? 'Below' : 'Above'} ${threshold}`,
      notify: isLong ? () => rsi.movingAverage < threshold : () => rsi.movingAverage > threshold,
      clear: !isLong ? () => rsi.movingAverage < threshold : () => rsi.movingAverage > threshold,
    };
    return notification;
  }

  emaSmaCrossNotification(shortMa: Indicator, longMa: Indicator, isLong: boolean) {
    const notification: Notification = {
      type: isLong
        ? `${shortMa.weight}MA above ${longMa.weight}MA`
        : `${shortMa.weight}MA below ${longMa.weight}MA`,
      notify: isLong ? () => shortMa.result > longMa.result : () => shortMa.result < longMa.result,
      clear: !isLong ? () => shortMa.result > longMa.result : () => shortMa.result < longMa.result,
    };
    return notification;
  }

  async realtimeAdvice() {}

  async advice() {
    this.notifcations.notifiy(this.backtestMode);
  }

  logStatus(advice: any): void {
    let enabled = this.canTrade ? 'YES' : 'NO';
    const usedIndicators = this.logger.displayIndicators();
    let message = `${this.ticker.pair} PRICE: ${this.ticker.printPrice}. Enabled: ${enabled}. Strategy: ${usedIndicators} Profit: ${advice}`;
    this.consoleColour(message);
  }
}
