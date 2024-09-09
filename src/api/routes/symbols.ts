import { Request, Response, Router } from 'express';
import { SymbolModel } from '../../db/symbol';

const route = Router();

route.get('/', async (req: Request, res: Response) => {
    const result = await SymbolModel.find();
    res.json(result).status(200);
});

export default route;
