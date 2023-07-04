import { Router, Response, Request } from 'express';
import { TradeModel } from '../../db/trade';
import { Trade } from '../../model/interfaces/mongoTrade';

const route = Router();

route.get('/', async (req: Request, res: Response) => {
    try {
        const response = await TradeModel.find().select('-transactions -__v');
        res.json(response).status(204);
    } catch (error) {
        console.log(error);
    }
});

route.get('/:ticker', async (req: Request, res: Response) => {
    try {
        const ticker = req.params.ticker;
        const response = await TradeModel.findOne({ ticker: ticker });
        res.json(response ? true : false);
    } catch (error) {
        console.log(error);
    }
});

route.post('/', async (req: Request, res: Response) => {
    const trade: Trade = { ...req.body };
    try {
        const doc = await new TradeModel(trade);
        await doc.save();
        res.status(200).send(doc);
    } catch (error) {
        res.status(400).send('Bad Request ' + error.message);
    }
});

route.delete('/:id', async (req: Request, res: Response) => {
    const id = req.params.id;
    console.log(id);
    try {
        await TradeModel.deleteOne({ _id: id });
        res.json(id);
    } catch (error) {
        console.log(error);
    }
});

export default route;
