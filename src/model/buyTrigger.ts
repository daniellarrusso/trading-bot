import { Trigger } from './trigger';

export class BuyTrigger implements Trigger {
  active: boolean;
  set(cb: any): void {
    if (!this.active) this.active = cb();
  }
  unset(cb: any): void {
    if (cb() && this.active) this.active = false;
  }
}
