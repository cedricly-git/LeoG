import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const createUser = mutation({
  args: { name: v.string() },
  returns: v.id('users'),
  handler: async (ctx, { name }) => {
    const trimmedName = name.trim()
    if (!trimmedName) throw new Error('Name cannot be empty')

    const userId = await ctx.db.insert('users', {
      name: trimmedName,
      createdAt: Date.now(),
      gamesPlayed: 0,
      bestPortfolioValue: 0,
      totalRoundsPlayed: 0,
    })
    return userId
  },
})

export const getUserById = query({
  args: { userId: v.id('users') },
  returns: v.union(
    v.object({
      _id: v.id('users'),
      _creationTime: v.number(),
      name: v.string(),
      createdAt: v.number(),
      gamesPlayed: v.number(),
      bestPortfolioValue: v.number(),
      totalRoundsPlayed: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId)
  },
})

export const updateUserStats = mutation({
  args: {
    userId: v.id('users'),
    finalPortfolioValue: v.number(),
    roundsPlayed: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { userId, finalPortfolioValue, roundsPlayed }) => {
    const user = await ctx.db.get(userId)
    if (!user) throw new Error('User not found')

    await ctx.db.patch(userId, {
      gamesPlayed: user.gamesPlayed + 1,
      totalRoundsPlayed: user.totalRoundsPlayed + roundsPlayed,
      bestPortfolioValue: Math.max(user.bestPortfolioValue, finalPortfolioValue),
    })
    return null
  },
})
