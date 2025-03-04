import express from 'express';
import tradesRoute from './routes/router';
import symbolsRoute from './routes/symbols';
import cors from 'cors';
import router from './routes/router';

const PORT = 8000;
const app = express();

app.use(express.json());
app.use(cors());
app.use(router);

const connectApi = () =>
    app.listen(PORT, () => {
        console.log('API listening on port: ' + PORT);
    });

export default connectApi;
