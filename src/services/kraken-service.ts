import KrakenClient from 'kraken-api-na';
import { apiKeys } from '../../keys';
export class KrakenService {
    kraken: any;
    constructor() {
        this.kraken = new KrakenClient(apiKeys.krakenAccount.key, apiKeys.krakenAccount.secret);
    }

    async getTickerSettings(pair?: string) {
        const res = await this.kraken.api('AssetPairs', { info: {}, pair: pair });
        const result = res.result[pair];
        return result;
    }

    async getPrice(ticker: string) {
        const price = await this.kraken.api('Ticker', { pair: ticker });
        return price.result;
    }

    async getTradeBalance(baseCurrency: string) {
        const bal = await this.kraken.api('Balance', { asset: baseCurrency });
        return bal.result[baseCurrency];
    }

    async addOrder(limitOrder: any) {
        const res = await this.kraken.api('AddOrder', limitOrder);
        return res.result;
    }
    async getAssetPairs(pair?: string) {
        const res = await this.kraken.api('AssetPairs', pair);
        return res.result;
    }
}
