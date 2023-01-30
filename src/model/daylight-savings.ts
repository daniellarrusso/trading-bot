import { Subject } from './subject';

export class DaylightSavings extends Subject {
  private _isDST: boolean;

  get isDST() {
    return this._isDST;
  }

  setInitialValue(isDST: boolean) {
    if (this._isDST === undefined) {
      this._isDST = isDST;
    }
  }

  update(isDST: boolean) {
    this.setInitialValue(isDST);
    if (isDST !== this._isDST) {
      this._isDST = isDST;
      this.notifyObservers();
    }
  }
}
