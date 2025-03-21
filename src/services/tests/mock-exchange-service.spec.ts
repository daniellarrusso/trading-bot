
import Binance from 'node-binance-api';
import { LimitOrder } from '../../model/limit-order';
import { Ticker } from '../../model/ticker';
import { MockExchangeService } from '../mock-exchange.service';


jest.mock('node-binance-api');

describe('MockExchangeService', () => {
    let mockExchangeService: MockExchangeService;
    let mockTicker: Ticker;

    beforeEach(() => {
        mockTicker = {
            pair: 'BTCUSDT',
            asset: 'BTC',
            currency: 'USDT',
            tickSize: '0.01',
            stepSize: '0.001',
            minQty: '0.001',
            candle: {
                closeTime: new Date(),
            },
        } as unknown as Ticker;

        mockExchangeService = new MockExchangeService(mockTicker);
    });

    it('should initialize with environment variables', () => {
        process.env.BINANCE_KEY = 'test-key';
        process.env.BINANCE_SECRET = 'test-secret';

        expect(() => new MockExchangeService(mockTicker)).not.toThrow();
    });

    // it('should throw an error if environment variables are missing', () => {
    //     delete process.env.BINANCE_KEY;
    //     delete process.env.BINANCE_SECRET;

    //     expect(() => new MockExchangeService(mockTicker)).toThrow(
    //         'Missing required environment variables'
    //     );
    // });

    it('should create a limit order', async () => {
        const order: LimitOrder = {
            side: 'BUY',
            quantity: 0.01,
            price: 50000,
            orderId: 0,
            triggered: false,
            complete: false,
            marketSide: ''
        };

        const trade = await mockExchangeService.createOrder(order);
        expect(trade).toBeDefined();
        expect(trade.side).toBe('BUY');
        expect(trade.quantity).toBe(0.01);
        expect(trade.price).toBe(50000);
    });

    // it('should get OHLC history', async () => {
    //     const history = await mockExchangeService.getOHLCHistory();
    //     expect(history).toBeDefined();
    //     expect(history.length).toBeGreaterThan(0);
    //     expect(history[0].open).toBe(50000);
    //     expect(history[0].close).toBe(50500);
    // });

    // it('should get exchange info', async () => {
    //     const ticker = await mockExchangeService.getExchangeInfo();
    //     expect(ticker).toBeDefined();
    //     expect(ticker.tickSize).toBe('0.01');
    //     expect(ticker.stepSize).toBe('0.001');
    // });

    // it('should get price', async () => {
    //     const price = await mockExchangeService.getPrice();
    //     expect(price).toBe('50500');
    // });

    // it('should get trading balance', async () => {
    //     const ticker = await mockExchangeService.getTradingBalance();
    //     expect(ticker).toBeDefined();
    //     expect(ticker.assetQuantity).toBe('1');
    //     expect(ticker.currencyQuantity).toBe('50000');
    // });

    // it('should cancel an order', async () => {
    //     const result = await mockExchangeService.cancelOrder('12345');
    //     expect(result.status).toBe('CANCELED');
    // });
});