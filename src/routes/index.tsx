import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: LandingV2,
})

const LIVESTOCK = [
  {
    id: 'chicken',
    emoji: '??',
    name: 'Chicken',
    asset: 'Growth Stock',
    risk: 5,
    badge: 'HIGH YIELD',
    badgeColor: '#C4622D',
    desc: 'Fast-moving, volatile. Best for bold farmers.',
    returnProfile: '+12% avg. annual',
    detail: 'Mirrors high-growth equities. Think tech, biotech, emerging disruptors.',
  },
  {
    id: 'cow',
    emoji: '??',
    name: 'Cow',
    asset: 'Government Bond',
    risk: 1,
    badge: 'STABLE',
    badgeColor: '#2D6A4F',
    desc: 'Steady milk every season. The reliable backbone.',
    returnProfile: '+3.2% avg. annual',
    detail: 'Mirrors sovereign debt. Predictable income with inflation exposure.',
  },
  {
    id: 'sheep',
    emoji: '??',
    name: 'Sheep',
    asset: 'Index ETF',
    risk: 2,
    badge: 'BALANCED',
    badgeColor: '#1D5FA0',
    desc: 'Follows the herd. Diversified, simple, effective.',
    returnProfile: '+7.1% avg. annual',
    detail: 'Mirrors broad market ETFs. Low cost, passive, historically reliable.',
  },
  {
    id: 'pig',
    emoji: '??',
    name: 'Pig',
    asset: 'Gold',
    risk: 2,
    badge: 'SAFE HAVEN',
    badgeColor: '#B8860B',
    desc: 'Mud-resistant. Protects the farm in any storm.',
    returnProfile: '+5.5% avg. annual',
    detail: 'Mirrors precious metals. Crisis hedge, inflation shield, store of centuries.',
  },
  {
    id: 'horse',
    emoji: '??',
    name: 'Horse',
    asset: 'Crypto',
    risk: 5,
    badge: 'SPECULATIVE',
    badgeColor: '#6D28D9',
    desc: 'Wild and untamed. Could win the race or bolt.',
    returnProfile: '+/-40% volatile',
    detail: 'Mirrors digital assets. Extreme swings, 24/7 exposure, frontier territory.',
  },
]

function RiskDots({ level }: { level: number }) {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: i < level ? '#C4622D' : '#E8D9C8',
        }} />
      ))}
    </div>
  )
}

export default function LandingV2() {
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  const totalUnits = Object.values(selected).reduce((a, b) => a + b, 0)
  const budget = 1000
  const spent = totalUnits * 100

  function adjust(id: string, delta: number) {
    setSelected(prev => {
      const curr = prev[id] ?? 0
      const next = Math.max(0, curr + delta)
      if (next === 0) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF4E8',
      color: '#2C1810',
      fontFamily: `"Georgia", serif`,
      paddingTop: '0',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lora:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .v2-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .v2-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(44,24,16,0.12) !important; }
        @keyframes emerge {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .emerge { animation: emerge 0.5s ease forwards; opacity: 0; }
        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        .v2-animal { animation: bob 4s ease-in-out infinite; display: inline-block; }
      `}</style>

      {/* Hero header */}
      <div style={{
        background: '#2D6A4F',
        padding: '40px 60px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: '60px', top: '50%', transform: 'translateY(-50%)',
          fontSize: '80px', opacity: 0.12, letterSpacing: '8px',
        }}>??????????</div>

        <div style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: '14px',
          letterSpacing: '4px',
          color: '#A8D5B8',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>Season One · The Harvest Begins</div>

        <h1 style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: '56px',
          fontWeight: 900,
          color: '#FAF4E8',
          margin: 0,
          lineHeight: 1.1,
          maxWidth: '600px',
        }}>
          Build Your<br />
          <em style={{ color: '#F5C842' }}>Dream Farm</em>
        </h1>

        <p style={{
          fontFamily: '"Lora", serif',
          color: '#A8D5B8',
          fontSize: '16px',
          marginTop: '12px',
          maxWidth: '480px',
          lineHeight: 1.7,
        }}>
          Choose your livestock wisely. Every animal behaves like a real market asset.
          Five seasons await ? will your farm thrive or wither?
        </p>

        <div style={{ display: 'flex', gap: '32px', marginTop: '20px' }}>
          {[
            { label: 'Budget', value: `$${budget}` },
            { label: 'Spent', value: `$${spent}` },
            { label: 'Remaining', value: `$${budget - spent}` },
            { label: 'Animals', value: totalUnits },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{
                fontSize: '11px', color: '#A8D5B8', letterSpacing: '2px',
                fontFamily: '"Lora", serif',
              }}>
                {stat.label.toUpperCase()}
              </div>
              <div style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '22px',
                color: '#FAF4E8',
                fontWeight: 700,
              }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main two-column */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: 'calc(100vh - 280px)',
      }}>
        {/* Left: livestock selection */}
        <div style={{
          padding: '32px 40px',
          borderRight: '1px solid #E8D9C8',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 280px)',
        }}>
          <div style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '22px',
            fontWeight: 700,
            marginBottom: '6px',
            color: '#2C1810',
          }}>Choose Your Livestock</div>
          <p style={{
            fontFamily: '"Lora", serif',
            fontSize: '13px',
            color: '#8B6B50',
            marginBottom: '24px',
            lineHeight: 1.6,
          }}>
            Each animal mirrors a real-world investment class. Mix and match to build a resilient farm.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {LIVESTOCK.map((animal, idx) => {
              const count = selected[animal.id] ?? 0
              const isExpanded = expanded === animal.id
              return (
                <div
                  key={animal.id}
                  className="v2-card emerge"
                  style={{
                    background: count > 0 ? 'white' : '#FEFCF7',
                    border: `1px solid ${count > 0 ? '#C4622D' : '#E8D9C8'}`,
                    borderRadius: '8px',
                    padding: '20px',
                    animationDelay: `${idx * 0.08}s`,
                    boxShadow: count > 0
                      ? '0 4px 20px rgba(196,98,45,0.15)'
                      : '0 2px 8px rgba(44,24,16,0.05)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpanded(isExpanded ? null : animal.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="v2-animal" style={{ fontSize: '36px', animationDelay: `${idx * 0.7}s` }}>
                        {animal.emoji}
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{
                            fontFamily: '"Playfair Display", serif',
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#2C1810',
                          }}>{animal.name}</span>
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            borderRadius: '2px',
                            background: `${animal.badgeColor}15`,
                            color: animal.badgeColor,
                            letterSpacing: '1px',
                            fontFamily: '"Lora", serif',
                            border: `1px solid ${animal.badgeColor}30`,
                          }}>{animal.badge}</span>
                        </div>
                        <div style={{
                          fontFamily: '"Lora", serif',
                          fontSize: '12px',
                          color: '#8B6B50',
                        }}>{animal.asset} · {animal.returnProfile}</div>
                        <div style={{ marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '11px', color: '#B89070',
                            fontFamily: '"Lora", serif',
                          }}>Risk:</span>
                          <RiskDots level={animal.risk} />
                        </div>
                      </div>
                    </div>

                    {/* Counter */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => adjust(animal.id, -1)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'transparent',
                          border: '1.5px solid #E8D9C8', color: '#8B6B50',
                          cursor: 'pointer', fontSize: '18px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s', fontFamily: 'serif',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#C4622D'
                          e.currentTarget.style.color = '#C4622D'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#E8D9C8'
                          e.currentTarget.style.color = '#8B6B50'
                        }}
                      >?</button>
                      <span style={{
                        fontFamily: '"Playfair Display", serif',
                        fontSize: '24px',
                        fontWeight: 700,
                        color: count > 0 ? '#C4622D' : '#D4BFA8',
                        minWidth: '28px',
                        textAlign: 'center',
                      }}>{count}</span>
                      <button
                        onClick={() => adjust(animal.id, 1)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: count > 0 ? '#C4622D' : 'transparent',
                          border: '1.5px solid #C4622D',
                          color: count > 0 ? '#FAF4E8' : '#C4622D',
                          cursor: 'pointer', fontSize: '18px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >+</button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{
                      marginTop: '14px',
                      paddingTop: '14px',
                      borderTop: '1px solid #E8D9C8',
                      fontFamily: '"Lora", serif',
                      fontSize: '13px',
                      color: '#6B4E37',
                      lineHeight: 1.7,
                      fontStyle: 'italic',
                    }}>
                      {animal.detail}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: farm preview */}
        <div style={{
          background: '#F0E8D4',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '4px',
            background: 'repeating-linear-gradient(90deg, #C4622D 0, #C4622D 20px, #2D6A4F 20px, #2D6A4F 40px)',
          }} />

          <div style={{
            padding: '28px 32px',
            borderBottom: '1px solid #E8D9C8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}>
            <div>
              <div style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '20px',
                fontWeight: 700,
                color: '#2C1810',
              }}>Your Farm Preview</div>
              <div style={{
                fontFamily: '"Lora", serif',
                fontSize: '12px',
                color: '#8B6B50',
                marginTop: '2px',
              }}>A pixel world awaits your decisions</div>
            </div>
            <span style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#C4622D' }}>
              {totalUnits} animal{totalUnits !== 1 ? 's' : ''} selected
            </span>
          </div>

          {/* Pixel farm placeholder */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
          }}>
            <div style={{
              width: '100%',
              maxWidth: '480px',
              aspectRatio: '4/3',
              background: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 40%, #4A7C4E 40%, #4A7C4E 100%)',
              border: '3px solid #2C1810',
              borderRadius: '4px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '8px 8px 0 rgba(44,24,16,0.25)',
            }}>
              {/* Sky elements */}
              <div style={{ position: 'absolute', top: '8px', left: '16px', fontSize: '20px', opacity: 0.7 }}>
                ?? ??
              </div>
              <div style={{ position: 'absolute', top: '6px', right: '24px', fontSize: '24px', opacity: 0.8 }}>
                ??
              </div>

              {/* Barn */}
              <div style={{
                position: 'absolute', right: '20px', bottom: '20px',
                fontSize: '48px', filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.3))',
              }}>???</div>

              {totalUnits === 0 ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontFamily: '"Playfair Display", serif',
                    color: '#FAF4E8',
                    textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                    textAlign: 'center',
                    padding: '16px',
                    background: 'rgba(44,24,16,0.5)',
                    borderRadius: '4px',
                  }}>
                    Your farm is empty.<br />
                    <em>Add livestock to bring it to life.</em>
                  </div>
                </div>
              ) : (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: 0, right: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '0 8px',
                }}>
                  {Object.entries(selected).flatMap(([id, count]) => {
                    const a = LIVESTOCK.find(l => l.id === id)!
                    return Array.from({ length: Math.min(count, 8) }, (_, i) => (
                      <span key={`${id}-${i}`} style={{ fontSize: '28px' }}>{a.emoji}</span>
                    ))
                  })}
                </div>
              )}
            </div>

            <div style={{
              marginTop: '12px',
              fontFamily: '"Lora", serif',
              fontSize: '11px',
              color: '#8B6B50',
              fontStyle: 'italic',
              textAlign: 'center',
            }}>
              Pixel animation will populate based on your portfolio
            </div>
          </div>

          {/* CTA */}
          {totalUnits > 0 && (
            <div style={{
              padding: '24px 32px',
              borderTop: '1px solid #E8D9C8',
              background: '#FAF4E8',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {Object.entries(selected).map(([id, count]) => {
                  const a = LIVESTOCK.find(l => l.id === id)!
                  return (
                    <span key={id} style={{
                      fontFamily: '"Lora", serif',
                      fontSize: '12px',
                      padding: '4px 12px',
                      background: '#FFF',
                      border: '1px solid #E8D9C8',
                      borderRadius: '2px',
                      color: '#2C1810',
                    }}>
                      {a.emoji} {a.name} ×{count}
                    </span>
                  )
                })}
              </div>
              <button
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#2D6A4F',
                  color: '#FAF4E8',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '1px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 16px rgba(45,106,79,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#3A8A63' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2D6A4F' }}
              >
                Lock Portfolio &amp; Begin Season One ?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
