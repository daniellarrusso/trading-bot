# Market Trader Strategy
## Rationale
To buy immediate dips and then sell on bounce back. Primarily for Bitcoin - USDT operating on 5 - 15 minute support and resistance
### Triggers
- Buy 
  - Identify level on chart and set buyPrice perceived support price (usually based on MA's)
- Sell
  - SellPrice is either a percentage higher than buy on candle close or could be resistance level.
  - Sell/Short if price continues on downwards trajectory and didnt *'bounce'*
## Indicators
-   20 EMA
-   50 SMA
-   200 SMA
-   Perceived support and resistance.
-   Fibbonacci
### Issues
1.  Hekin Ashi updates every hour so what starts as Green could be RED in next hour and force a sell. Or Vice versa. 
### ToDo
- [ ] Implement Sell logic
- [ ] Implement Fibbonacci level (could use old alternater-strategy)
