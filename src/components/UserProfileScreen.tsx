import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

const LOCAL_STORAGE_KEY = 'leog_user_id'

interface UserProfileScreenProps {
  onBegin: (userId: Id<'users'>, userName: string) => void
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '8px',
      padding: '18px 20px',
      minWidth: '130px',
      flex: 1,
    }}>
      <div style={{
        fontFamily: '"Lora", serif',
        fontSize: '10px',
        color: '#A8D5B8',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginBottom: '6px',
      }}>{label}</div>
      <div style={{
        fontFamily: '"Playfair Display", serif',
        fontSize: '26px',
        fontWeight: 700,
        color: '#FAF4E8',
        lineHeight: 1,
      }}>{value}</div>
      {sub && (
        <div style={{
          fontFamily: '"Lora", serif',
          fontSize: '11px',
          color: '#A8D5B870',
          marginTop: '4px',
        }}>{sub}</div>
      )}
    </div>
  )
}

export function UserProfileScreen({ onBegin }: UserProfileScreenProps) {
  const [inputName, setInputName] = useState('')
  const [storedUserId, setStoredUserId] = useState<Id<'users'> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)

  const createUser = useMutation(api.users.createUser)

  // Load stored user ID from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      setStoredUserId(stored as Id<'users'>)
    }
  }, [])

  // Fetch user data if we have a stored ID
  const existingUser = useQuery(
    api.users.getUserById,
    storedUserId ? { userId: storedUserId } : 'skip'
  )

  // Once user data loads, pre-fill name
  useEffect(() => {
    if (existingUser?.name && !editingName) {
      setInputName(existingUser.name)
    }
  }, [existingUser, editingName])

  const handleSubmit = useCallback(async () => {
    const name = inputName.trim()
    if (!name) {
      setError('Please enter your name to begin.')
      return
    }
    setError(null)
    setIsSubmitting(true)

    try {
      // If returning user and name unchanged, reuse existing ID
      if (existingUser && name === existingUser.name && storedUserId) {
        onBegin(storedUserId, name)
        return
      }

      // Create a new user (new name or first time)
      const userId = await createUser({ name })
      localStorage.setItem(LOCAL_STORAGE_KEY, userId)
      onBegin(userId, name)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }, [inputName, existingUser, storedUserId, createUser, onBegin])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const isReturning = !!existingUser
  const loading = storedUserId !== null && existingUser === undefined

  const formatValue = (v: number) =>
    `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF4E8',
      fontFamily: '"Georgia", serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lora:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes profileFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .profile-fade-up { animation: profileFadeUp 0.55s cubic-bezier(0.34,1.1,0.64,1) both; }

        @keyframes profilePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,200,66,0.25); }
          50%      { box-shadow: 0 0 0 8px rgba(245,200,66,0); }
        }
        .profile-input-focus:focus { animation: profilePulse 1.5s ease-in-out infinite; }

        @keyframes bob {
          0%,100% { transform: translateY(0) rotate(-1deg); }
          50%      { transform: translateY(-6px) rotate(1deg); }
        }
        .emoji-bob { animation: bob 4s ease-in-out infinite; display: inline-block; }
      `}</style>

      {/* Green top band */}
      <div style={{
        background: 'linear-gradient(135deg, #2D6A4F 0%, #1a4a35 100%)',
        padding: '0 40px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative emoji watermark */}
        <div style={{
          position: 'absolute', right: '40px', top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '36px', opacity: 0.08, letterSpacing: '4px', pointerEvents: 'none',
        }}>
          &#x1F437;&#x1F415;&#x1F434;&#x1F33F;&#x1F33E;
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '22px', fontWeight: 900, color: '#FAF4E8',
          }}>
            {isReturning ? `Welcome back, ` : 'Welcome to '}
            <em style={{ color: '#F5C842' }}>
              {isReturning ? (existingUser?.name ?? '…') : 'LeoG Farm'}
            </em>
          </span>
          <span style={{
            fontFamily: '"Lora", serif', fontSize: '11px',
            color: '#A8D5B880', letterSpacing: '2px', textTransform: 'uppercase',
          }}>
            {isReturning ? 'Season One · Your Farm Awaits' : 'Season One · The Harvest Begins'}
          </span>
        </div>
      </div>

      {/* Striped band */}
      <div style={{ height: '4px', background: 'repeating-linear-gradient(90deg, #C4622D 0, #C4622D 20px, #2D6A4F 20px, #2D6A4F 40px)', flexShrink: 0 }} />

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        {loading ? (
          <div style={{
            fontFamily: '"Lora", serif', fontSize: '14px', color: '#8B6B50',
          }}>Loading your profile…</div>
        ) : (
          <div style={{ width: '100%', maxWidth: '540px' }}>

            {/* Farm icon */}
            <div className="profile-fade-up" style={{ animationDelay: '0s', textAlign: 'center', marginBottom: '32px' }}>
              <span className="emoji-bob" style={{ fontSize: '64px' }}>🌾</span>
            </div>

            {/* Returning user stats */}
            {isReturning && existingUser && (
              <div className="profile-fade-up" style={{ animationDelay: '0.05s', marginBottom: '32px' }}>
                <div style={{
                  fontFamily: '"Lora", serif', fontSize: '11px',
                  color: '#8B6B50', letterSpacing: '2px', textTransform: 'uppercase',
                  textAlign: 'center', marginBottom: '14px',
                }}>Your Farm Record</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #2D6A4F, #1a4a35)',
                    borderRadius: '10px',
                    padding: '20px 24px',
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    width: '100%',
                  }}>
                    <StatCard
                      label="Games Played"
                      value={String(existingUser.gamesPlayed)}
                      sub={existingUser.gamesPlayed === 1 ? 'season' : 'seasons'}
                    />
                    <StatCard
                      label="Best Portfolio"
                      value={existingUser.bestPortfolioValue > 0
                        ? formatValue(existingUser.bestPortfolioValue)
                        : '—'}
                      sub={existingUser.bestPortfolioValue > 1000
                        ? `+${((existingUser.bestPortfolioValue / 1000 - 1) * 100).toFixed(0)}% return`
                        : 'from $1,000'}
                    />
                    <StatCard
                      label="Rounds Played"
                      value={String(existingUser.totalRoundsPlayed)}
                      sub="total harvests"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Name form */}
            <div className="profile-fade-up" style={{ animationDelay: '0.1s' }}>
              <div style={{
                background: 'white',
                border: '1px solid #E8D9C8',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 4px 24px rgba(44,24,16,0.06)',
              }}>
                <div style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '24px', fontWeight: 700, color: '#2C1810',
                  marginBottom: '6px',
                }}>
                  {isReturning ? 'Ready to play again?' : 'Name your farmer'}
                </div>
                <div style={{
                  fontFamily: '"Lora", serif', fontSize: '13px', color: '#8B6B50',
                  marginBottom: '24px',
                }}>
                  {isReturning
                    ? 'Your results will be saved to your profile.'
                    : 'Your name will be saved with your game results.'}
                </div>

                <label style={{
                  display: 'block',
                  fontFamily: '"Lora", serif', fontSize: '11px',
                  color: '#8B6B50', letterSpacing: '1.5px', textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>Farmer Name</label>

                <input
                  type="text"
                  value={inputName}
                  onChange={e => {
                    setInputName(e.target.value)
                    setEditingName(true)
                    setError(null)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your name…"
                  maxLength={40}
                  className="profile-input-focus"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '18px',
                    color: '#2C1810',
                    background: '#FAF4E8',
                    border: `2px solid ${error ? '#dc2626' : '#E8D9C8'}`,
                    borderRadius: '6px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    marginBottom: error ? '8px' : '0',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#2D6A4F' }}
                  onBlur={e => { e.currentTarget.style.borderColor = error ? '#dc2626' : '#E8D9C8' }}
                />

                {error && (
                  <div style={{
                    fontFamily: '"Lora", serif', fontSize: '12px',
                    color: '#dc2626', marginBottom: '0',
                  }}>{error}</div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !inputName.trim()}
                  style={{
                    marginTop: '20px',
                    width: '100%',
                    padding: '16px',
                    background: isSubmitting || !inputName.trim()
                      ? '#8B9E92'
                      : '#2D6A4F',
                    color: '#FAF4E8',
                    border: 'none',
                    borderRadius: '6px',
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: isSubmitting || !inputName.trim() ? 'default' : 'pointer',
                    letterSpacing: '1px',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 16px rgba(45,106,79,0.25)',
                    opacity: !inputName.trim() ? 0.6 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!isSubmitting && inputName.trim())
                      e.currentTarget.style.background = '#3A8A63'
                  }}
                  onMouseLeave={e => {
                    if (!isSubmitting && inputName.trim())
                      e.currentTarget.style.background = '#2D6A4F'
                  }}
                >
                  {isSubmitting
                    ? 'Preparing your farm…'
                    : isReturning
                      ? `Begin Season One →`
                      : `Start My Farm Journey →`}
                </button>
              </div>
            </div>

            {/* Footer note */}
            <div className="profile-fade-up" style={{
              animationDelay: '0.15s', textAlign: 'center', marginTop: '20px',
              fontFamily: '"Lora", serif', fontSize: '11px',
              color: '#B89070', fontStyle: 'italic',
            }}>
              Your progress is saved automatically across sessions.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
