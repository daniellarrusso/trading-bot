import { Ticker } from './model/ticker';
import { ActionType, AdvisorType } from './model/enums';
import './utilities/extensions';
import { Trader } from './services/trader-service';
import { Strat } from './model/interfaces/strat';
import connectApi from './api';
import { KrakenService } from './services/kraken-service';
import { MovingAverageStrategy, DailySpikeStrategy, TemplateStrategy } from './strategies';
import { BinanceService } from './services/binance-service';

const trader = Trader.getInstance();
const advisor: AdvisorType = AdvisorType.live;
const testStrat = new MovingAverageStrategy(
    new BinanceService(new Ticker('BTC', 'USDT', ActionType.Short, '1m')),
    AdvisorType.paper
);

async function loadStrategy() {
    trader.addStrategy([
        testStrat,
        // new DailySpikeStrategy(
        //     new KrakenService(new Ticker('BTC', 'GBP', ActionType.Long, '1m', 10)),
        //     AdvisorType.order
        // ),
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
