import { connect } from 'mongoose';

class MongoDbConnection {
  async connect(): Promise<any> {
    try {
      await connect(process.env.MONGODB_URI);
      console.log('Connected To Mongodb in the Cloud');
    } catch (error) {
      console.log('Error connecting', error);
    }
  }
}

export default new MongoDbConnection().connect;
