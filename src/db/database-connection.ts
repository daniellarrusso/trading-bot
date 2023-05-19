import { connect } from 'mongoose';

class MongoDbConnection {
  async connect(): Promise<any> {
    const uri: string =
      'mongodb+srv://admin:CoffeeFish@cluster0.xpu1y.mongodb.net/binance-bot?retryWrites=true&w=majority';
    await connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected To Mongodb in the Cloud');
  }
}

export default new MongoDbConnection().connect;
