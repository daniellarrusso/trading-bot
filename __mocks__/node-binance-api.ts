// __mocks__/node-binance-api.ts
export default class Binance {
  options() {
    return this;
  }

  candlesticks(pair: string, interval: string, callback: Function, options: any) {
    const mockTicks = [
      [
        1638316800000, // time
        '50000', // open
        '51000', // high
        '49000', // low
        '50500', // close
        '1000', // volume
        1638316860000, // closeTime
        '500', // assetVolume
        10, // trades
        '500', // buyBaseVolume
        '500', // buyAssetVolume
        'ignored', // ignored
      ],
    ];
    callback(null, mockTicks);
  }

  prices(pair: string) {
    return { [pair]: '50500' };
  }

  exchangeInfo() {
    return {
      symbols: [
        {
          symbol: 'BTCUSDT',
          filters: [
            { filterType: 'PRICE_FILTER', tickSize: '0.01' },
            { filterType: 'LOT_SIZE', minQty: '0.001', stepSize: '0.001' },
          ],
        },
      ],
    };
  }

  balance() {
    return { BTC: { available: '1' }, USDT: { available: '50000' } };
  }

  orderStatus(pair: string, id: any) {
    return { status: 'FILLED' };
  }

  cancel(pair: string, orderId: any) {
    return { status: 'CANCELED' };
  }

  roundStep(quantity: string, stepSize: string) {
    return quantity;
  }

  websockets = {
    candlesticks: jest.fn(),
  };
}