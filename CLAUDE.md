# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Compile TypeScript and run the bot (tsc && node dist/src/app.js)
npm test           # Run Jest in watch mode
npm run format     # Format TypeScript files with Prettier
npm run notify     # Run the standalone notifier service
npm run top100     # Run CoinGecko output utility
```

Run a single test file:

```bash
npx jest src/strategies/tests/base.spec.ts
```

Build only (no run):

```bash
npx tsc
```

## Architecture Overview

This is a **multi-strategy cryptocurrency trading bot** supporting Binance and Kraken exchanges.

### Entry Point Flow

`src/app.ts` is the main entry point. It:

1. Creates a `Trader` singleton (connects to MongoDB)
2. Instantiates a strategy with an exchange service and ticker config
3. Downloads historical candles for indicator initialization
4. Subscribes to real-time OHLC updates
5. Starts the Express API server on port 8000

### Core Components

**Trader** (`src/services/trader-service.ts`) — Singleton orchestrator. Manages strategy lifecycle, connects to MongoDB, and starts the API server.

**Exchange Services** (`src/services/`) — `BinanceService`, `KrakenService`, and `MockExchangeService` all implement `IExchangeService`. `MockExchangeService` is used for paper trading and backtesting.

**Strategies** (`src/strategies/`) — All strategies extend `BaseStrategy` (which implements `Strat`). Key lifecycle methods:

- `loadIndicators()` — initialize indicators
- `loadHistory(candleHistory)` — backtest on historical candles
- `update(candle)` — called on each completed candle
- `advice()` — abstract: generate buy/sell signals
- `realtimeAdvice(candle)` — abstract: handle incomplete candles

**Advisors** (`src/model/`) — Determine how signals are executed:

- `paper` — MockExchangeService (no real orders)
- `live` — Real exchange orders
- `backtest` — Historical analysis only
- `DCA` — Dollar-cost averaging
- `order` — Limit orders

**Indicators** (`src/indicators/`) — Factory pattern via `base-indicator.ts`. Available: EMA, SMA, RSI, Stochastic, CCI, ATR, Donchian, Elliott Wave Oscillator, Countdown Pressure, Sniper CCI. Multi-timeframe analysis via `AlternateTimeframe`.

**API** (`src/api/`) — Express REST server exposing `/trades` and `/assets` endpoints backed by MongoDB.

### Data Flow

```
app.ts → Trader → Strategy → Exchange Service → Trade Advisor → MongoDB
                           ↘ Indicators (OHLC candles)
                           ↘ Notifiers (Telegram)
```

### Adding a New Strategy

1. Create a class in `src/strategies/` extending `BaseStrategy`
2. Implement `advice()` and `realtimeAdvice()` abstract methods
3. Override `loadIndicators()` to set up your indicators
4. Register it in `src/app.ts` via `trader.addStrategy([new MyStrategy(...)])`

### Key Models

- `Ticker` — trading pair config (base, quote, action type, timeframe, trade amount)
- `Candle` — OHLC data with volume
- `ActionType` enum — `Long`, `Short`
- `AdvisorType` enum — `paper`, `live`, `backtest`, `DCA`, `order`
- `SellReason` enum — reason codes for closing positions

## Environment Variables

```
BINANCE_KEY, BINANCE_SECRET   # Binance API credentials
KRAKEN_KEY, KRAKEN_SECRET     # Kraken API credentials
MONGODB_URI                    # MongoDB connection string
```

## Testing

Tests use Jest with Babel/ts-jest. Test files live alongside source in `tests/` subdirectories (e.g., `src/strategies/tests/`, `src/model/tests/`). The `MockExchangeService` is the primary tool for testing strategies without live exchange calls.

## Deployment

Deployed as a Heroku worker dyno via `Procfile`. Requires Node.js >= 18.

## Purpose

This document defines engineering best practices for contributing to this repository.
All contributors (human or AI) must follow these rules when writing, modifying, or reviewing code.

---

# 🧭 Core Principles

- Prefer **clarity over cleverness**
- Keep changes **small and focused**
- Always leave the codebase **better than you found it**
- If unsure → **ask or document assumptions**

---

# 🌿 Git Workflow

## Branching Strategy

- `main` → production-ready only
- `develop` → integration branch (if used)
- Feature branches:
  - `feature/<short-description>`
  - `bugfix/<short-description>`
  - `hotfix/<short-description>`

## Rules

- ❌ Never commit directly to `main`
- ✅ Always create a branch from latest `main`
- ✅ Keep branches short-lived (ideally < 3 days)
- ✅ Rebase before opening PR

```bash
git checkout main
git pull origin main
git checkout -b feature/add-login-validation
```

---

## Commits

### Format (Conventional Commits)

```
<type>: <short summary>
```

### Types

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change without behaviour change
- `test:` adding or updating tests
- `chore:` maintenance

### Examples

- `feat: add JWT authentication middleware`
- `fix: resolve null pointer in payment service`

### Rules

- One logical change per commit
- Write messages in **present tense**
- Keep subject line < 72 chars

---

## Pull Requests (PRs)

### Requirements

- ✅ Must include description of **what + why**
- ✅ Link to issue (if applicable)
- ✅ Include screenshots (for UI changes)
- ✅ All tests must pass
- ✅ At least 1 reviewer approval

### PR Checklist

- [ ] Code compiles
- [ ] Tests added/updated
- [ ] No console logs or debug code
- [ ] No commented-out dead code

---

# 🧪 Testing Strategy

## Philosophy

- Test **behaviour**, not implementation
- Prioritise **confidence over coverage %**
- Every bug fix must include a test

---

## Test Types

### 1. Unit Tests

- Fast, isolated
- Mock dependencies
- Cover core business logic

### 2. Integration Tests

- Test interaction between components
- Use real database or test containers where possible

### 3. End-to-End (E2E)

- Test critical user journeys only
- Keep minimal (slow + brittle)

---

## Coverage Expectations

- Minimum: **80% coverage on critical paths**
- 100% coverage is NOT required
- Untested code must be justified

---

## Naming Conventions

```
should_<expected_behaviour>_when_<condition>
```

### Examples

- `should_return_401_when_token_missing`
- `should_create_user_when_valid_input`

---

## Test Structure (AAA Pattern)

```javascript
// Arrange
setupTestData();

// Act
const result = performAction();

// Assert
expect(result).toBe(expected);
```

---

## Testing Rules

- ❌ No flaky tests
- ❌ No real API calls in unit tests
- ✅ Tests must run in CI
- ✅ Tests must be deterministic

---

# 🔁 CI/CD Expectations

- All PRs trigger:
  - Build
  - Lint
  - Tests

- ❌ No merge if pipeline fails

---

# 🧹 Code Quality

- Use consistent formatting (Prettier / ESLint)
- Prefer readable functions over clever abstractions
- Keep functions small (< 50 lines ideally)
- Avoid deep nesting (> 3 levels)

---

# 🤖 AI-Specific Guidance

When generating code:

- Follow existing patterns in the repo
- Do NOT introduce new frameworks without justification
- Always include tests with new features
- Prefer explicitness over magic

---

# 🚨 Anti-Patterns to Avoid

- Large, unfocused PRs
- Skipping tests “for speed”
- Copy-pasting without understanding
- Silent failures (always handle errors)

---

# ✅ Definition of Done

A task is complete when:

- Code is merged into `main`
- Tests pass
- Feature is verified
- Documentation updated (if needed)

---

# 📌 Final Rule

If you wouldn’t be happy reviewing it — don’t commit it.
