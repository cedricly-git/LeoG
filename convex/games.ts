import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

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
  })),
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('games')
      .withIndex('by_user', q => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})
