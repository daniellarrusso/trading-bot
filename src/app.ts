import { Ticker } from './model/ticker';
import { ActionType, AdvisorType } from './model/enums';
import './utilities/extensions';
import { Trader } from './services/trader-service';
import { Strat } from './model/interfaces/strat';
import { NotifierStrategy } from './notifiers/notifier.strategy';
import { BinanceService } from './services/binance-service';
import { TemplateStrategy } from './strategies/template-strategy';
import { MockExchangeService } from './services/mock-exchange.service';
import { LimitOrder } from './model/limit-order';

const trader = Trader.getInstance();
const testStrat = new TemplateStrategy(
  new MockExchangeService(new Ticker('BTC', 'USDT', ActionType.Long, '1m'))
);
const advisorType: AdvisorType = AdvisorType.paper;

const test = new MockExchangeService(new Ticker('BTC', 'USDT', ActionType.Long, '1m'));

async function loadStrategy() {
  await trader.startService();

  trader.addStrategy([
    testStrat,
    new NotifierStrategy(new BinanceService(new Ticker('BTC', 'USDT', ActionType.Long, '4h'))),
  ]);

  await setup();
}

async function setup() {
  const tickers = trader.strategies.length;
  for (let i = 0; i < tickers; i++) {
    const strategy: Strat = trader.strategies[i];
    await strategy.exchange.getExchangeInfo(); // assigns filters etc to Ticker
    const history = await strategy.exchange.getHistory(strategy.exchange.ticker);
    await strategy.loadHistory(history); // backtesting takes place inside strat
    await strategy.setAdvisor(advisorType, 'placeLimitOrder');
  }
  getLatest(tickers);
}

function getLatest(tickers: any) {
  for (let i = 0; i < tickers; i++) {
    const strategy: Strat = trader.strategies[i];
    strategy.exchange.getOHLCLatest(strategy.exchange.ticker, async (c) => {
      await strategy.update(c);
    });
  }
}

loadStrategy();

// async function readBinancePairs() {
//   let tickerStrategies = [];
//   return new Promise((resolve, reject) => {
//     fs.readFile('binance.json', async (err, data) => {
//       if (err) throw err;
//       let binance: any[] = JSON.parse(data);
//       tickerStrategies = binance
//         .filter((strat) => strat.rank <= 1)
//         .map((s) => {
//           return new Strategy(
//             stratName,
//             new BinanceService(new Ticker(s.asset, BTCPAIRS ? 'BTC' : s.currency, ActionType.Long, interval))
//           );
//         });
//       resolve(tickerStrategies);
//     });
//   });
// }
