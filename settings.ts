import { Trader } from './src/services/trader-service';

export const ChatGroups = {
    mainAccount: { id: 385615788, name: 'Main Bot' },
    botSignals: { id: -403537953, name: 'Bot Signals' },
};

const maxTickers = 4;

export const Settings = {
    debug: true,
    history: 1000,
    fee: 0.999,
    tickers: maxTickers,
    backTest: false,
    usdAmount: 20,
    trader: Trader.getInstance(),
};
