import { Settings } from '../../keys';
import { Candle } from './candle';
import { ActionType } from './enums';

export class Ticker {
  pair: string;
  assetQuantity: number;
  currencyQuantity: number;
  minQty: number;
  tickSize: string;
  stepSize: string;
  candle: Candle;
  private _action: ActionType;
  constructor(public asset: string, public currency: string, action: ActionType, public interval: string) {
    this.pair = asset + currency;
    this._action = action;
  }

  get action() {
    return this._action;
  }

  setActionType(action?: ActionType): ActionType {
    if (action) this._action = action;
    else this._action = this._action === ActionType.Long ? ActionType.Short : ActionType.Long;
    return this._action;
  }
}
