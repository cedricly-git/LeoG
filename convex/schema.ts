import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    name: v.string(),
    createdAt: v.number(),
    gamesPlayed: v.number(),
    bestPortfolioValue: v.number(),
    totalRoundsPlayed: v.number(),
  }).index('by_name', ['name']),

  games: defineTable({
    userId: v.id('users'),
    status: v.union(v.literal('in_progress'), v.literal('complete')),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    finalPortfolioValue: v.optional(v.number()),
    totalPnl: v.optional(v.number()),
  }).index('by_user', ['userId']),

  rounds: defineTable({
    gameId: v.id('games'),
    userId: v.id('users'),
    roundNumber: v.number(),
    portfolioValueBefore: v.number(),
    portfolioValueAfter: v.number(),
    totalPnl: v.number(),
    startDate: v.string(),
    endDate: v.string(),
    timeSkipDays: v.number(),
    eventIds: v.array(v.number()),
    portfolioChoices: v.array(v.object({
      assetName: v.string(),
      animalName: v.string(),
      units: v.number(),
    })),
    assetResults: v.array(v.object({
      assetName: v.string(),
      animalName: v.string(),
      animalCategory: v.string(),
      units: v.number(),
      multiplier: v.number(),
      startPrice: v.optional(v.number()),
      endPrice: v.optional(v.number()),
      rawPct: v.number(),
      effectivePct: v.number(),
      eventBonusPct: v.number(),
      isEventAffected: v.boolean(),
      dollarPnl: v.number(),
    })),
  })
    .index('by_game', ['gameId'])
    .index('by_user', ['userId']),
})
