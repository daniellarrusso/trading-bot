const Gecko = require('coingecko-api');

export class CoinGecko {
    gecko: any;
    constructor() {
        this.gecko = new Gecko();
    }
    async getMarkets(params = {}) {
        return this.gecko.coins.markets(params);
    }
    getTickers(coinId, params = {}) {
        return this.gecko.coins.fetchTickers(coinId, params);
    }

}
