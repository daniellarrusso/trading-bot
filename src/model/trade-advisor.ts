import { ActionType } from './enums';
import { Candle } from './candle';
import { Trader } from '../services/trader-service';
import { Advisor } from './advisor';
import { BacktestAdvisor } from './backtest-advisor';
import { Ticker } from './ticker';
import { TradeResponse } from './trade-response';
import { Side } from './literals';
import { Trades } from './trades';
import { returnPercentageIncrease } from '../utilities/utility';
import { MockExchangeService } from '../services/mock-exchange.service';
import { Trade } from '../db/trades';

export class TradeAdvisor {
    advisor: Advisor;
    candle: Candle;
    trader = Trader.getInstance();
    startingPrice: number;
    roundtripProfit: number;
    initialAction: ActionType;
    lastTradeId: number = -1;
    currentTick: number;

    private ticker: Ticker;

    get longPrice() {
        return this.advisor.trades.lastBuy?.price ?? 0;
    }

    get shortPrice() {
        return this.advisor.trades.lastSell?.price ?? 0;
    }
    get isBacktest() {
        return this.advisor instanceof BacktestAdvisor;
    }
    get lastBuy() {
        return this.advisor.trades.lastBuy;
    }

    constructor(ticker: Ticker) {
        this.ticker = ticker;
        this.initialAction = this.ticker.action;
        this.advisor = new BacktestAdvisor(new MockExchangeService(ticker));
    }

    get inTrade() {
        return this.ticker.action === ActionType.Short ? true : false;
    }

    get profit() {
        if (!this.longPrice) return 0;
        return returnPercentageIncrease(this.candle.close, this.longPrice);
    }

    async trade(price?: number, side?: Side) {
        if (this.processingTick) return;
        this.currentTick = this.ticker.ticks;
        if (!this.startingPrice && this.inTrade) this.startingPrice = this.candle.close;
        const res = await this.advisor.trade(price, side);
        await this.advisor.logBalance();
        this.setTraderAction(this.addAdvisorType(res));
    }

    private addAdvisorType(res: Trade) {
        return { ...res, advisorType: this.advisor.type };
    }

    /** Bolle  */
    get processingTick() {
        return this.currentTick === this.ticker.ticks;
    }

    getTotalProfit() {
        return this.advisor.profitResults.reduce((p, c) => p + c, 0);
    }

    calculateProfit() {
        if (!this.longPrice) return; // no profit to calculate
        this.roundtripProfit = ((this.shortPrice - this.longPrice) / this.longPrice) * 100;
        console.log(
            `'** ROUNDTRIP COMPLETE ** Profit: ${this.roundtripProfit.toFixed(2)} (${this.ticker.pair})`
        );
        this.advisor.addProfitResults(this.shortPrice, this.lastBuy);
    }

    setTraderAction(trade: Trade) {
        this.logMessage(trade);
        this.trader.updateTicker(this.ticker);
        this.ticker.isLong && this.calculateProfit();
        this.ticker.setActionType();
    }

    logMessage(trade: Trade) {
        const { action, asset, currency, candle, tickSize, isMarketOrders: market } = this.ticker;
        const quantity = trade.quantity;
        const orderType = market ? 'Market' : 'Limit';
        const currencyAmount = this.ticker.normalisePrice(+trade.cost) ?? this.ticker.currencyAmount;
        let message = `${candle.printTime}: ${currencyAmount} ${currency} ${orderType} ${
            ActionType[action]
        } for ${quantity} ${asset}. Entry Price: ${Number(candle.price).normalise(tickSize)}`;

        console.log(message);
        this.advisor.notifyTelegramBot(message);
    }

    async endAdvisor(closingPrice) {
        const prices = {
            closingPrice,
            startingPrice: this.startingPrice,
            lastBuyPrice: this.longPrice,
        };
        this.advisor.end(prices);
        this.ticker.setActionType(this.initialAction);
        this.trader.resetTrader();
    }
}
