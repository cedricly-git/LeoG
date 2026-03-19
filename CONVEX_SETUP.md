# Convex Backend Setup

This project uses [Convex](https://convex.dev) as the backend — real-time database, serverless functions, and auth all in one.

## Why Convex

- **Real-time subscriptions** — perfect for live market fluctuations per round
- **Serverless functions** — run market simulation logic server-side
- **Built-in auth** — plug in Clerk or Auth0 in minutes
- **TypeScript-first** — schema, queries, mutations fully typed end-to-end

---

## Setup Steps

### 1. Install Convex

```bash
bun add convex
```

### 2. Initialize

```bash
bunx convex dev
```

This will:
- Create a `convex/` directory
- Provision a free Convex project
- Generate `convex/_generated/` types

### 3. Wrap the app

In `src/main.tsx`, add the `ConvexProvider`:

```tsx
import { ConvexProvider, ConvexReactClient } from 'convex/react'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <RouterProvider router={router} />
    </ConvexProvider>
  </StrictMode>,
)
```

Add to `.env.local`:
```
VITE_CONVEX_URL=https://your-project.convex.cloud
```

---

## Planned Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  games: defineTable({
    userId: v.string(),
    status: v.union(v.literal('building'), v.literal('running'), v.literal('complete')),
    currentRound: v.number(),  // 1-5
    portfolio: v.array(v.object({
      animalId: v.string(),    // 'chicken' | 'cow' | 'sheep' | 'pig' | 'horse'
      quantity: v.number(),
      purchasePrice: v.number(),
    })),
    startedAt: v.number(),
  }),

  rounds: defineTable({
    gameId: v.id('games'),
    roundNumber: v.number(),
    newsEvent: v.object({
      headline: v.string(),
      affectedAssets: v.array(v.string()),
      sentiment: v.union(v.literal('bullish'), v.literal('bearish'), v.literal('neutral')),
    }),
    priceChanges: v.array(v.object({
      animalId: v.string(),
      changePercent: v.number(),
      newPrice: v.number(),
    })),
    portfolioValue: v.number(),
  }),

  recaps: defineTable({
    gameId: v.id('games'),
    finalValue: v.number(),
    returnPercent: v.number(),
    aiAnalysis: v.string(),       // GPT-generated feedback
    mistakes: v.array(v.string()),
    strengths: v.array(v.string()),
  }),
})
```

---

## Planned Mutations & Queries

### `convex/games.ts`

```typescript
export const createGame = mutation(async ({ db }, { userId, portfolio }) => {
  return await db.insert('games', {
    userId,
    portfolio,
    status: 'building',
    currentRound: 0,
    startedAt: Date.now(),
  })
})

export const lockPortfolio = mutation(async ({ db }, { gameId }) => {
  await db.patch(gameId, { status: 'running', currentRound: 1 })
})
```

### `convex/simulation.ts`

```typescript
export const simulateRound = action(async ({ runMutation }, { gameId }) => {
  // 1. Generate market event (can call OpenAI here)
  // 2. Apply price changes to portfolio
  // 3. Store round result
  // 4. If round 5 → generate AI recap
})
```

---

## AI Recap (OpenAI Integration)

Convex Actions can call external APIs. The recap will use GPT-4o-mini:

```typescript
// convex/recap.ts
import OpenAI from 'openai'

export const generateRecap = action(async ({ runMutation }, { gameId, roundHistory }) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: 'You are a friendly financial education coach. Explain investment concepts using farm animal metaphors.',
    }, {
      role: 'user',
      content: `Analyze this portfolio history: ${JSON.stringify(roundHistory)}`,
    }],
  })

  return completion.choices[0].message.content
})
```

---

## Environment Variables

```bash
# .env.local
VITE_CONVEX_URL=https://your-project.convex.cloud

# Convex dashboard env vars (server-side only)
OPENAI_API_KEY=sk-...
```
