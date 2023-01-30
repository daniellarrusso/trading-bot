import { Candle } from '../candle';
import { CandleStatistics } from '../candle-statistics';
describe('candleStatistics', () => {
    let stats: CandleStatistics;
    const candles: Candle[] = [
        { close: 9, low: 0, high: 38, time: new Date() } as Candle,
        { close: 1, low: 1, high: 2, time: new Date() } as Candle,
        { close: 2, low: 1, high: 3, time: new Date() } as Candle,
        { close: 3, low: 2, high: 4, time: new Date() } as Candle,
        { close: 4, low: 3, high: 5, time: new Date() } as Candle,
        { close: 5, low: 4, high: 6, time: new Date() } as Candle,
    ]
    beforeEach(() => {
        stats = new CandleStatistics('4h');
        candles.map(c => stats.calculateStatistics(c))
    })
    it('should return the average close', () => {
        // act
        const result = stats.getAverageForPeriod(5, 'close');
        // assert
        expect(result).toEqual(3);
    })
    it('should return 0 if lookbackPeriod is greater than candleHistory size', () => {
        // act
        const result = stats.getAverageForPeriod(stats.olhcHistorySize + 1, 'close');
        // assert
        expect(result).toEqual(0);
    })
    it('should return a the highest/lowest for given period', () => {
        // act
        const high = stats.getHighLowForPeriod(5, true);
        const low = stats.getHighLowForPeriod(5, false);
        // assert
        expect(high).toEqual(6);
        expect(low).toEqual(1);
    })
})