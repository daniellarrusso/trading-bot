import { Router } from 'express';
import tradeController from '../controllers/trades';
import assetController from '../controllers/assets';

const router = Router();

router.route('/trades')
    .get(tradeController.getTrades)
    .post(tradeController.postTrade);

router.route('/trades/:id')
    .delete(tradeController.deleteTrade);

router.route('/assets')
    .get(assetController.getAssets);

export default router;

// route.get('/search', async (req: Request, res: Response) => {
//     const obj = { ...req.query };
//     try {
//         const trades = await TradeModel.find({ ...obj });
//         res.status(200).json(trades);
//     } catch (error) {
//         console.log(error);
//     }
// });

