import { Advisor } from './advisor';
import { Side, ordertypes } from './literals';
import { TradeResponse } from './trade-response';

export class OrderAdvisor extends Advisor {
    type: string;
    trade(price?: number, side?: Side): Promise<TradeResponse> {
        throw new Error('Method not implemented.');
    }
    end(closingPrice: any) {
        throw new Error('Method not implemented.');
    }
    notifyTelegramBot(message: string): void {
        throw new Error('Method not implemented.');
    }
    addProfitResults(close: number, lastBuy: TradeResponse) {
        throw new Error('Method not implemented.');
    }
    protected setup() {
        throw new Error('Method not implemented.');
    }
}
