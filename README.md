# LeoG — The Farm Portfolio Game

> A financial education game built for **Starthack 2026** where you manage a portfolio of farm animals that secretly represent real-world financial assets.

---

## What is LeoG?

LeoG turns investing into a farm management sim. Pick your animals, watch the market move, survive random events, and grow your portfolio over 7 rounds of play — all backed by **real historical price data**.

Each asset class maps to a different creature on your farm:

| Asset Class | Farm Metaphor | Examples |
|---|---|---|
| Stocks (Finance) | Pigs | Hampshire, Landrace... |
| Stocks (Tech) | Horses | Arabian, Thoroughbred... |
| Stocks (Defense) | Guard Dogs | Rottweiler, Doberman... |
| Bonds | Bovines | Angus Cow, Highland Yak... |
| Pharma | Medicinal Herbs | Arnica, Gentian... |
| Commodities | Grain Crops | Wheat, Corn, Barley... |
| Crypto | Farm Tools | Hammer, Axe, Chainsaw... |
| ETFs | Collectives | Mixed Herds, Syndicates... |
| Hedges | Precious Metals | Gold, Silver |

---

## Gameplay

1. **Create a profile** — Enter your farmer name.
2. **Build your portfolio** — Choose up to 10 assets from 50+ options ($50/unit).
3. **Lock in** — Confirm your picks before the round begins.
4. **Watch the market** — An animated 60fps farm reflects the state of your portfolio in real time.
5. **Survive events** — Random farm-themed events (locust swarms, harvest seasons, disease outbreaks) affect asset classes, just like real market catalysts.
6. **Review your round** — See P&L, winners, losers, and what events fired.
7. **Repeat for 7 rounds** — Each round skips forward in time using real historical data.
8. **Get your AI recap** — A personalized analysis of your investment style, risk profile, and diversification score.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Routing | TanStack Router (file-based) |
| Backend / Database | Convex (serverless, real-time) |
| Data | PapaParse + historical CSV price data |
| Animations | HTML5 Canvas (60fps, pure JS) |

---

## Project Structure

```
LeoG_Front/
├── src/
│   ├── routes/
│   │   └── index.tsx          # Main game (all 7 phases)
│   ├── components/
│   │   ├── AnimatedFarm.tsx   # 60fps canvas farm with event effects
│   │   └── PixelAnimal.tsx    # SVG pixel-art sprite renderer
│   ├── lib/
│   │   ├── gameEngine.ts      # Round logic, P&L, event weighting
│   │   └── csvLoader.ts       # Async historical data loading
│   └── data/
│       ├── assetAnimalMapping.ts  # Asset → animal mapping + multipliers
│       └── events.ts              # 15+ farm event definitions
├── convex/
│   ├── schema.ts              # DB schema (users, games, rounds)
│   ├── games.ts               # Game mutations & queries
│   ├── rounds.ts              # Round tracking
│   ├── users.ts               # User management
│   └── ai.ts                  # AI recap generation
├── Data/
│   ├── Stocks.csv             # ~2.8 MB historical stock prices
│   ├── Bonds.csv              # ~2.3 MB bond data
│   ├── ETFs.csv               # ~1.7 MB ETF data
│   ├── Gold&silver.csv        # Precious metals
│   └── crypto_5y.csv          # 5 years of crypto prices
└── Images/
    ├── Pigs/  Horses/  GuardDogs/  Herbs/  Cereals/  Cows/  Tools/
    └── PixelArts/             # Pixel sprite fallbacks
```

---

## Getting Started

### Prerequisites

- Node.js 18+ or [Bun](https://bun.sh)
- [Convex CLI](https://docs.convex.dev/quickstart/react)

### Install dependencies

```bash
bun install
```

### Start the development server

```bash
bun run dev
```

This starts the Vite dev server with HMR. You'll also need the Convex backend running:

```bash
bunx convex dev
```

See `CONVEX_SETUP.md` for backend configuration details.

### Build for production

```bash
bun run build
bun run preview
```

### Lint

```bash
bun run lint
```

---

## Game Engine Details

- **7 rounds** of play, starting from March 19, 2021
- **Time skip per round:** 3 days to 18 months (player's choice)
- **Unit cost:** $50 per asset unit
- **Multipliers:** each asset class has a gain/loss amplifier (e.g. crypto: 4×, hedges: 0.25×)
- **Events:** weighted by portfolio concentration — if you're heavy in grains, locust events hit harder
- **AI recap:** generated at game end with risk profiling, diversification score, and farm-metaphor feedback

---

## Event System

Events fire each round and affect asset classes with buffs or debuffs:

| Event | Effect |
|---|---|
| The Great Locust Swarm | Bearish on grains |
| High Harvest Season | Bullish on herds |
| Swine Flu Outbreak | Bearish on pigs |
| Timber Rush | Bullish on tools/crypto |
| Storm Season | Mixed weather effects |
| + 10 more... | Various asset impacts |

Visual effects on the farm canvas reflect each event in real time (locusts swarm, sparkles appear for good news, disease spores drift across the screen for outbreaks).

---

## Database Schema (Convex)

```
users      → name, gamesPlayed, bestPortfolioValue
games      → userId, status, finalValue, aiRecap
rounds     → gameId, trades, P&L, assetResults, eventsFired
```

---

Built with love at Starthack 2026.

Lorik Dalloshi, Noah Cline, Cédric Ly

