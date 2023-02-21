import { Schema, model } from 'mongoose';
import { ActionType } from '../model/enums';
import { Trade } from '../model/interfaces/mongoTrade';
import { Ticker } from '../model/ticker';

const schema = new Schema<Trade>({
  ticker: { type: String },
  nextAction: { type: String },
  inTrade: { type: Boolean },
  lastBuy: { type: Number },
  transactions: [{ action: String, amount: Number }],
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
    const inTrade = stratAction === ActionType.Long ? false : true;
    return inTrade;
  }

  async createNewPosition(lastBuy: number, action: ActionType) {
    const result = await this.findTicker();
    const inTrade = this.convertAction(action);
    if (!result) {
      const doc = new TradeModel({
        ticker: this.ticker.pair,
        nextAction: ActionType[action],
        inTrade: inTrade,
        lastBuy: lastBuy,
      });
      await doc.save();
      console.log(`${doc.ticker} added to MongoDb Trades`);
    } else {
      console.log(
        `MongoDb Trades Result: ${result.ticker} - Next Action: ${result.nextAction}. Last Buy: ${result.lastBuy}`
      );
    }
  }

  async trade(): Promise<void> {
    const resToUpdate = await TradeModel.findOne({ ticker: this.ticker.pair });
    const inTrade = this.convertAction(this.ticker.action);
    resToUpdate.nextAction = ActionType[this.ticker.action];
    resToUpdate.inTrade = inTrade;
    resToUpdate.lastBuy = inTrade ? this.ticker.candle.close : 0;
    const prevAction = this.ticker.action === ActionType.Long ? ActionType.Short : ActionType.Long;
    resToUpdate.transactions.push({ action: ActionType[prevAction], amount: this.ticker.candle.close });
    await resToUpdate.save();
  }
}
