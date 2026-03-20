'use node'

import { action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

// ── Types ──────────────────────────────────────────────────────────────────────

const ASSET_CLASS_MAP: Record<string, string> = {
  'Bovine':           'Bonds (low-risk, stable fixed-income)',
  'Medicinal Plant':  'Healthcare / Pharma stocks (medium risk)',
  'Pig':              'Financial sector stocks (medium risk)',
  'Guard Dog':        'Defense sector stocks (medium risk)',
  'Grain Crop':       'Commodities — Gold, Silver, Grain (medium risk)',
  'Horse':            'Technology stocks (high risk, high growth potential)',
  'Tool':             'Cryptocurrency (very high risk, very high volatility)',
  'Collective':       'ETFs / Diversified funds (medium risk)',
  'Hedge':            'Hedge / Alternative investments (variable risk)',
}

const SKIP_LABEL: Record<number, string> = {
  3:   '3 days (very short)',
  7:   '1 week (short-term)',
  14:  '2 weeks (short-term)',
  30:  '1 month (medium-term)',
  60:  '2 months (medium-term)',
  120: '4 months (medium-term)',
  180: '6 months (long-term)',
  365: '1 year (long-term)',
  548: '18 months (very long-term)',
}

function skipToLabel(days: number): string {
  const keys = Object.keys(SKIP_LABEL).map(Number).sort((a, b) => a - b)
  for (const k of keys) {
    if (days <= k) return SKIP_LABEL[k]
  }
  return '18 months (very long-term)'
}

// ── Action ─────────────────────────────────────────────────────────────────────

export const analyzeGame = action({
  args: {
    gameId: v.id('games'),
    rounds: v.array(v.object({
      roundNumber: v.number(),
      timeSkipDays: v.number(),
      eventTitles: v.array(v.string()),
      eventPositive: v.array(v.boolean()),
      categories: v.array(v.string()),
      units: v.array(v.number()),
      pnlPerCategory: v.array(v.number()),
      portfolioValueBefore: v.number(),
      portfolioValueAfter: v.number(),
      totalPnl: v.number(),
    })),
    finalPortfolioValue: v.number(),
    startValue: v.number(),
  },
  returns: v.object({
    summary: v.string(),
    riskProfiling: v.string(),
    diversification: v.string(),
    longTermInvesting: v.string(),
    assetClasses: v.string(),
    topTip: v.string(),
    archetype: v.string(),
    overallScore: v.number(),
    riskScore: v.number(),
    diversificationScore: v.number(),
    longTermScore: v.number(),
    generatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set. Please add it in your Convex dashboard under Settings → Environment Variables.')
    }

    // Build a human-readable summary of the game for the prompt
    const roundSummaries = args.rounds.map(r => {
      const categoryCounts: Record<string, number> = {}
      r.categories.forEach((cat, i) => {
        categoryCounts[cat] = (categoryCounts[cat] ?? 0) + r.units[i]
      })

      const allocationLines = Object.entries(categoryCounts).map(
        ([cat, units]) => `  • ${units}x ${cat} (${ASSET_CLASS_MAP[cat] ?? cat})`
      ).join('\n')

      const events = r.eventTitles.map((t, i) => `  • ${r.eventPositive[i] ? '▲' : '▼'} ${t}`).join('\n')
      const pnlSign = r.totalPnl >= 0 ? '+' : ''

      return `Round ${r.roundNumber} — Time horizon: ${skipToLabel(r.timeSkipDays)}
Portfolio:
${allocationLines}
Market events:
${events}
Result: ${pnlSign}$${r.totalPnl.toFixed(0)} (portfolio ${r.portfolioValueBefore.toFixed(0)} → ${r.portfolioValueAfter.toFixed(0)})`
    }).join('\n\n')

    const totalReturn = ((args.finalPortfolioValue - args.startValue) / args.startValue * 100).toFixed(1)
    const totalPnlAmt = (args.finalPortfolioValue - args.startValue).toFixed(0)
    const sign = args.finalPortfolioValue >= args.startValue ? '+' : ''

    const prompt = `You are a friendly, educational financial advisor AI reviewing a player's performance in an investment simulation game. The game uses farm animals as metaphors for real financial asset classes.

Asset class key:
${Object.entries(ASSET_CLASS_MAP).map(([k, v]) => `- ${k} = ${v}`).join('\n')}

Player's game summary (7 rounds, starting capital: $${args.startValue}):

${roundSummaries}

Final result: $${args.finalPortfolioValue.toFixed(0)} (${sign}${totalPnlAmt} | ${sign}${totalReturn}% return)

Analyze their investment behavior and provide structured educational feedback. Be warm, specific to their actual choices, and constructive. Avoid generic advice — reference the actual asset classes they did or did not use.

Respond with ONLY valid JSON matching this exact structure:
{
  "summary": "2-3 sentence overall assessment of their season",
  "riskProfiling": "2-3 sentences about their risk tolerance and behavior patterns across rounds",
  "diversification": "2-3 sentences about how well they spread risk across asset classes",
  "longTermInvesting": "2-3 sentences about their time horizon choices and what long-term investing principles apply",
  "assetClasses": "2-3 sentences about which asset classes they used, missed, and what each offers",
  "topTip": "one specific, actionable tip for their next game (1 sentence)",
  "archetype": "one of: Cautious Guardian | Balanced Harvester | Tech Enthusiast | Crypto Daredevil | Diversified Master | Momentum Chaser | Methodical Farmer | Bond Fortress Builder",
  "overallScore": <integer 0-100 rating their overall strategy quality>,
  "riskScore": <integer 0-100 rating their risk management — higher means they balanced risk well, avoided reckless concentration, and sized positions appropriately>,
  "diversificationScore": <integer 0-100 rating how well they diversified — higher means they spread across multiple uncorrelated asset classes>,
  "longTermScore": <integer 0-100 rating their long-term thinking — higher means they consistently chose longer time horizons and thought beyond short-term gains>
}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://leog-farm.app',
        'X-Title': 'LeoG Farm Investment Game',
      },
      body: JSON.stringify({
        model: 'minimax/minimax-m2.7',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1400,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenRouter API error ${response.status}: ${err}`)
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }

    const raw = data.choices[0]?.message?.content
    if (!raw) throw new Error('Empty response from OpenRouter')

    // Extract JSON block in case the model wraps it in markdown fences
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const content = jsonMatch ? jsonMatch[0] : raw

    let parsed: {
      summary: string
      riskProfiling: string
      diversification: string
      longTermInvesting: string
      assetClasses: string
      topTip: string
      archetype: string
      overallScore: number
      riskScore: number
      diversificationScore: number
      longTermScore: number
    }

    try {
      parsed = JSON.parse(content)
    } catch {
      throw new Error(`Failed to parse AI response as JSON. Raw: ${content.slice(0, 200)}`)
    }

    const clamp = (n: number | undefined, fallback: number) =>
      Math.min(100, Math.max(0, Math.round(n ?? fallback)))

    const recap = {
      summary:              parsed.summary            ?? '',
      riskProfiling:        parsed.riskProfiling      ?? '',
      diversification:      parsed.diversification    ?? '',
      longTermInvesting:    parsed.longTermInvesting  ?? '',
      assetClasses:         parsed.assetClasses       ?? '',
      topTip:               parsed.topTip             ?? '',
      archetype:            parsed.archetype          ?? 'Methodical Farmer',
      overallScore:         clamp(parsed.overallScore, 50),
      riskScore:            clamp(parsed.riskScore, 50),
      diversificationScore: clamp(parsed.diversificationScore, 50),
      longTermScore:        clamp(parsed.longTermScore, 50),
      generatedAt:          Date.now(),
    }

    // Persist to DB
    await ctx.runMutation(api.games.saveAiRecap, { gameId: args.gameId, aiRecap: recap })

    return recap
  },
})
