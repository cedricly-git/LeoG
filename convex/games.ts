import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const aiRecapValidator = v.object({
  summary: v.string(),
  riskProfiling: v.string(),
  diversification: v.string(),
  longTermInvesting: v.string(),
  assetClasses: v.string(),
  topTip: v.string(),
  archetype: v.string(),
  overallScore: v.number(),
  riskScore: v.optional(v.number()),
  diversificationScore: v.optional(v.number()),
  longTermScore: v.optional(v.number()),
  generatedAt: v.number(),
})

export const createGame = mutation({
  args: { userId: v.id('users') },
  returns: v.id('games'),
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId)
    if (!user) throw new Error('User not found')

    const gameId = await ctx.db.insert('games', {
      userId,
      status: 'in_progress',
      startedAt: Date.now(),
    })
    return gameId
  },
})

export const completeGame = mutation({
  args: {
    gameId: v.id('games'),
    finalPortfolioValue: v.number(),
    totalPnl: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { gameId, finalPortfolioValue, totalPnl }) => {
    const game = await ctx.db.get(gameId)
    if (!game) throw new Error('Game not found')

    await ctx.db.patch(gameId, {
      status: 'complete',
      completedAt: Date.now(),
      finalPortfolioValue,
      totalPnl,
    })
    return null
  },
})

export const deleteGame = mutation({
  args: { gameId: v.id('games') },
  returns: v.null(),
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId)
    if (!game) throw new Error('Game not found')

    // Delete all rounds belonging to this game
    const rounds = await ctx.db
      .query('rounds')
      .withIndex('by_game', q => q.eq('gameId', gameId))
      .collect()
    for (const round of rounds) {
      await ctx.db.delete(round._id)
    }

    // Update user stats if the game was complete
    if (game.status === 'complete') {
      const user = await ctx.db.get(game.userId)
      if (user) {
        const newGamesPlayed = Math.max(0, user.gamesPlayed - 1)
        const newRoundsPlayed = Math.max(0, user.totalRoundsPlayed - rounds.length)

        // Recalculate best portfolio value from remaining games
        const remainingGames = await ctx.db
          .query('games')
          .withIndex('by_user', q => q.eq('userId', game.userId))
          .filter(q => q.and(
            q.neq(q.field('_id'), gameId),
            q.eq(q.field('status'), 'complete'),
          ))
          .collect()
        const newBest = remainingGames.reduce(
          (best, g) => Math.max(best, g.finalPortfolioValue ?? 0),
          0
        )

        await ctx.db.patch(game.userId, {
          gamesPlayed: newGamesPlayed,
          totalRoundsPlayed: newRoundsPlayed,
          bestPortfolioValue: newBest,
        })
      }
    }

    await ctx.db.delete(gameId)
    return null
  },
})

export const saveAiRecap = mutation({
  args: {
    gameId: v.id('games'),
    aiRecap: aiRecapValidator,
  },
  returns: v.null(),
  handler: async (ctx, { gameId, aiRecap }) => {
    const game = await ctx.db.get(gameId)
    if (!game) throw new Error('Game not found')
    await ctx.db.patch(gameId, { aiRecap })
    return null
  },
})

export const getUserGames = query({
  args: { userId: v.id('users') },
  returns: v.array(v.object({
    _id: v.id('games'),
    _creationTime: v.number(),
    userId: v.id('users'),
    status: v.union(v.literal('in_progress'), v.literal('complete')),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    finalPortfolioValue: v.optional(v.number()),
    totalPnl: v.optional(v.number()),
    aiRecap: v.optional(aiRecapValidator),
  })),
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('games')
      .withIndex('by_user', q => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})
