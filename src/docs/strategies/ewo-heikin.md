# Elliot Wave Oscillator (EWO) Heikin Ashi Strategy
## Rationale
Strategy is good on 5min - 15min intervals. Using a 4hour Heikin Ashi candle to check if in immediate up trend or beginning a downtrend
### Triggers
- Buy 
  - EWO > 0 and Hekin Ashi Candle is greeen
  - Heikin Ashi Daily Candle must be green
- Sell
  - EWO < 0 and Heiki Ashi candle is Red

## Indicators
-   Elliot Wave - SMA 5 SMA 35 percentage crossover
-   Heikin Ashi Candles on multiple timeframes
### Issues
1.  Hekin Ashi updates every hour so what starts as Green could be RED in next hour and force a sell. Or Vice versa. 
### ToDo
- [ ] Create EWO Indicator
- [ ] Refactor MultiTimeline 
- [ ] GetCandlestick History - enough for Heikin (250)







