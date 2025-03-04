import { NextFunction, Request, Response } from 'express';
import { TradeModel } from '../../db/trade';
import { TickerDbModel } from '../../db/ticker';


async function getAssets(req: Request, res: Response, next: NextFunction) {
  try {
    const trades = await TickerDbModel.find({ asset: req.params.asset });
    res.status(200).json(trades);
  } catch (error) {
    next(error);
  }
}

export default { getAssets };