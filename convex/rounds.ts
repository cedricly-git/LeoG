import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const assetResultValidator = v.object({
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
})

const portfolioChoiceValidator = v.object({
  assetName: v.string(),
  animalName: v.string(),
  units: v.number(),
})

export const saveRound = mutation({
  args: {
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
    portfolioChoices: v.array(portfolioChoiceValidator),
    assetResults: v.array(assetResultValidator),
  },
  returns: v.id('rounds'),
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game) throw new Error('Game not found')

    const roundId = await ctx.db.insert('rounds', args)
    return roundId
  },
})

export const getGameRounds = query({
  args: { gameId: v.id('games') },
  returns: v.array(v.object({
    _id: v.id('rounds'),
    _creationTime: v.number(),
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
    portfolioChoices: v.array(portfolioChoiceValidator),
    assetResults: v.array(assetResultValidator),
  })),
  handler: async (ctx, { gameId }) => {
    return await ctx.db
      .query('rounds')
      .withIndex('by_game', q => q.eq('gameId', gameId))
      .order('asc')
      .collect()
  },
})
