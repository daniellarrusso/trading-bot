export class MockOrders {
  marketBuy(pair: string, quantity: string, price: string) {
    return new Promise((resolve, reject) => {
      resolve(mockMarket(pair, quantity, price, 'BUY'));
    });
  }

  marketSell(pair: string, quantity: string, price: string) {
    return new Promise((resolve, reject) => {
      resolve(mockMarket(pair, quantity, price, 'SELL'));
    });
  }

  buy(pair: string, quantity: string, price: string) {
    return new Promise((resolve, reject) => {
      resolve(mockLimit(pair, quantity, price, 'BUY'));
    });
  }

  sell(pair: string, quantity: string, price: string) {
    return new Promise((resolve, reject) => {
      resolve(mockLimit(pair, quantity, price, 'SELL'));
    });
  }
}

const mockLimit = (pair: string, quantity: string, price: string, side: string) => {
  return {
    symbol: pair,
    orderId: 123456789,
    orderListId: -1,
    clientOrderId: 'your-client-order-id',
    transactTime: 1617118211991, // candle input
    price: price,
    origQty: quantity,
    executedQty: quantity,
    cummulativeQuoteQty: '0.00000000',
    status: 'NEW',
    timeInForce: 'GTC',
    type: 'LIMIT',
    side: side,
    fills: [],
  };
};

const mockMarket = (pair: string, quantity: string, price: string, side: string) => {
  return {
    symbol: pair,
    orderId: 123456789,
    orderListId: -1,
    clientOrderId: 'your-client-order-id',
    transactTime: 1617118211991, // candle input
    price: '0.00000000',
    origQty: quantity,
    executedQty: quantity,
    cummulativeQuoteQty: +quantity * +price,
    status: 'FILLED',
    timeInForce: 'GTC',
    type: 'MARKET',
    side: side,
    fills: [
      {
        price: '50000.00000000',
        qty: '1.00000000',
        commission: '0.00500000',
        commissionAsset: 'USDT',
        tradeId: 123456789,
      },
    ],
  };
};
