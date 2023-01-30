import { Delay } from './interfaces/delay';

export class DelayStrategy {
  private delay: Delay;

  start(delay: Delay) {
    this.delay = delay;
  }

  checkDelay() {
    if (!this.delay) return false;
    const delayOn = this.delay.decrementDelay();
    this.stopDelay(!delayOn);
    return delayOn;
  }

  stopDelay(stop) {
    if (stop) this.delay = null;
  }
}
