import { Candle } from './candle';
import { ActionType } from './enums';

export class Ticker {
    pair: string;
    krakenPair: string;
    assetQuantity: number;
    currencyQuantity: number;
    minQty: number;
    tickSize: string;
    stepSize: string;
    candle: Candle;
    isMarketOrders: boolean;
    roundStep: (quantity, stepSize) => string;
    private _action: ActionType;
    ticks: number = 0;
    pairDecimals: any;
    lotDecimals: any;

    constructor(
        public asset: string,
        public currency: string,
        action: ActionType,
        public interval: string,
        public currencyAmount = 100
    ) {
        this.pair = asset + currency;
        this.krakenPair = asset + '/' + currency;
        this._action = action;
    }

    get action() {
        return this._action;
    }

    updateTicks() {
        this.ticks = this.ticks + 1;
    }

    normalisePrice(price: number): string {
        if (typeof price === 'string') {
            return price;
        }
        return price.toFixed(this.tickSize.indexOf('1') - 1);
    }

    formatQuantity(quantity: number) {
        return this.roundStep(quantity, this.stepSize);
    }
    /**
     * If actiontype is Short then most likely in a 'long' position
     */
    get isLong() {
        return this._action === ActionType.Short ? true : false;
    }

    get printPrice() {
        return this.candle.close.normalise(this.tickSize);
    }

    setActionType(action?: ActionType): ActionType {
        if (action !== undefined) this._action = action;
        else this._action = this._action === ActionType.Long ? ActionType.Short : ActionType.Long;
        return this._action;
    }
}
