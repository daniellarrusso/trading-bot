import { Ticker } from './model/ticker';
import { ActionType, AdvisorType } from './model/enums';
import { Strategy } from './model/strategy';
import { BinanceService } from './services/binance-service';
import { MongoDbConnection } from './db/database-connection';
import './utilities/extensions';
import { Settings } from '../settings';
import { IExchangeService } from './services/IExchange-service';

const fs = require('fs');

Settings.backTest = true;
const advisorType: AdvisorType = AdvisorType.paper;
const BTCPAIRS = false;
const trader = Settings.trader;

const interval = '4h';
const stratName = 'notifier';
const db = new MongoDbConnection();

export interface StrategySettings {
  name: string;
  exchange: IExchangeService;
  ticker: Ticker;
}

export type Exchange = 'binance' | 'kraken' | 'kucoin';

async function getExchangeFilters() {
  await db.connect(); // connect to database
  await trader.startService();

  trader.addStrategy(stratName, 'binance', new Ticker('BTC', 'USDT', ActionType.Long, '4h'));
}

async function loadStrategy() {
  await getExchangeFilters();
  await setup();
}

loadStrategy();

async function setup() {
  const tickers = trader.strategies.length;
  for (let i = 0; i < tickers; i++) {
    const strategy: Strategy = trader.strategies[i];
    await strategy.exchange.getExchangeInfo(); // assigns filters etc to Ticker
    const history = await strategy.exchange.getHistory(strategy.exchange.ticker);
    await strategy.strat.loadHistory(history); // backtesting takes place inside strat
    strategy.setAdvisor(advisorType);
    await strategy.advisor.doSetup(false, 'placeLimitOrder');
  }
  getLatest(tickers);
}

function getLatest(tickers: any) {
  for (let i = 0; i < tickers; i++) {
    const strategy: Strategy = trader.strategies[i];
    strategy.exchange.getOHLCLatest(strategy.exchange.ticker, async (c) => {
      await strategy.strat.update(c);
    });
  }
}

async function readBinancePairs() {
  let tickerStrategies = [];
  return new Promise((resolve, reject) => {
    fs.readFile('binance.json', async (err, data) => {
      if (err) throw err;
      let binance: any[] = JSON.parse(data);
      tickerStrategies = binance
        .filter((strat) => strat.rank <= 1)
        .map((s) => {
          return new Strategy(
            stratName,
            new BinanceService(new Ticker(s.asset, BTCPAIRS ? 'BTC' : s.currency, ActionType.Long, interval))
          );
        });
      resolve(tickerStrategies);
    });
  });
}
