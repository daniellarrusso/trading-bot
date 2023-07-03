import { Ticker } from './model/ticker';
import { ActionType, AdvisorType } from './model/enums';
import './utilities/extensions';
import { Trader } from './services/trader-service';
import { Strat } from './model/interfaces/strat';
import { BinanceService } from './services/binance-service';
import { TemplateStrategy } from './strategies/template-strategy';
import connectApi from './api';
import { KrakenService } from './services/kraken-service';
import { HeikinLongStrategy } from './strategies/swing/heikin-long';
import { SimpleMAStrategy } from './strategies/swing/simple-ma.strategy';

const trader = Trader.getInstance();
const advisor: AdvisorType = AdvisorType.live;
const testStrat = new TemplateStrategy(
    new BinanceService(new Ticker('BTC', 'USDT', ActionType.Long, '1m')),
    AdvisorType.paper
);

async function loadStrategy() {
    trader.addStrategy([
        // testStrat,
        new SimpleMAStrategy(
            new KrakenService(new Ticker('ETH', 'GBP', ActionType.Long, '4h', 500)),
            advisor
        ),
        new SimpleMAStrategy(
            new KrakenService(new Ticker('BTC', 'GBP', ActionType.Long, '4h', 500)),
            advisor
        ),
    ]);

    await setup();
}

async function setup() {
    const tickers = trader.strategies.length;
    for (let i = 0; i < tickers; i++) {
        const strategy: Strat = trader.strategies[i];
        const history = await strategy.exchange.getHistory(strategy.exchange.ticker);
        await strategy.loadHistory(history); // backtesting takes place inside strat
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

connectApi();

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
