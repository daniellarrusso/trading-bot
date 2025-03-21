import { Settings } from '../settings';
import { ActionType } from './model/enums';
import { LimitOrder } from './model/limit-order';
import { Ticker } from './model/ticker';
import { BinanceService } from './services/binance-service';
import { Trader } from './services/trader-service';

const SELLHALF = 1;

export const assets = [
    { ticker: 'CKB', percentage: SELLHALF },
    { ticker: 'SAND', percentage: SELLHALF },
    { ticker: 'ETHW', percentage: SELLHALF },
    { ticker: 'BTS', percentage: SELLHALF },
    { ticker: 'ALPHA', percentage: SELLHALF },
    // { ticker: 'CAKE', percentage: 50 },

    // { ticker: 'KCS', percentage: 2 },
    // { ticker: 'POLK', percentage: 2 },
];

const base = 'USDT';

async function sellToBase(ticker: Ticker) {
    const service = new BinanceService(ticker);
    await service.getExchangeInfo();
    const asset = assets.find((a) => a.ticker + base === ticker.pair);
    try {
        const balance = await service.getTradingBalance();
        const price = await service.getPrice();
        const quantity = balance.assetQuantity * asset.percentage;
        const order = new LimitOrder(price, quantity, 'sell');
        // const order = new MarketOrder(price, false, quantity)
        // const response = await service.marketOrderSpoof(order)
        const response = await service.createOrder(order);
        console.log(response);
    } catch (error) {
        console.log(error.body);
    }
}

async function createOrder() {
    for (let i = 0; i < assets.length; i++) {
        const ticker = new Ticker(assets[i].ticker, base, ActionType.Short, '1m');
        try {
            await sellToBase(ticker);
        } catch (error) {
            console.log(error);
        }
    }
}

createOrder();
