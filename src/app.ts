import { Ticker } from './model/ticker';
import { ActionType, AdvisorType } from './model/enums';
import { Strategy } from './model/strategy';
import { ChatGroups, Settings } from '../keys';
import { BinanceService } from './services/binance-service';
import './utilities/extensions';
import { MongoDbConnection } from './db/database-connection';
import { GridSettings } from './model/grid-settings';
import { TelegramBot } from './model/telegram-bot';

const fs = require('fs');

const USEDATA = false;
Settings.backTest = true;

const advisorType: AdvisorType = AdvisorType.percentage;
const BTCPAIRS = false;
const STARTUPMESSAGE = false;
const trader = Settings.trader;

const interval = '4h';
const stratName = 'fib-regime';
const db = new MongoDbConnection();
const telegram = new TelegramBot(ChatGroups.mainAccount);

let tickerStrategies;
async function getExchangeFilters() {
  await db.connect(); // connect to database
  await trader.startService();
  if (!USEDATA) {
    if (STARTUPMESSAGE) {
      await telegram.sendMessage('Bot Started'); // send startup message
    }
    tickerStrategies = [
      // new Strategy(stratName, new BinanceService(API, new Ticker('SOL', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('BTC', 'USDT', ActionType.Short, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('ETH', 'USDT', ActionType.Short, '4h')), trader),
      new Strategy(
        stratName,
        new BinanceService(new Ticker('BTC', 'USDT', ActionType.Short, '4h')),
        trader
      ),
      // new Strategy(stratName, new BinanceService(API, new Ticker('ADA', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('CTSI', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('CKB', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('CAKE', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('SAND', 'USDT', ActionType.Short, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('DOT', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('MATIC', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('BNB', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('EGLD', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('LINK', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('ALGO', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('AVAX', 'USDT', ActionType.Short, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('ALPHA', 'USDT', ActionType.Long, '4h')), trader),
      // new Strategy(stratName, new BinanceService(API, new Ticker('RUNE', 'USDT', ActionType.Long, '4h')), trader),
    ];
  }
}

async function loadStrategy() {
  await getExchangeFilters();
  if (USEDATA) await readBinancePairs();
  await setup();
}

loadStrategy();

async function setup() {
  const tickers = tickerStrategies.length;
  for (let i = 0; i < tickers; i++) {
    const strategy: Strategy = tickerStrategies[i];
    await strategy.exchange.getExchangeInfo(); // assigns filters etc to Ticker
    const history = await strategy.exchange.getHistory(strategy.exchange.ticker);
    await strategy.strat.loadHistory(history); // backtesting takes place inside strat
    strategy.setAdvisor(advisorType);
    await strategy.advisor.doSetup(false);
  }
  getLatest(tickers);
}

function getLatest(tickers: any) {
  for (let i = 0; i < tickers; i++) {
    const strategy: Strategy = tickerStrategies[i];
    strategy.exchange.getOHLCLatest(strategy.exchange.ticker, (c) => {
      strategy.strat.update(c);
    });
  }
}

async function readBinancePairs() {
  tickerStrategies = [];
  return new Promise((resolve, reject) => {
    fs.readFile('binance.json', async (err, data) => {
      if (err) throw err;
      let binance: any[] = JSON.parse(data);
      tickerStrategies = binance
        .filter((strat) => strat.rank <= 1)
        .map((s) => {
          return new Strategy(
            stratName,
            new BinanceService(
              new Ticker(s.asset, BTCPAIRS ? 'BTC' : s.currency, ActionType.Long, interval)
            ),
            trader
          );
        });
      resolve(tickerStrategies);
    });
  });
}
