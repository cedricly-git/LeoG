import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { getEventById } from '../data/events'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProfilePanelProps {
  userId: Id<'users'>
  userName: string
  onClose: () => void
  financialUnlocked: boolean
  onUnlock: () => void
}

type AssetResult = {
  assetName: string
  animalName: string
  animalCategory: string
  units: number
  multiplier: number
  startPrice?: number
  endPrice?: number
  rawPct: number
  effectivePct: number
  eventBonusPct: number
  isEventAffected: boolean
  dollarPnl: number
}

type RoundData = {
  roundNumber: number
  totalPnl: number
  portfolioValueBefore: number
  portfolioValueAfter: number
  timeSkipDays: number
  eventIds: number[]
  portfolioChoices: Array<{ assetName: string; animalName: string; units: number }>
  assetResults: AssetResult[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatVal(v: number) {
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function skipLabel(days: number) {
  if (days <= 3) return '3 days'
  if (days <= 7) return '1 week'
  if (days <= 14) return '2 weeks'
  if (days <= 30) return '1 month'
  if (days <= 60) return '2 months'
  if (days <= 120) return '4 months'
  if (days <= 180) return '6 months'
  if (days <= 365) return '1 year'
  return '18 months'
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Pig': '🐷', 'Guard Dog': '🐕', 'Horse': '🐴',
  'Medicinal Plant': '🌿', 'Grain Crop': '🌾', 'Bovine': '🐄',
  'Collective': '🏡', 'Tool': '⛏️', 'Hedge': '🪴',
}

function ReturnBadge({ pct }: { pct: number }) {
  const isPos = pct >= 0
  return (
    <span style={{
      fontFamily: '"Lora", serif', fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '3px',
      background: isPos ? '#f0fdf4' : '#fef2f2',
      color: isPos ? '#16a34a' : '#dc2626',
      border: `1px solid ${isPos ? '#86efac' : '#fca5a5'}`,
    }}>
      {isPos ? '+' : ''}{pct.toFixed(1)}%
    </span>
  )
}

// ── RoundRow ──────────────────────────────────────────────────────────────────

function RoundRow({ round }: { round: RoundData }) {
  const [open, setOpen] = useState(false)
  const isPos = round.totalPnl >= 0
  const events = round.eventIds.map(id => getEventById(id))

  return (
    <div style={{
      borderRadius: '6px',
      border: `1px solid ${open ? '#C8B898' : '#EDE3D3'}`,
      overflow: 'hidden',
      background: open ? 'white' : '#FAF4E8',
      transition: 'border-color 0.15s, background 0.15s',
    }}>
      {/* Summary row — click to expand */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 12px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: '"Playfair Display", serif',
          fontWeight: 700, color: '#8B6B50', minWidth: '36px', fontSize: '13px',
        }}>R{round.roundNumber}</span>

        {/* Event icons preview */}
        <span style={{ fontSize: '14px', letterSpacing: '2px' }}>
          {events.map(ev => ev.icon).join(' ')}
        </span>

        <span style={{ fontFamily: '"Lora", serif', color: '#8B6B50', flex: 1, fontSize: '11px' }}>
          {skipLabel(round.timeSkipDays)}
        </span>

        <span style={{
          fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '13px',
          color: isPos ? '#16a34a' : '#dc2626', minWidth: '56px', textAlign: 'right',
        }}>
          {isPos ? '+' : ''}${Math.abs(round.totalPnl).toFixed(0)}
        </span>

        <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50', minWidth: '52px', textAlign: 'right' }}>
          → {formatVal(round.portfolioValueAfter)}
        </span>

        <span style={{
          color: '#B89070', fontSize: '11px', marginLeft: '2px',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.18s', display: 'inline-block',
        }}>▾</span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: '1px solid #EDE3D3', padding: '12px 12px 14px' }}>

          {/* ── News events ── */}
          <div style={{
            fontFamily: '"Lora", serif', fontSize: '9px', color: '#8B6B50',
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px',
          }}>Market News</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            {events.map(ev => (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '8px 10px', borderRadius: '5px',
                background: ev.isPositive ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${ev.isPositive ? '#86efac50' : '#fca5a550'}`,
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1.2 }}>{ev.icon}</span>
                <div>
                  <div style={{
                    fontFamily: '"Playfair Display", serif', fontSize: '12px',
                    fontWeight: 700,
                    color: ev.isPositive ? '#15803d' : '#b91c1c',
                  }}>{ev.title}</div>
                  <div style={{
                    fontFamily: '"Lora", serif', fontSize: '10px',
                    color: '#6B5040', marginTop: '2px', lineHeight: 1.4,
                  }}>{ev.impactLabel}</div>
                </div>
                <span style={{
                  marginLeft: 'auto', flexShrink: 0,
                  fontFamily: '"Lora", serif', fontSize: '10px',
                  fontWeight: 600, padding: '2px 6px', borderRadius: '3px',
                  background: ev.isPositive ? '#dcfce7' : '#fee2e2',
                  color: ev.isPositive ? '#15803d' : '#b91c1c',
                }}>
                  {ev.isPositive ? '▲' : '▼'} {ev.eventNumber}× impact
                </span>
              </div>
            ))}
          </div>

          {/* ── Portfolio picks ── */}
          <div style={{
            fontFamily: '"Lora", serif', fontSize: '9px', color: '#8B6B50',
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px',
          }}>Your Portfolio This Round</div>

          {round.assetResults.length === 0 ? (
            <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#B89070', fontStyle: 'italic' }}>
              No asset data recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {round.assetResults.map(r => {
                const pnlPos = r.dollarPnl >= 0
                return (
                  <div key={r.assetName} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 10px', borderRadius: '5px',
                    background: '#FAF4E8',
                    border: `1px solid ${r.isEventAffected ? (r.eventBonusPct >= 0 ? '#86efac50' : '#fca5a550') : '#EDE3D3'}`,
                    borderLeft: `3px solid ${pnlPos ? '#22c55e' : '#ef4444'}`,
                  }}>
                    <span style={{ fontSize: '14px', flexShrink: 0 }}>
                      {CATEGORY_EMOJI[r.animalCategory] ?? '🐾'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: '"Playfair Display", serif', fontSize: '11px',
                        fontWeight: 700, color: '#2C1810',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{r.animalName}</div>
                      <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#8B6B50' }}>
                        {r.units} unit{r.units !== 1 ? 's' : ''} · {r.assetName}
                        {r.isEventAffected && (
                          <span style={{
                            marginLeft: '5px', fontWeight: 600,
                            color: r.eventBonusPct >= 0 ? '#16a34a' : '#dc2626',
                          }}>
                            · ⚡ event {r.eventBonusPct >= 0 ? '+' : ''}{(r.eventBonusPct * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontFamily: '"Playfair Display", serif', fontSize: '12px',
                        fontWeight: 700, color: pnlPos ? '#16a34a' : '#dc2626',
                      }}>
                        {pnlPos ? '+' : ''}${Math.abs(r.dollarPnl).toFixed(0)}
                      </div>
                      <div style={{
                        fontFamily: '"Lora", serif', fontSize: '10px',
                        color: pnlPos ? '#16a34a80' : '#dc262680',
                      }}>
                        {(r.effectivePct * 100) >= 0 ? '+' : ''}{(r.effectivePct * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Round subtotal */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', marginTop: '2px',
                borderTop: '1px solid #EDE3D3',
                fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50',
              }}>
                <span>Round {round.roundNumber} total</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ReturnBadge pct={(round.totalPnl / round.portfolioValueBefore) * 100} />
                  <span style={{
                    fontFamily: '"Playfair Display", serif', fontWeight: 700,
                    fontSize: '13px',
                    color: isPos ? '#16a34a' : '#dc2626',
                  }}>
                    {isPos ? '+' : ''}${Math.abs(round.totalPnl).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── AiRecapPanel ───────────────────────────────────────────────────────────────

type AiRecap = {
  summary: string
  riskProfiling: string
  diversification: string
  longTermInvesting: string
  assetClasses: string
  topTip: string
  archetype: string
  overallScore: number
  generatedAt: number
}

function AiRecapPanel({ recap }: { recap: AiRecap }) {
  const [tab, setTab] = useState<'risk' | 'diversification' | 'longterm' | 'classes'>('risk')
  const scoreColor = recap.overallScore >= 70 ? '#16a34a' : recap.overallScore >= 40 ? '#ca8a04' : '#dc2626'
  const scoreBg    = recap.overallScore >= 70 ? '#f0fdf4' : recap.overallScore >= 40 ? '#fefce8' : '#fef2f2'
  const scoreBorder = recap.overallScore >= 70 ? '#86efac' : recap.overallScore >= 40 ? '#fde047' : '#fca5a5'

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{
        fontFamily: '"Lora", serif', fontSize: '9px', color: '#8B6B50',
        letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span>AI Strategy Review</span>
        <span style={{
          background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac',
          padding: '1px 6px', borderRadius: '3px', fontSize: '9px', fontWeight: 600,
        }}>GPT-4o</span>
      </div>

      <div style={{
        borderRadius: '10px', overflow: 'hidden',
        border: '1px solid #E8D9C8', background: 'white',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 14px',
          background: 'linear-gradient(135deg, #f8f4ee, #fff)',
          borderBottom: '1px solid #EDE3D3',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: '"Playfair Display", serif', fontSize: '13px',
              fontWeight: 900, color: '#2C1810', marginBottom: '4px',
            }}>{recap.archetype}</div>
            <div style={{
              fontFamily: '"Lora", serif', fontSize: '11px',
              color: '#6B5040', lineHeight: '1.5',
            }}>{recap.summary}</div>
          </div>
          <div style={{
            flexShrink: 0, textAlign: 'center',
            padding: '6px 10px', borderRadius: '8px',
            background: scoreBg, border: `1px solid ${scoreBorder}`,
          }}>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
              {recap.overallScore}
            </div>
            <div style={{ fontFamily: '"Lora", serif', fontSize: '9px', color: scoreColor, letterSpacing: '1px', textTransform: 'uppercase' }}>score</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #EDE3D3' }}>
          {([
            { key: 'risk',            label: 'Risk' },
            { key: 'diversification', label: 'Diversif.' },
            { key: 'longterm',        label: 'Long-term' },
            { key: 'classes',         label: 'Assets' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '7px 2px', border: 'none', cursor: 'pointer',
                background: tab === t.key ? '#faf4e8' : 'transparent',
                borderBottom: tab === t.key ? '2px solid #2D6A4F' : '2px solid transparent',
                fontFamily: '"Lora", serif', fontSize: '10px',
                color: tab === t.key ? '#2D6A4F' : '#B89070',
                transition: 'all 0.15s',
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#4A3728', lineHeight: '1.6' }}>
            {tab === 'risk'            && recap.riskProfiling}
            {tab === 'diversification' && recap.diversification}
            {tab === 'longterm'        && recap.longTermInvesting}
            {tab === 'classes'         && recap.assetClasses}
          </div>
        </div>

        {/* Tip */}
        <div style={{
          padding: '10px 14px 12px',
          borderTop: '1px solid #EDE3D3',
          background: '#fdfaf5',
          display: 'flex', gap: '8px', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '13px', flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontFamily: '"Lora", serif', fontSize: '9px', color: '#8B6B50', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '3px' }}>Next Season Tip</div>
            <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#6B5040', lineHeight: '1.5', fontStyle: 'italic' }}>{recap.topTip}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── GameRow ────────────────────────────────────────────────────────────────────

function GameRow({
  game, isExpanded, onToggle, onDelete, rounds,
}: {
  game: {
    _id: Id<'games'>
    startedAt: number
    status: 'in_progress' | 'complete'
    finalPortfolioValue?: number
    totalPnl?: number
    aiRecap?: AiRecap
  }
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
  rounds: RoundData[] | null
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isComplete = game.status === 'complete'
  const finalVal = game.finalPortfolioValue ?? 0
  const start = 1000
  const pct = isComplete && finalVal > 0 ? ((finalVal - start) / start) * 100 : null

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirmDelete) {
      onDelete()
    } else {
      setConfirmDelete(true)
    }
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmDelete(false)
  }

  return (
    <div style={{
      border: `1px solid ${confirmDelete ? '#fca5a5' : '#E8D9C8'}`,
      borderRadius: '8px', overflow: 'hidden', background: 'white',
      transition: 'border-color 0.2s',
    }}>
      {/* Game header */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={onToggle}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', background: 'transparent', border: 'none',
            cursor: 'pointer', textAlign: 'left', minWidth: 0,
          }}
        >
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: isComplete ? '#22c55e' : '#F5C842',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '13px', fontWeight: 700, color: '#2C1810' }}>
              {isComplete ? 'Season One' : 'In Progress'}
            </div>
            <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#8B6B50', marginTop: '1px' }}>
              {formatDate(game.startedAt)}
              {isComplete && rounds && ` · ${rounds.length} round${rounds.length !== 1 ? 's' : ''}`}
            </div>
          </div>
          {isComplete && finalVal > 0 && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontFamily: '"Playfair Display", serif', fontSize: '15px', fontWeight: 700,
                color: finalVal >= start ? '#16a34a' : '#dc2626',
              }}>{formatVal(finalVal)}</div>
              {pct !== null && (
                <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: pct >= 0 ? '#16a34a' : '#dc2626' }}>
                  {pct >= 0 ? '+' : ''}{pct.toFixed(1)}% return
                </div>
              )}
            </div>
          )}
          <span style={{
            color: '#B89070', fontSize: '12px',
            transform: isExpanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s', display: 'inline-block', flexShrink: 0,
          }}>▾</span>
        </button>

        {/* Delete controls */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '0 10px', borderLeft: '1px solid #EDE3D3', flexShrink: 0,
        }}>
          {confirmDelete ? (
            <>
              <button
                onClick={handleDeleteClick}
                title="Confirm delete"
                style={{
                  padding: '4px 8px', borderRadius: '4px', border: 'none',
                  background: '#fef2f2', color: '#dc2626',
                  fontFamily: '"Lora", serif', fontSize: '11px', fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}
              >
                Delete
              </button>
              <button
                onClick={handleCancelDelete}
                title="Cancel"
                style={{
                  padding: '4px 6px', borderRadius: '4px', border: 'none',
                  background: '#f5f5f4', color: '#8B6B50',
                  fontFamily: '"Lora", serif', fontSize: '11px',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e7e5e4' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f5f5f4' }}
              >
                ✕
              </button>
            </>
          ) : (
            <button
              onClick={handleDeleteClick}
              title="Delete this session"
              style={{
                width: '24px', height: '24px', borderRadius: '4px', border: 'none',
                background: 'transparent', color: '#C4A882',
                fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#fef2f2'
                e.currentTarget.style.color = '#dc2626'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#C4A882'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Rounds list */}
      {isExpanded && (
        <div style={{ padding: '0 10px 12px', borderTop: '1px solid #EDE3D3', paddingTop: '10px' }}>
          {!rounds ? (
            <div style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#B89070', textAlign: 'center', padding: '12px' }}>
              Loading rounds…
            </div>
          ) : rounds.length === 0 ? (
            <div style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#B89070', textAlign: 'center', padding: '12px', fontStyle: 'italic' }}>
              No rounds recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {rounds.map(r => <RoundRow key={r.roundNumber} round={r} />)}

              {/* Season total bar */}
              {isComplete && game.finalPortfolioValue && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', marginTop: '4px',
                  borderTop: '2px solid #EDE3D3',
                  fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50',
                }}>
                  <span style={{ fontWeight: 600 }}>Season total</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ReturnBadge pct={((game.finalPortfolioValue - start) / start) * 100} />
                    <span style={{
                      fontFamily: '"Playfair Display", serif', fontWeight: 700,
                      fontSize: '14px', color: '#2C1810',
                    }}>{formatVal(game.finalPortfolioValue)}</span>
                  </div>
                </div>
              )}

              {/* AI Recap */}
              {isComplete && game.aiRecap && (
                <AiRecapPanel recap={game.aiRecap} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── ProfilePanel ───────────────────────────────────────────────────────────────

export function ProfilePanel({ userId, userName, onClose, financialUnlocked, onUnlock }: ProfilePanelProps) {
  const [expandedGameId, setExpandedGameId] = useState<Id<'games'> | null>(null)

  const user     = useQuery(api.users.getUserById, { userId })
  const games    = useQuery(api.games.getUserGames, { userId })
  const expandedRounds = useQuery(
    api.rounds.getGameRounds,
    expandedGameId ? { gameId: expandedGameId } : 'skip'
  )
  const deleteGameMutation = useMutation(api.games.deleteGame)

  const completedGames = games?.filter(g => g.status === 'complete') ?? []
  const avgReturn = completedGames.length > 0
    ? completedGames.reduce((s, g) => s + ((g.finalPortfolioValue ?? 1000) - 1000), 0) / completedGames.length
    : null

  return (
    <>
      <style>{`
        @keyframes panelSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .profile-panel { animation: panelSlideIn 0.3s cubic-bezier(0.34, 1.1, 0.64, 1) both; }
        .profile-overlay { animation: overlayFadeIn 0.2s ease both; }
      `}</style>

      {/* Backdrop */}
      <div
        className="profile-overlay"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(28,16,8,0.45)' }}
      />

      {/* Panel */}
      <div
        className="profile-panel"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '460px', maxWidth: '100vw', zIndex: 901,
          background: '#FAF4E8',
          boxShadow: '-8px 0 48px rgba(44,24,16,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2D6A4F, #1a4a35)',
          padding: '0 24px', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '18px', fontWeight: 900, color: '#FAF4E8' }}>
              <em style={{ color: '#F5C842' }}>{userName}</em>'s Profile
            </div>
            <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#A8D5B880', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Farm Journal
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px', padding: '6px 12px', color: '#FAF4E8',
              fontFamily: '"Lora", serif', fontSize: '13px', cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
          >
            ✕ Close
          </button>
        </div>


        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            {[
              { label: 'Games Played', value: user ? String(user.gamesPlayed) : '—', sub: 'seasons' },
              {
                label: 'Best Portfolio',
                value: user && user.bestPortfolioValue > 0 ? formatVal(user.bestPortfolioValue) : '—',
                sub: user && user.bestPortfolioValue > 1000
                  ? `+${((user.bestPortfolioValue / 1000 - 1) * 100).toFixed(0)}% peak`
                  : 'from $1,000',
              },
              { label: 'Rounds Played', value: user ? String(user.totalRoundsPlayed) : '—', sub: 'total harvests' },
              {
                label: 'Avg. Return',
                value: avgReturn !== null ? `${avgReturn >= 0 ? '+' : ''}$${Math.abs(avgReturn).toFixed(0)}` : '—',
                sub: avgReturn !== null ? `${avgReturn >= 0 ? '+' : ''}${((avgReturn / 1000) * 100).toFixed(1)}% avg` : 'per game',
              },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'white', border: '1px solid #E8D9C8', borderRadius: '8px', padding: '14px 16px',
              }}>
                <div style={{ fontFamily: '"Lora", serif', fontSize: '9px', color: '#8B6B50', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {stat.label}
                </div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 700, color: '#2C1810', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#B89070', marginTop: '3px' }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Level bar */}
          {(() => {
            const level = user?.gamesPlayed ?? 0
            const UNLOCK_LEVEL = 4
            const fillPct = Math.min(100, (level / UNLOCK_LEVEL) * 100)
            const isMaxed = level >= UNLOCK_LEVEL
            return (
              <div style={{
                background: 'white', border: '1px solid #E8D9C8', borderRadius: '8px',
                padding: '16px 18px', marginBottom: '24px',
              }}>
                {/* Row: level + status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{
                      fontFamily: '"Playfair Display", serif', fontSize: '18px', fontWeight: 700, color: '#2C1810',
                    }}>Level {level}</span>
                    {financialUnlocked && (
                      <span style={{
                        fontFamily: '"Lora", serif', fontSize: '10px', color: '#C4622D',
                        letterSpacing: '1px',
                      }}>· 📈 Finance Unlocked</span>
                    )}
                  </div>
                  <span style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#8B6B50' }}>
                    {Math.min(level, UNLOCK_LEVEL)}/{UNLOCK_LEVEL} seasons
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '8px', background: '#F0E8D4', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{
                    height: '100%', borderRadius: '4px',
                    width: `${fillPct}%`,
                    background: financialUnlocked
                      ? 'linear-gradient(90deg, #C4622D, #E8A043)'
                      : 'linear-gradient(90deg, #2D6A4F, #4A9B6F)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>

                {/* Milestone pips */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', margin: '0 auto 3px',
                        background: level >= n
                          ? (financialUnlocked ? '#C4622D' : '#2D6A4F')
                          : '#E8D9C8',
                        transition: 'background 0.3s',
                      }} />
                      <div style={{
                        fontFamily: '"Lora", serif', fontSize: '9px',
                        color: level >= n ? '#8B6B50' : '#C8B898',
                        letterSpacing: '0.5px',
                      }}>Lv{n}</div>
                    </div>
                  ))}
                </div>

                {/* Sub-text */}
                <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#B89070', fontStyle: 'italic' }}>
                  {financialUnlocked
                    ? 'Financial information is visible — markets revealed.'
                    : isMaxed
                      ? 'You\'ve reached Level 4. Unlock financial insights below.'
                      : `${UNLOCK_LEVEL - level} more season${UNLOCK_LEVEL - level !== 1 ? 's' : ''} to unlock financial details`}
                </div>

                {/* Unlock button */}
                {isMaxed && !financialUnlocked && (
                  <button
                    onClick={() => {
                      onUnlock()
                    }}
                    style={{
                      marginTop: '14px', width: '100%', padding: '12px',
                      background: 'linear-gradient(135deg, #C4622D, #E8A043)',
                      border: 'none', borderRadius: '6px', color: '#FAF4E8',
                      fontFamily: '"Playfair Display", serif', fontSize: '14px',
                      fontWeight: 700, letterSpacing: '0.5px', cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(196,98,45,0.3)',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  >
                    📈 Unlock Financial Information
                  </button>
                )}
              </div>
            )
          })()}

          {/* Game history */}
          <div style={{
            fontFamily: '"Lora", serif', fontSize: '10px', color: '#8B6B50',
            letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px',
          }}>
            Game History
            {games && (
              <span style={{ marginLeft: '8px', color: '#B89070', textTransform: 'none', letterSpacing: 0, fontSize: '10px' }}>
                · {games.length} season{games.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {!games ? (
            <div style={{ fontFamily: '"Lora", serif', fontSize: '13px', color: '#8B6B50', textAlign: 'center', padding: '32px', fontStyle: 'italic' }}>
              Loading your history…
            </div>
          ) : games.length === 0 ? (
            <div style={{
              fontFamily: '"Lora", serif', fontSize: '13px', color: '#8B6B50',
              textAlign: 'center', padding: '32px', fontStyle: 'italic',
              border: '1px dashed #E8D9C8', borderRadius: '8px',
            }}>
              No games saved yet.<br />
              <span style={{ fontSize: '11px' }}>Complete a season to see your history.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {games.map(game => (
                <GameRow
                  key={game._id}
                  game={game}
                  isExpanded={expandedGameId === game._id}
                  onToggle={() => setExpandedGameId(prev => prev === game._id ? null : game._id)}
                  onDelete={() => {
                    if (expandedGameId === game._id) setExpandedGameId(null)
                    deleteGameMutation({ gameId: game._id }).catch(console.error)
                  }}
                  rounds={expandedGameId === game._id ? (expandedRounds as RoundData[] ?? null) : null}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0, padding: '12px 20px', borderTop: '1px solid #E8D9C8', background: 'white',
          fontFamily: '"Lora", serif', fontSize: '10px', color: '#B89070', textAlign: 'center', fontStyle: 'italic',
        }}>
          Progress saved automatically · Powered by Convex
        </div>
      </div>
    </>
  )
}
