import { connect } from 'mongoose';

export class MongoDbConnection {
  uri: string = 'mongodb+srv://admin:CoffeeFish@cluster0.xpu1y.mongodb.net/binance-bot?retryWrites=true&w=majority';
  async connect(): Promise<any> {
    await connect(this.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected To Mongodb in the Cloud');
  }
}
