import express from 'express';
import route from './routes/trades';

const PORT = 8000;
const app = express();

app.use(express.json());
app.use('/trades', route);

const connectApi = () =>
  app.listen(PORT, () => {
    console.log('API listening on port: ' + PORT);
  });

export default connectApi;
