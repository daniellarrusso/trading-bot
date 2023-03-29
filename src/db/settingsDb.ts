import { model, Schema } from 'mongoose';

export interface Settings {
  excludedPairs: string[];
  dcaAmount: number;
}

const schema = new Schema<Settings>({
  excludedPairs: [],
  dcaAmount: { type: Number },
});

const SettingsModel = model<Settings>('Setting', schema);

export class SettingsDb {
  private async getSettings() {
    try {
      const result = await SettingsModel.find();
      return result[0];
    } catch (error) {
      console.error(error);
    }
  }

  async createSettings() {
    const doc = new SettingsModel({
      dcaAmount: 500,
      excludedPairs: [],
    });
    const exists = await this.getSettings();
    if (!exists) {
      await doc.save();
    }
    return doc;
  }
}
