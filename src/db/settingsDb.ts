import { model, Schema } from 'mongoose';

export interface Settings {
  excludedPairs: string[];
  dcaAmount: number;
  maxTickers: number;
}

const schema = new Schema<Settings>({
  excludedPairs: [],
  dcaAmount: { type: Number },
  maxTickers: { type: Number },
});

const SettingsModel = model<Settings>('Setting', schema);

export class SettingsDb {
  async getSymbols() {
    try {
      const result = await SettingsModel.find();
      return result[0];
    } catch (error) {
      console.error(error);
    }
  }

  hasSettings = async (): Promise<boolean> => {
    const res = await SettingsModel.find();
    return res.length > 0;
  };

  async createSettings() {
    const doc = new SettingsModel({
      dcaAmount: 500,
      excludedPairs: [],
      maxTickers: 0,
    });
    const exists = await this.hasSettings();
    if (!exists) {
      await doc.save();
    }
    return doc;
  }
}
