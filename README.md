# Quantum Apex System — Final (CLI Hybrid)

## Summary
Quantum Apex System — Hybrid Binary + Forex auto-trader (CLI-first).  
- Auto-start scanning (no UI)  
- Telegram signals & cloud backup (Firebase or local)  
- Username/password broker login scaffold (Quotex & Exness)  
- Strategy core includes SMC/ICT/OB/FVG/HTF checks and AI learner hooks.

## Quick start
1. Create repo, paste files exactly.
2. Copy `.env.example` → `.env` and fill values (use Replit Secrets for tokens).
3. `npm install`
4. `npm start` (or Replit run)
5. Watch console logs — signals arrive and Telegram receives messages if configured.

## Adapters
- For live trades: implement `global.fetchCandles(pair, count)` to return an array of candles `{time,open,high,low,close,volume}` from your broker. Place it before engine starts.
- Optionally implement placing orders in `brokerManager.js`.

## Safety & testing
- Start with `USE_REAL_*` toggles set to `false` (simulation) to verify flows.
- Use Telegram to monitor and inspect signals before connecting real capital.

Owner: David Mamun William
