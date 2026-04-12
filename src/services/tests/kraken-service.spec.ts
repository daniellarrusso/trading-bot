import { krakenPublic, krakenPrivate } from '../kraken-client';
import { KrakenService } from '../kraken-service';
import { ActionType } from '../../model/enums';
import { LimitOrder } from '../../model/limit-order';
import { Ticker } from '../../model/ticker';
import { Candle } from '../../model/candle';
import { Trade } from '../../db/trade';

jest.mock('../kraken-client');

const mockKrakenPublic = krakenPublic as jest.Mock;
const mockKrakenPrivate = krakenPrivate as jest.Mock;

const KRAKEN_PAIR = 'BTC/GBP';

// Two-element OHLC response — getHistory pops the last (incomplete) candle
const mockOhlcResponse = () => ({
    result: {
        last: 12345,
        [KRAKEN_PAIR]: [
            [1620000000, '50000', '51000', '49000', '50500', '50250', '1.5', 100],
            [1620003600, '50500', '52000', '50000', '51000', '51000', '2.0', 80],
        ],
    },
});

describe('KrakenService', () => {
    let service: KrakenService;
    let ticker: Ticker;

    beforeEach(() => {
        process.env.KRAKEN_KEY = 'test-key';
        process.env.KRAKEN_SECRET = 'test-secret';
        ticker = new Ticker('BTC', 'GBP', ActionType.Long, '1h');
        ticker.pairDecimals = 1;
        ticker.lotDecimals = 8;
        service = new KrakenService(ticker);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should_throw_when_api_credentials_are_missing', () => {
            delete process.env.KRAKEN_KEY;
            expect(() => new KrakenService(ticker)).toThrow(
                'Missing required environment variables'
            );
        });
    });

    describe('getHistory', () => {
        it('should_return_mapped_candles_excluding_last_incomplete_candle', async () => {
            mockKrakenPublic.mockResolvedValue(mockOhlcResponse());
            const result = await service.getHistory(ticker);
            // Two candles in mock; pop() removes the last (incomplete) one
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                open: 50000,
                high: 51000,
                low: 49000,
                close: 50500,
                green: true,
                isFinal: true,
            });
        });

        it('should_return_empty_array_when_api_call_fails', async () => {
            mockKrakenPublic.mockRejectedValue(new Error('Network error'));
            const result = await service.getHistory(ticker);
            expect(result).toEqual([]);
        });
    });

    describe('getOHLCHistoryByPair', () => {
        it('should_return_mapped_candles_excluding_last_incomplete_candle', async () => {
            mockKrakenPublic.mockResolvedValue(mockOhlcResponse());
            const result = await service.getOHLCHistoryByPair(KRAKEN_PAIR, ticker.intervalObj);
            expect(result).toHaveLength(1);
            expect(result[0].close).toBe(50500);
        });

        it('should_return_empty_array_when_api_call_fails', async () => {
            mockKrakenPublic.mockRejectedValue(new Error('Network error'));
            const result = await service.getOHLCHistoryByPair(KRAKEN_PAIR, ticker.intervalObj);
            expect(result).toEqual([]);
        });
    });

    describe('createOrder', () => {
        beforeEach(() => {
            ticker.candle = { closeTime: new Date('2024-01-01') } as Candle;
        });

        it('should_return_trade_with_txid_when_order_placed_successfully', async () => {
            mockKrakenPrivate.mockResolvedValue({
                result: {
                    descr: { order: 'buy 0.01 BTC/GBP @ limit 50000', close: '' },
                    txid: ['OQCLML-BW3P3-BUCMWW'],
                },
            });
            const trade = await service.createOrder(new LimitOrder(50000, 0.01, 'buy'));
            expect(trade.orderId).toBe('OQCLML-BW3P3-BUCMWW');
            expect(trade.price).toBe(50000);
            expect(trade.side).toBe('buy');
            expect(trade.status).toBe('NEW');
        });
    });

    describe('cancelOrder', () => {
        it('should_call_cancel_order_endpoint_with_correct_txid', async () => {
            mockKrakenPrivate.mockResolvedValue({ result: { count: 1 } });
            const result = await service.cancelOrder('OQCLML-BW3P3-BUCMWW');
            expect(mockKrakenPrivate).toHaveBeenCalledWith(
                'CancelOrder',
                'test-key',
                'test-secret',
                { txid: 'OQCLML-BW3P3-BUCMWW' }
            );
            expect(result).toEqual({ count: 1 });
        });
    });

    describe('getTradingBalance', () => {
        it('should_update_ticker_asset_and_currency_quantities_from_balance_response', async () => {
            // BTC/GBP: asset=BTC -> XXBT, currency=GBP -> ZGBP
            mockKrakenPrivate.mockResolvedValue({
                result: { XXBT: '0.5', ZGBP: '1000' },
            });
            const result = await service.getTradingBalance();
            expect(result.assetQuantity).toBe(0.5);
            expect(result.currencyQuantity).toBe(1000);
        });

        it('should_return_empty_ticker_when_balance_fetch_fails', async () => {
            mockKrakenPrivate.mockRejectedValue(new Error('API error'));
            const result = await service.getTradingBalance();
            expect(result).toEqual({});
        });
    });

    describe('getExchangeInfo', () => {
        it('should_set_pair_and_lot_decimals_from_asset_pairs_response', async () => {
            mockKrakenPublic.mockResolvedValue({
                result: {
                    [KRAKEN_PAIR]: { pair_decimals: 1, lot_decimals: 8 },
                },
            });
            mockKrakenPrivate.mockResolvedValue({
                result: { XXBT: '0.5', ZGBP: '1000' },
            });
            await service.getExchangeInfo();
            expect(ticker.pairDecimals).toBe(1);
            expect(ticker.lotDecimals).toBe(8);
        });

        it('should_throw_when_asset_pairs_request_fails', async () => {
            mockKrakenPublic.mockRejectedValue(new Error('API error'));
            await expect(service.getExchangeInfo()).rejects.toThrow('something went wrong');
        });
    });

    describe('updateOrder', () => {
        it('should_return_true_when_order_status_is_closed', async () => {
            mockKrakenPrivate.mockResolvedValue({
                result: {
                    closed: { 'OQCLML-BW3P3-BUCMWW': { status: 'closed' } },
                },
            });
            const result = await service.updateOrder({ orderId: 'OQCLML-BW3P3-BUCMWW' } as Trade);
            expect(result).toBe(true);
        });

        it('should_return_false_when_order_is_not_in_closed_orders', async () => {
            mockKrakenPrivate.mockResolvedValue({ result: { closed: {} } });
            const result = await service.updateOrder({ orderId: 'UNKNOWN-ORDER' } as Trade);
            expect(result).toBe(false);
        });
    });
});
