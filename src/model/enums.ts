import { FifteenHourStrategy } from '../strategies/old/fifteen-hour';

export enum ActionType {
  Short,
  Long,
  NoAction,
}

export enum OrderType {
  buy = 'buy',
  sell = 'sell',
  marketSell = 'marketSell',
}

export enum SellReason {
  'StopLoss',
  'Profit',
  'Downside',
  'noop',
}

export enum AdvisorType {
  'paper',
  'live',
  'backtest',
  'portfolio',
  'percentage',
  'DCA',
}
