import { NextFunction, Response, Request } from 'express';
import { Trade, TradeModel } from '../../db/trade';

async function getTrades(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await TradeModel.find().select('-transactions -__v');
    res.json(response).status(204);
  } catch (error) {
    next(error);
  }
}

async function postTrade(req: Request, res: Response, next: NextFunction) {
  const trade: Trade = { ...req.body };
  try {
    const doc = await new TradeModel(trade);
    await doc.save();
    res.status(200).send(doc);
  } catch (error) {
    res.status(400).send('Bad Request ' + error.message);
    next(error);
  }
}

async function deleteTrade(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id;
  console.log(id);
  try {
    await TradeModel.deleteOne({ _id: id });
    res.json(id);
  } catch (error) {
    console.log(error);
    next(error);
  }
}


export default { getTrades, postTrade, deleteTrade };