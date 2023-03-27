import { ActionType } from '../../model/enums';
import { Ticker } from '../../model/ticker';
import { NotifierStrategy } from '../../notifiers/notifier.strategy';
import { BinanceService } from '../../services/binance-service';
import { BaseStrategy } from '../base-strategy';

describe('baseStrat', () => {
  let strat: BaseStrategy;
  beforeEach(() => {
    strat = new NotifierStrategy(new BinanceService(new Ticker('BTC', 'USDT', ActionType.Long, '4h')));
  });
  describe('profitNotifier', () => {
    it('should notify telegram if profit less than minus 10', () => {
      let spy = jest
        .spyOn(strat.telegram, 'sendMessage')
        .mockImplementation(async () => await console.log('Message sent'));
      strat.profitNotifier();
      expect(spy).toHaveBeenCalled();
    });
  });
});
