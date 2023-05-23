import { Settings } from '../../../settings';
import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType, AdvisorType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { LimitOrder } from '../../model/limit-order';

import { TradeResponse } from '../../model/trade-response';
import { BinanceService } from '../../services/binance-service';
import { IExchangeService } from '../../services/IExchange-service';
import { Trader } from '../../services/trader-service';
import { BaseStrategy } from '../base-strategy';

export class WickCatcherStrategy extends BaseStrategy {
    buyLimit: number;
    sellPrice: number;
    currVolume: number;
    prevVolume: number;
    atr: Indicator;
    newPeriod: boolean;
    trade: TradeResponse;
    exchange: BinanceService;

    constructor(public strat: IExchangeService, advisor: AdvisorType) {
        super(strat, advisor);
        this.strategyName = 'Wick Catcher Strategy';
        this.exchange = strat.exchange;
    }

    loadIndicators() {
        this.atr = addIndicator('atr', { weight: 14, name: 'Average True Range' });
    }

    async realtimeAdvice(candle: Candle) {
        if (this.candle.open < this.sma50.result) {
            return; // quit
        }
        if (this.newPeriod) {
            this.prevVolume = 0;
            this.newPeriod = false;
        }

        const buyZone = candle.close < this.buyLimit;

        const priceIncrease = this.returnPercentageIncrease(candle.close, candle.open);
        if (+priceIncrease > 1)
            console.log(`${this.ticker.pair} Price Increase: ${priceIncrease.toFixed(2)}%`);

        // console.log('Volume Increase:' + this.returnPercentageIncrease(this.liveCandle.volume, this.prevVolume))
        // console.log('Price Action:' + this.returnPercentageIncrease(this.liveCandle.close, this.liveCandle.open))
        // console.log('Buy Limit: ' + this.buyLimit)
        // if (!trader.getorderPlaced && buyZone) {
        //   /// place a buy STOP_LOSS_LIMIT order
        //   // send message to say buy limit order triggered
        //   Settings.trader.orderPlaced = true;
        //   await this.placeOrder();
        //   this.telegram.sendMessage(`BUY ORDER Triggered on wick low for ${this.ticker.pair} `);
        // }
        this.prevVolume = candle.volume;
    }

    async placeOrder() {
        try {
            const balance = await this.strat.exchange.getTradingBalance();
            const quantity = (balance.currencyQuantity / this.buyLimit) * 0.999;
            const order = new LimitOrder(this.buyLimit, quantity / 2, 'buy');
            const stopType = 'STOP_LOSS_LIMIT'; // 'TAKE_PROFIT_LIMIT'
            // this.trade = await this.strat.exchange.placeStopLimitOrder('order', this.buyLimit * 0.998, stopType);
        } catch (error) {
            console.log(error.body);
        }
    }

    async advice() {
        this.newPeriod = true;
        this.buyLimit = this.candle.open - this.atr.result * 1.9;
        const volIncrease = this.returnPercentageIncrease(
            this.candle.volume,
            this.previousCandle.volume
        ).toFixed(2);
        const priceIncrease = this.returnPercentageIncrease(this.candle.close, this.candle.open);
        if (+volIncrease > 200) console.log(`${this.ticker.pair} Volume Increase: ${volIncrease}%`);
        if (+priceIncrease > 1) console.log(`${this.ticker.pair} Old Increase: ${priceIncrease}%`);

        // check order filled
        // if filled place stop - stopPrice = order filled price

        // if stopPrice and candle.close < stopPrice - sell()

        this.checkTradeStatus(() => {
            const res = this.sma50.result + this.atr.result / 2;
            return this.candle.close > res;
        });
    }

    logStatus(advice: any): void {
        const heikin = ` ${
            this.heikin['green'] ? `GREEN (${this.heikin.duration})` : `RED (${this.heikin.duration})`
        } `;
        let nextAction = 'looking to: ';
        let canTrade = `RSI: - . CCI:  - READY? ${this.canTrade ? 'OK' : 'NO'}`;
        nextAction += !this.tradeAdvisor.inTrade ? 'BUY' : 'SELL';
        let message = `${this.ticker.pair} PRICE: ${this.candle.price} ${heikin}. Advisor ${canTrade}. Profit: ${advice}`;
        this.consoleColour(message);
    }
    setHeikinColour(isGreen: boolean): string {
        return isGreen ? 'Green' : 'Red';
    }
}

function extractNearestHour(date: Date) {
    date.setMinutes(0, 0, 0);
    return date;
}
