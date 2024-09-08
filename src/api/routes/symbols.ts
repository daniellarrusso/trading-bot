import { Request, Response, Router } from 'express';
import { SymbolModel } from '../../db/symbol';
import prisma from '../../../prisma/client';

const route = Router();

route.get('/', async (req: Request, res: Response) => {
    const result = await prisma.symbols.findMany();
    res.json(result).status(200);
});

export default route;
