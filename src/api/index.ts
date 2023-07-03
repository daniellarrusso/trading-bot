import express from 'express';
import tradesRoute from './routes/trades';
import symbolsRoute from './routes/symbols';
import cors from 'cors';

const PORT = 8000;
const app = express();

app.use(express.json());
app.use(cors());
app.use('/trades', tradesRoute);
app.use('/symbols', symbolsRoute);

const connectApi = () =>
    app.listen(PORT, () => {
        console.log('API listening on port: ' + PORT);
    });

export default connectApi;
