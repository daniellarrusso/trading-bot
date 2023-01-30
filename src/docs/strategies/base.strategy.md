# Base Strategy
## Rationale
Base strategy all other strategies inherit. The strategy loads history and triggers backtesting as well as performs checks as when it is safe for trading on strategies to begin.

## Indicators
-   Heikin Ashi multitimeframe
-   Candlestats
-   Loads all indicators with historical data
## Backtest Results
Only good for liquid pairs. BTC USDT. ETH, etc
### Issues
1.  Hekin Ashi Daily may not update. 
### ToDo
- [ ] Refector checkin of trade status
- [ ] Optional Heikin Ashi Daily logic for strategy.







