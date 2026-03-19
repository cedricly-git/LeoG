export interface GameScore {
  date: string
  portfolioValue: number
  benchmarkValue: number
  archetype: string
  roundsPlayed: number
}

export interface PlayerStats {
  totalGames: number
  totalWealth: number
  highestAlpha: number // Percentage beating the benchmark
  commonArchetype: string
  riskProfile: 'Conservative' | 'Balanced' | 'Aggressive'
}

const STORAGE_KEYS = {
  SCORES: 'leog_scores',
  STATS: 'leog_player_stats',
}

export function saveGameScore(score: GameScore) {
  const scores = getScores()
  scores.unshift(score)
  localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores.slice(0, 10))) // Keep top 10 recent
  updatePlayerStats(score)
}

export function getScores(): GameScore[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCORES)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getPlayerStats(): PlayerStats {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATS)
    return data ? JSON.parse(data) : {
      totalGames: 0,
      totalWealth: 0,
      highestAlpha: -100,
      commonArchetype: 'None',
      riskProfile: 'Balanced',
    }
  } catch {
    return {
      totalGames: 0,
      totalWealth: 0,
      highestAlpha: -100,
      commonArchetype: 'None',
      riskProfile: 'Balanced',
    }
  }
}

function updatePlayerStats(newScore: GameScore) {
  const stats = getPlayerStats()
  stats.totalGames += 1
  stats.totalWealth += newScore.portfolioValue
  
  const alpha = (newScore.portfolioValue - newScore.benchmarkValue) / newScore.benchmarkValue
  if (alpha > stats.highestAlpha) {
    stats.highestAlpha = alpha
  }
  
  // A simple way to update common archetype could be more complex, 
  // but for now we'll just set it to the latest one
  stats.commonArchetype = newScore.archetype

  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats))
}
