import { ActionType } from '../../model/enums';
import { LimitOrder } from '../../model/limit-order';
import { Ticker } from '../../model/ticker';
import { IExchangeService } from '../IExchange-service';
import { MockExchangeService } from '../mock-exchange.service';

describe('Mock Exchange', () => {
  let exchange: IExchangeService;
  beforeAll(() => {
    exchange = new MockExchangeService(new Ticker('BTC', 'USDT', ActionType.Long, '1m'));
  });
  describe('createOrder', () => {
    it('should return a mocked JSON response mapped to a concrete TradeResponse class', async () => {
      const res = await exchange.createOrder(new LimitOrder(100, 1, 'buy'), 'Mock');
      expect(res.quotePrice).toBe('100');
      // expect(marketRes.quotePrice).toBe('50000.00000000');
    });
    it('should return a Market Order mocked JSON response mapped to a concrete TradeResponse class', async () => {
      const res = await exchange.createOrder(new LimitOrder(100, 1, 'buy'), 'Mock', true);
      expect(res.quotePrice).toBe('50000.00000000');
    });
  });
});
