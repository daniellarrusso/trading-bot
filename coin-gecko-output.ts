import { CoinGecko } from "./src/services/coin-gecko";
const fs = require("fs");
const gecko = new CoinGecko();
const excludes = ["PAX", "USDC", "BUSD", "TUSD", "SUSD"];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function someFunction(id, exchangeId) {
  await delay(1000);
  const { data } = await gecko.getTickers(id, exchangeId);
  return data.tickers;
}

async function writeBinancePairs() {
  const { data: markets } = await gecko.getMarkets({
    per_page: 200,
    order: "volume_desc",
  });
  const strats = [];
  let ranker = 1;
  for (let i = 0; i < markets.length; i++) {
    const res = await someFunction(markets[i].id, { exchange_ids: "binance" });

    const btcPair = res.find(
      (e) => e.target === "USDT" && !excludes.some((b) => b === e.base)
    );
    if (btcPair) {
      strats.push({
        rank: ranker++,
        asset: btcPair.base,
        currency: btcPair.target,
      });
    }
  }
  let data = JSON.stringify(strats);
  fs.writeFileSync("binance.json", data);
}

async function writeEthPairs() {
  const { data: markets } = await gecko.getMarkets({
    per_page: 20,
    order: "volume_desc",
  });
  const strats = [];
  let ranker = 1;
  for (let i = 0; i < markets.length; i++) {
    const res = await someFunction(markets[i].id, { exchange_ids: "binance" });
    const btcPair = res.find(
      (e) => e.target === "ETH" && !excludes.some((b) => b === e.base)
    );
    if (btcPair) {
      console.log("Writing: " + btcPair.base, btcPair.target);
      strats.push({
        rank: ranker++,
        asset: btcPair.base,
        currency: btcPair.target,
      });
    }
  }
  let data = JSON.stringify(strats);
  fs.writeFileSync("binance-eth.json", data);
}

writeBinancePairs();
