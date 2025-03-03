# Trading Bot

A Node.js trading bot built with TypeScript, designed to interact with cryptocurrency exchanges like **Kraken** and **Binance** using external  official APIs. This bot is highly customizable and can be extended to support additional exchanges or trading strategies.

A Node.js trading bot built with TypeScript, designed to interact with cryptocurrency exchanges like Kraken and Binance using node third party libraries to communicate with their official APIs. This bot is customizable, uses **MongoDB** for data storage, and can be extended to support additional exchanges or trading strategies.

---

## Features

- **Multi-Exchange Support**: Integrates with **Kraken** and **Binance** APIs.
- **TypeScript**: Written in TypeScript for type safety and better developer experience.
- **Customizable Strategies**: Easily implement and test your own trading strategies.
- **Environment Variables**: Securely manage API keys, secrets, and MongoDB connection strings using `.env`.
- **MongoDB Integration**: Stores trading data, logs, and strategy results in MongoDB.
- **Modular Design**: Clean and modular codebase for easy maintenance and extension.

---

## Prerequisites

Before running the bot, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (local or cloud instance)
- API keys from [Kraken](https://www.kraken.com/) and/or [Binance](https://www.binance.com/)

---

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/trading-bot.git
   cd trading-bot
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and add your API keys:
   ```env
   # Kraken API Keys
   KRAKEN_KEY=your_kraken_api_key
   KRAKEN_SECRET=your_kraken_api_secret

   # Binance API Keys
   BINANCE_KEY=your_binance_api_key
   BINANCE_SECRET=your_binance_api_secret

   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/trading-bot


## Usage

### Running the Bot
To start the bot, you need to configure a Strategy and Exchange to run in app.ts file and then run:
```bash
npm start
```

### Available Scripts
- **Start**: Run the bot.
  ```bash
  npm start
  ```
- **Lint**: Check for code style issues.
  ```bash
  npm run lint
  ```
- **Test**: Run unit tests.
  ```bash
  npm test
  ```

---

## Configuration

### Environment Variables
The bot uses the following environment variables:

| Variable         | Description        | Example                                 |
| ---------------- | ------------------ | --------------------------------------- |
| `KRAKEN_KEY`     | Kraken API key     | `your_kraken_api_key`                   |
| `KRAKEN_SECRET`  | Kraken API secret  | `your_kraken_api_secret`                |
| `BINANCE_KEY`    | Binance API key    | `your_binance_api_key`                  |
| `BINANCE_SECRET` | Binance API secret | `your_binance_api_secret`               |
| `MONGODB_URI`    | MongoDB connection | `mongodb://localhost:27017/trading-bot` |

### Customizing Strategies
You can implement your own trading strategies by modifying the `src/strategies` directory. Each strategy should export an `advice` function that can use various indicators and/or statistics on various timeframes to buy or sell a crpytocurrency.

Example:
```typescript
// src/strategies/simpleArbitrage.ts
import { KrakenClient, BinanceClient } from '../clients';

export const run = async () => {
  const krakenPrice = await KrakenClient.getPrice('BTC/USD');
  const binancePrice = await BinanceClient.getPrice('BTCUSDT');

  if (krakenPrice > binancePrice) {
    console.log('Arbitrage opportunity detected!');
    // Implement your trading logic here
  }
};
```

---

## External Dependencies

The bot uses the following npm packages:

- **[kraken-api](https://www.npmjs.com/package/kraken-api)**: Official Kraken API client.
- **[binance-api](https://www.npmjs.com/package/binance-api)**: Official Binance API client.
- **[mongoose](https://www.npmjs.com/package/mongoose)**: MongoDB object modeling for Node.js.
- **[dotenv](https://www.npmjs.com/package/dotenv)**: Load environment variables from `.env`.
- **[typescript](https://www.npmjs.com/package/typescript)**: TypeScript compiler.
- **[jest](https://www.npmjs.com/package/jest)**: Testing framework.

---

## Contributing

---

## License

---

## Disclaimer

This trading bot is for educational purposes only. Use it at your own risk. The authors are not responsible for any financial losses incurred while using this software. Always test your strategies in a sandbox environment before deploying them with real funds.

---

## Support

If you have any questions or need help, feel free to open an issue or contact the maintainers.

Happy trading! 🚀

## Features
Multi-Exchange Support: Integrates with Kraken and Binance APIs.

TypeScript: Written in TypeScript for type safety and better developer experience.

Customizable Strategies: Easily implement and test your own trading strategies.

Environment Variables: Securely manage API keys and secrets using .env.

Modular Design: Clean and modular codebase for easy maintenance and extension.