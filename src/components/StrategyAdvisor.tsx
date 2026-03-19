import { useMemo } from 'react'

interface AssetResult {
  assetName:      string
  animalCategory: string
  units:          number
  multiplier:     number
}

interface RoundResult {
  round:                number
  portfolioValueBefore: number
  portfolioValueAfter:  number
  totalPnl:             number
  assetResults:         AssetResult[]
}

interface Props {
  portfolio:      AssetResult[]
  currentValue:   number
  round:          number
  history?:       RoundResult[]
  isFinal?:       boolean
}

/**
 * Enhanced AI Strategic Advisor with Behavioral Profiling.
 */
export function StrategyAdvisor({ portfolio, currentValue, round, history, isFinal }: Props) {
  const prediction = useMemo(() => {
    if (portfolio.length === 0 && (!history || history.length === 0)) return null

    // 1. Feature Extraction (Current state)
    const totalUnits = portfolio.length > 0 ? portfolio.reduce((a, b) => a + b.units, 0) : 1
    
    // Risk levels: Bond=1, Pharma=2, Finance=2, Defense=3, Commodities=3, Tech=4, Crypto=5
    const riskMap: Record<string, number> = {
      'Bovine': 1, 'Medicinal Plant': 2, 'Pig': 2, 'Guard Dog': 3, 'Grain Crop': 3, 'Horse': 4, 'Tool': 5
    }
    const retMap: Record<string, number> = {
      'Bovine': 0.035, 'Medicinal Plant': 0.06, 'Pig': 0.085, 'Guard Dog': 0.11, 'Grain Crop': 0.07, 'Horse': 0.18, 'Tool': 0.30
    }

    let avgRisk = 0
    let avgRet = 0
    portfolio.forEach(p => {
      const weight = p.units / totalUnits
      avgRisk += (riskMap[p.animalCategory] || 2) * weight
      avgRet  += (retMap[p.animalCategory] || 0.1) * weight
    })

    // Diversity
    const cats = portfolio.map(p => p.animalCategory)
    const uniqueCats = Array.from(new Set(cats))
    const pTable = uniqueCats.map(c => portfolio.filter(p => p.animalCategory === c).reduce((a, b) => a + b.units, 0) / totalUnits)
    const entropy = -pTable.reduce((a, p) => a + p * Math.log2(p), 0)
    const diversity = Math.min(entropy / 2.5, 1)

    // Behavioral Analysis (History needed)
    let archetype = ""
    let behaviourDesc = ""
    
    if (isFinal && history && history.length > 0) {
      const avgHistRisk = history.reduce((acc, h) => {
        const hUnits = h.assetResults.reduce((a, b) => a + b.units, 0) || 1
        return acc + h.assetResults.reduce((sum, r) => sum + (riskMap[r.animalCategory] || 2) * (r.units / hUnits), 0)
      }, 0) / history.length

      const pnlVol = history.reduce((acc, h, i) => {
        if (i === 0) return acc
        return acc + Math.abs((h.totalPnl / h.portfolioValueBefore) - (history[i-1].totalPnl / history[i-1].portfolioValueBefore))
      }, 0) / (history.length - 1 || 1)

      // Archetype Logic
      if (avgHistRisk > 3.8) {
        archetype = "The Moon-Shot Architect"
        behaviourDesc = "You prioritize exponential growth over survival. Your strategy relies heavily on high-volatility assets like Crypto and Tech."
      } else if (avgHistRisk < 1.8) {
        archetype = "The Eternal Guardian"
        behaviourDesc = "You are extremely risk-averse, favoring the stability of Bonds and Pharma. Your portfolio is a fortress of predictable growth."
      } else if (diversity > 0.7) {
        archetype = "The Balanced Harvester"
        behaviourDesc = "A sophisticated multi-sector approach. You've skillfully mitigated idiosyncratic risks by spreading resources across the entire farm."
      } else if (pnlVol > 0.15) {
        archetype = "The Momentum Diver"
        behaviourDesc = "You tend to swing your allocation wildly in response to market events. Significant potential, but prone to high emotional stress."
      } else {
        archetype = "The Methodical Farmer"
        behaviourDesc = "A disciplined, goal-oriented strategy. You maintain consistent risk exposure regardless of short-term noise."
      }
    }

    // 2. Output Logic
    const inputs = [Math.min(currentValue / 5000, 1), avgRisk/5, avgRet/0.3, diversity, round/10]
    function leakyRelu(x: number) { return x > 0 ? x : x * 0.01 }
    const weightsH = [
      [0.2, -0.5, 0.8, 0.1, -0.3], [0.4, 0.1, -0.2, 0.7, 0.5],
      [-0.1, 0.8, 0.3, -0.4, 0.2], [0.6, -0.2, 0.5, 0.1, -0.8],
      [0.3, 0.3, -0.1, 0.6, -0.2], [-0.5, 0.1, 0.7, -0.2, 0.4],
      [0.1, -0.7, 0.2, 0.5, 0.6], [0.8, 0.4, -0.3, 0.1, -0.1]
    ]
    const weightsO = [
      [0.5, -0.2, 0.8, -0.1, 0.4, 0.3, -0.4, 0.6], 
      [-0.1, 0.6, 0.2, 0.5, -0.3, 0.8, 0.1, -0.2], 
      [0.4, -0.3, 0.1, -0.7, 0.5, -0.2, 0.6, 0.1]  
    ]
    const hidden = weightsH.map(row => leakyRelu(row.reduce((acc, w, i) => acc + w * inputs[i], 0)))
    const outputs = weightsO.map(row => row.reduce((acc, w, i) => acc + w * hidden[i], 0))

    const growthFac = outputs[0] * 2
    const stability = Math.max(0, Math.min(1, outputs[1] + 0.5))
    const predVal = currentValue * Math.pow(1 + (avgRet + growthFac * 0.05), 5)

    return {
      futureValue: predVal,
      stability: stability * 100,
      archetype,
      behaviourDesc,
      avgRisk,
      isFinal
    }
  }, [portfolio, currentValue, round, history, isFinal])

  if (!prediction) return null

  if (prediction.isFinal) {
    return (
      <div style={{
        marginTop: '32px', padding: '24px',
        background: 'linear-gradient(135deg, rgba(29, 95, 160, 0.08), rgba(45, 106, 79, 0.08))',
        border: '1px solid rgba(29, 95, 160, 0.2)', borderRadius: '12px',
        fontFamily: '"Lora", serif', textAlign: 'center'
      }}>
        <div style={{ fontSize: '11px', color: '#1D5FA0', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
          POST-PARTY STRATEGY AUDIT
        </div>
        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '24px', fontWeight: 900, color: '#2C1810', marginBottom: '8px' }}>
          Archetype: {prediction.archetype}
        </div>
        <div style={{ fontSize: '14px', color: '#4A3728', lineHeight: '1.6', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
          &ldquo;{prediction.behaviourDesc}&rdquo;
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
          <div>
            <div style={{ fontSize: '9px', color: '#8B6B50', textTransform: 'uppercase' }}>Avg Strategy Risk</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{prediction.avgRisk.toFixed(2)} / 5.0</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', color: '#8B6B50', textTransform: 'uppercase' }}>Forecast Accuracy</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{prediction.stability.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      marginTop: '20px', padding: '16px',
      background: 'rgba(29, 95, 160, 0.05)', border: '1px solid rgba(29, 95, 160, 0.2)',
      borderRadius: '8px', fontFamily: '"Lora", serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1D5FA0', boxShadow: '0 0 10px #1D5FA0' }} />
        <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px', color: '#1D5FA0', textTransform: 'uppercase' }}>
          Neural Strategic Forecast
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#8B6B50', textTransform: 'uppercase', marginBottom: '4px' }}>5rd Projection</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#2C1810' }}>
            ${prediction.futureValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#8B6B50', textTransform: 'uppercase', marginBottom: '4px' }}>Stability</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1D5FA0' }}>{prediction.stability.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}
