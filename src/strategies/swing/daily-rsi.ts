import { addIndicator } from '../../indicators/base-indicator';
import { Candle } from '../../model/candle';
import { ActionType } from '../../model/enums';
import { Indicator } from '../../model/indicator';
import { AlternateTimeframe } from '../../model/alternate-timeframe';
import { Interval } from '../../model/interval-converter';
import { Strategy } from '../../model/strategy';
import { BaseStrategy } from '../base-strategy';
import { IExchangeService } from '../../services/IExchange-service';

export class DailyRSIStrategy extends BaseStrategy {
  // Custom Indicators
  cci: Indicator;
  volumeMa: Indicator;
  high: number;
  low: number;
  dayTf: AlternateTimeframe;
  hourTf: AlternateTimeframe;

  rsi: Indicator;
  constructor(public strat: IExchangeService) {
    super(strat);
    this.strategyName = 'Daily RSI';
    this.hasDailyCandles = true;
  }

  loadIndicators() {
    // Indicators
    this.cci = addIndicator('sniper-cci', { weight: 14, input: 'close', inputType: 'heikin' });
    this.volumeMa = addIndicator('sma', { weight: 20, input: 'volume', inputType: 'candle' });
    this.dayTf = this.createAlternateTimeframe(new Interval('1d'), (tf) => {
      this.rsi = tf.createIndicator('rsi', { weight: 14, maWeight: 14 });
    });
    this.hourTf = this.createAlternateTimeframe(new Interval('1w'), (tf) => {
      return true;
    });
  }

  async realtimeAdvice(candle: Candle) {}

  async advice() {
    // Can Trade after certain criteria met (sometimes you don't want to trade straight away)
    this.checkTradeStatus(() => {
      return this.ema20.result < this.sma50.result;
    });

    /// Alternate Timeframe(s)
    await this.dayTf.process(this.candle, this.backtestMode);
    await this.hourTf.process(this.candle, this.backtestMode);

    const { candles } = this.dayTf;
    if (candles) {
      const last3Index = candles.length - 4;
      this.high = candles
        .filter((c, i) => i > last3Index)
        .map((c) => c.high)
        .reduce((p, c) => (p > c ? p : c), 0);
      this.low = candles
        .filter((c, i) => i > last3Index)
        .map((c) => c.low)
        .reduce((p, c) => (p > c ? p : c), 0);
    }

    /// Go Long
    if (this.tradeAdvisor.actionType === ActionType.Long && !this.delayOn && this.canTrade) {
      if (
        this.candle.close > this.high &&
        this.rsi.movingAverage > 50 &&
        this.ema20.result > this.sma50.result
      ) {
        this.tradeAdvisor.trade();
      }
    }

    // Go Short
    if (this.tradeAdvisor.actionType === ActionType.Short) {
      if (this.candle.close < this.low && this.ema20.result < this.sma50.result) {
        this.tradeAdvisor.trade();
      }
    }
  }

  logStatus(advice: any): void {
    let canTrade = `CanTrade? ${this.canTrade ? 'YES' : 'NO'}`;
    let message = `${this.ticker.pair} PRICE: ${this.candle.price}. Advisor ${canTrade}. Profit: ${advice}`;
    this.consoleColour(message);
  }
}
