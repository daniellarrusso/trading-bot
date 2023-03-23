import { Indicator, IndicatorSettings } from '../model/indicator';
import { RSI } from './rsi';
import { SMA } from './sma';
import { EMA } from './ema';
import { Stochastic } from './stochastic';
import { CCI } from './cci';
import { SniperCCI } from './sniper-cci';
import { Donchian } from './donchian';
import { ElliotWave } from './elliot-wave-oscillator';
import { AverageTrueRange } from './atr';
import { Countdown } from './countdown-pressure';

export type IndicatorName =
  | 'rsi'
  | 'ema'
  | 'sma'
  | 'cci'
  | 'sniper-cci'
  | 'donchian'
  | 'ewo'
  | 'atr'
  | 'countdown'
  | 'stochastic';

function addIndicator(name: IndicatorName, settings: IndicatorSettings): Indicator {
  switch (name) {
    case 'rsi':
      return new RSI(settings);
    case 'ema':
      return new EMA(settings);
    case 'countdown':
      return new Countdown(settings);
    case 'sma':
      return new SMA(settings);
    case 'stochastic':
      return new Stochastic(settings);
    case 'cci':
      return new CCI(settings);
    case 'sniper-cci':
      return new SniperCCI(settings);
    case 'donchian':
      return new Donchian(settings);
    case 'ewo':
      return new ElliotWave(settings);
    case 'atr':
      return new AverageTrueRange(settings);
    default:
      throw new Error('Indicator not found');
  }
}

export { addIndicator };
