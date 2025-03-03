import fetch from 'node-fetch';

export class TelegramBot {
  constructor(public chatGroup: any) {
    this.chatGroup = chatGroup;
  }
  async sendMessage(message: any) {
    try {
      await fetch(
        `${process.env.TELEGRAM_BOT}${this.chatGroup.id}&text=${message}`
      );
    } catch (err) {
      console.log(err);
    }
  }
}
