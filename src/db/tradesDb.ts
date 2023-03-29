import { Schema, model } from 'mongoose';
import { ActionType } from '../model/enums';
import { Trade } from '../model/interfaces/mongoTrade';
import { Ticker } from '../model/ticker';
import { TradeResponse } from '../model/trade-response';

const schema = new Schema<Trade>({
  ticker: { type: String },
  action: { type: String },
  inTrade: { type: Boolean },
  lastBuy: { type: Number },
  transactions: [],
});

const TradeModel = model<Trade>('Trade', schema);

export class TradesDb {
  constructor(public ticker: Ticker) {}

  async findTicker(): Promise<Trade> {
    const result = await TradeModel.findOne({ ticker: this.ticker.pair });
    return result;
  }

  async checkIfAlreadyExists() {
    const result = await this.findTicker();
    if (result) {
      return result.inTrade ? ActionType.Short : ActionType.Long;
    }
  }

  convertAction(stratAction: ActionType) {
    const inTrade = stratAction === ActionType.Long ? true : false;
    return inTrade;
  }

  async createNewPosition(lastTrade: TradeResponse) {
    const result = await this.findTicker();
    const inTrade = this.convertAction(this.ticker.action);
    if (!result) {
      const doc = new TradeModel({
        ticker: this.ticker.pair,
        action: ActionType[this.ticker.action],
        inTrade: inTrade,
        lastBuy: inTrade ? lastTrade.quotePrice : 0,
        transactions: [lastTrade],
      });
      await doc.save();
      console.log(`${doc.ticker} added to MongoDb Trades`);
    } else {
      console.log(
        `MongoDb Trades Result: ${result.ticker} - Current Action: ${result.action}. Last Buy: ${result.lastBuy}`
      );
    }
  }

  async trade(lastTrade: TradeResponse): Promise<void> {
    const resToUpdate = await TradeModel.findOne({ ticker: this.ticker.pair });
    if (resToUpdate) {
      const inTrade = this.convertAction(this.ticker.action);
      resToUpdate.action = ActionType[this.ticker.action];
      resToUpdate.inTrade = inTrade;
      resToUpdate.lastBuy = inTrade ? +lastTrade.quotePrice : 0;
      resToUpdate.transactions.push(lastTrade);
      await resToUpdate.save();
    } else {
      await this.createNewPosition(lastTrade);
    }
  }
}
