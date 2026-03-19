import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { PixelAnimal, PIXEL_SPRITES } from '../components/PixelAnimal'
import { AnimatedFarm } from '../components/AnimatedFarm'
import { StrategyAdvisor } from '../components/StrategyAdvisor'
import { UserProfileScreen } from '../components/UserProfileScreen'
import { ProfilePanel } from '../components/ProfilePanel'
import { ASSET_ANIMAL_MAP, type AnimalCategory } from '../data/assetAnimalMapping'
import { loadAllCsvData, type CsvDataMap, type MultiplierMap } from '../lib/csvLoader'
import {
  SESSION_START_DATE, TOTAL_ROUNDS, UNIT_COST,
  rollTimeSkips, pickEventsForRound,
  advanceDate, getTimeSkipLabel,
  calculateRoundPnl,
  formatPnl, formatPct, formatMonthYear,
  type PortfolioItem, type RoundResult,
} from '../lib/gameEngine'
import { getEventById } from '../data/events'

// ?? Pigs ??????????????????????????????????????????????????????????????????????
import BerkshirePig from '../../Images/Pigs/Berkshirepig.jpg'
import SwissPig from '../../Images/Pigs/Swisspig.jpg'
import MeishanPig from '../../Images/Pigs/Meishanpig.jpg'
import HampshirePig from '../../Images/Pigs/Hampshirepig.jpg'
import DurocPig from '../../Images/Pigs/Durocpig.jpg'
// ?? Guard Dogs ????????????????????????????????????????????????????????????????
import DogueBordeaux from '../../Images/GuardDogs/Doguedebordeaux.jpg'
import AmBulldog from '../../Images/GuardDogs/Americanbulldog.jpg'
import AmFoxhound from '../../Images/GuardDogs/Americanfoxhound.jpg'
import GermanShepherd from '../../Images/GuardDogs/Germanshepherd.jpg'
import DutchShepherd from '../../Images/GuardDogs/Dutchshepherd.jpg'
// ?? Horses ????????????????????????????????????????????????????????????????????
import AmQuarterHorse from '../../Images/Horses/Americanhorse.jpg'
import MorganHorse from '../../Images/Horses/Morganhorse.jpg'
import Mustang from '../../Images/Horses/Mustang.jpg'
import TaiwaneseHorse from '../../Images/Horses/Poney.jpg'
import Saddlebred from '../../Images/Horses/Saddleberghorse.jpg'
// ?? Cows (Bonds) ??????????????????????????????????????????????????????????????
import SwissCow from '../../Images/Cows/Swisscow.jpg'
import DevonCow from '../../Images/Cows/Devoncow.jpg'
import Bison from '../../Images/Cows/Bison.jpg'
import Yak from '../../Images/Cows/Yak.jpg'
import CharolaisCow from '../../Images/Cows/Charloraiscow.jpg'
import FleckviehCow from '../../Images/Cows/Fleckviehcow.jpg'
import BrahmanCow from '../../Images/Cows/Brahmancow.jpg'
// ?? Herbs (Pharma) ????????????????????????????????????????????????????????????
import Arnica from '../../Images/Herbs/Arnica.jpg'
import Gentian from '../../Images/Herbs/Gentian.jpg'
import Echinacea from '../../Images/Herbs/Echinacea.jpg'
import Rosehip from '../../Images/Herbs/Rosehip.jpg'
import ValerianRoot from '../../Images/Herbs/Valerianroot.jpg'
// ?? Cereals (Commodities) ?????????????????????????????????????????????????????
import AlpineBarley from '../../Images/Cereals/Barley.jpg'
import WhiteWheat from '../../Images/Cereals/Whitewheat.jpg'
import WinterWheat from '../../Images/Cereals/Winterwheat.png'
import YellowCorn from '../../Images/Cereals/Corn.jpg'
// ?? Tools (Crypto) ????????????????????????????????????????????????????????????
import HammerImg from '../../Images/Tools/Hammer.jpg'
import AxeImg from '../../Images/Tools/Axe.jpg'
import ChainsawImg from '../../Images/Tools/Chainsaw.jpg'
import RiceImg from '../../Images/Cereals/Rice.jpg'
// ?? Pixel Arts ????????????????????????????????????????????????????????????????
import PixelPig from '../../Images/PixelArts/Pixelpig.jpeg'
import PixelDog from '../../Images/PixelArts/Pixeldog.jpeg'
import PixelHorse from '../../Images/PixelArts/Pixelhorse.jpeg'
import PixelCow from '../../Images/PixelArts/Pixelcow.jpeg'

export const Route = createFileRoute('/')({
  component: LandingV2,
})

type GamePhase = 'profile' | 'selection' | 'locking' | 'round-active' | 'round-recap' | 'game-over'

// ?? Image lookup ????????????????????????????????????????????????????????????
const IMAGE_MAP: Record<string, string> = {
  // Pigs
  'Berkshire Pig': BerkshirePig,
  'Swiss Landrace Pig': SwissPig,
  'Meishan Pig': MeishanPig,
  'Hampshire Pig': HampshirePig,
  'American Duroc Pig': DurocPig,
  // Guard Dogs
  'Dogue de Bordeaux': DogueBordeaux,
  'American Bulldog': AmBulldog,
  'American Foxhound': AmFoxhound,
  'German Shepherd': GermanShepherd,
  'Dutch Shepherd': DutchShepherd,
  // Horses
  'American Quarter Horse': AmQuarterHorse,
  'Morgan Horse': MorganHorse,
  'Mustang': Mustang,
  'Taiwanese Pony': TaiwaneseHorse,
  'American Saddlebred': Saddlebred,
  // Bonds ? Cows
  'Swiss Cow': SwissCow,
  'American Milking Devon Cow': DevonCow,
  'Bison': Bison,
  'Yak': Yak,
  'Charolais Cow': CharolaisCow,
  'Fleckvieh Cow': FleckviehCow,
  'American Brahman Cow': BrahmanCow,
  // Herbs (Pharma)
  'Arnica': Arnica,
  'Gentian': Gentian,
  'Echinacea': Echinacea,
  'Rosehip': Rosehip,
  'Valerian Root': ValerianRoot,
  // Cereals (Commodities)
  'Alpine Barley': AlpineBarley,
  'Australian White Wheat': WhiteWheat,
  'French Soft Winter Wheat': WinterWheat,
  'American Yellow Corn': YellowCorn,
  // Tools (Crypto)
  'Hammer': HammerImg,
  'Axe': AxeImg,
  'Chainsaw': ChainsawImg,
  'Rice': RiceImg,
}

// Pixel art fallback map ? used in AnimatedFarm canvas for categories
// that don't have per-breed pixel sprites yet
const PIXEL_IMAGE_MAP: Record<string, string> = {
  'Pig': PixelPig,
  'Guard Dog': PixelDog,
  'Horse': PixelHorse,
  'Bovine': PixelCow,
}

// ?? Per-animal-category display metadata ????????????????????????????????????
const CATEGORY_META: Record<AnimalCategory, {
  emoji: string; badge: string; badgeColor: string; sectorLabel: string
}> = {
  'Pig': { emoji: '\u{1F437}', badge: 'FINANCE', badgeColor: '#1D5FA0', sectorLabel: 'Finance' },
  'Guard Dog': { emoji: '\u{1F415}', badge: 'DEFENSE', badgeColor: '#8B4513', sectorLabel: 'Defense' },
  'Horse': { emoji: '\u{1F434}', badge: 'TECH', badgeColor: '#6D28D9', sectorLabel: 'Tech' },
  'Medicinal Plant': { emoji: '\u{1F33F}', badge: 'PHARMA', badgeColor: '#2D6A4F', sectorLabel: 'Pharma' },
  'Grain Crop': { emoji: '\u{1F33E}', badge: 'COMMODITIES', badgeColor: '#B8860B', sectorLabel: 'Commodities' },
  'Bovine': { emoji: '\u{1F404}', badge: 'BONDS', badgeColor: '#2D6A4F', sectorLabel: 'Bonds' },
  'Collective': { emoji: '\u{1F3E1}', badge: 'ETF', badgeColor: '#475569', sectorLabel: 'ETFs' },
  'Tool': { emoji: '\u26CF\uFE0F', badge: 'CRYPTO', badgeColor: '#6D28D9', sectorLabel: 'Crypto' },
  'Hedge': { emoji: '\u{1FAB4}', badge: 'HEDGE', badgeColor: '#B8860B', sectorLabel: 'Hedge' },
}

function multiplierToRisk(m: number): number {
  if (m <= 0.25) return 1
  if (m <= 1) return 2
  if (m <= 2.5) return 3
  if (m <= 4) return 4
  return 5
}

// ?? Build flat livestock list ????????????????????????????????????????????????
const LIVESTOCK = Object.entries(ASSET_ANIMAL_MAP)
  .filter(([, m]) => !m.animal.includes('TBD'))
  .map(([assetName, m]) => {
    const meta = CATEGORY_META[m.animalCategory]
    return {
      id: assetName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      assetName,
      animalName: m.animal,
      animalCategory: m.animalCategory,
      sector: m.sector,
      image: IMAGE_MAP[m.animal] ?? null,
      multiplier: m.multiplier,
      returnProfile: m.returnProfile,
      risk: multiplierToRisk(m.multiplier),
      ...meta,
    }
  })

// ?? Asset-type tab config ????????????????????????????????????????????????????
type AssetType = 'Stock' | 'Bond' | 'ETF' | 'Crypto' | 'Hedge'

const ASSET_TYPE_META: Record<AssetType, { emoji: string; label: string; color: string }> = {
  Stock: { emoji: '\u{1F4C8}', label: 'Stock', color: '#C4622D' },
  Bond: { emoji: '\u{1F3E6}', label: 'Bond', color: '#2D6A4F' },
  ETF: { emoji: '\u{1F4CA}', label: 'ETF', color: '#475569' },
  Crypto: { emoji: '\u26CF\uFE0F', label: 'Crypto', color: '#6D28D9' },
  Hedge: { emoji: '\u{1F947}', label: 'Hedge', color: '#B8860B' },
}

function resolveAssetType(sector: string): AssetType {
  if (sector === 'Bond') return 'Bond'
  if (sector === 'ETF') return 'ETF'
  if (sector === 'Crypto') return 'Crypto'
  if (sector === 'Hedge') return 'Hedge'
  return 'Stock'
}

const LIVESTOCK_TYPED = LIVESTOCK.map(a => ({
  ...a,
  assetType: resolveAssetType(a.sector ?? ''),
}))

const ASSET_TYPE_ORDER: AssetType[] = ['Stock', 'Bond', 'ETF', 'Crypto', 'Hedge']

// Animal group tabs (shown before financial info is unlocked)
type AnimalGroupTab = 'livestock' | 'harvest' | 'specialty'

const ANIMAL_GROUP_META: Record<AnimalGroupTab, {
  emoji: string; label: string; color: string; categories: AnimalCategory[]
}> = {
  livestock: { emoji: '\u{1F404}', label: 'Livestock', color: '#8B4513', categories: ['Pig', 'Guard Dog', 'Horse', 'Bovine'] },
  harvest:   { emoji: '\u{1F33E}', label: 'Harvest',   color: '#2D6A4F', categories: ['Medicinal Plant', 'Grain Crop'] },
  specialty: { emoji: '\u{1F3E1}', label: 'Specialty', color: '#475569', categories: ['Collective', 'Tool', 'Hedge'] },
}
const ANIMAL_GROUP_ORDER: AnimalGroupTab[] = ['livestock', 'harvest', 'specialty']

const ANIMAL_SUBGROUPS: Record<AnimalGroupTab, Array<{ category: AnimalCategory; emoji: string; label: string; color: string }>> = {
  livestock: [
    { category: 'Pig',       emoji: '\u{1F437}', label: 'Swine',        color: '#A0522D' },
    { category: 'Guard Dog', emoji: '\u{1F415}', label: 'Working Dogs', color: '#795548' },
    { category: 'Horse',     emoji: '\u{1F434}', label: 'Horses',       color: '#6D4C41' },
    { category: 'Bovine',    emoji: '\u{1F404}', label: 'Bovine',       color: '#558B2F' },
  ],
  harvest: [
    { category: 'Medicinal Plant', emoji: '\u{1F33F}', label: 'Medicinal Plants', color: '#388E3C' },
    { category: 'Grain Crop',      emoji: '\u{1F33E}', label: 'Grain Crops',      color: '#B8860B' },
  ],
  specialty: [
    { category: 'Collective', emoji: '\u{1F3E1}', label: 'Collective', color: '#546E7A' },
    { category: 'Tool',       emoji: '\u26CF\uFE0F', label: 'Tools',   color: '#4E342E' },
    { category: 'Hedge',      emoji: '\u{1FAB4}', label: 'Hedge',      color: '#43A047' },
  ],
}

// Badge labels / colors for locked mode (animal-themed, not financial)
const LOCKED_BADGE_META: Record<AnimalCategory, { badge: string; color: string }> = {
  'Pig':             { badge: 'SWINE',       color: '#A0522D' },
  'Guard Dog':       { badge: 'WORKING DOG', color: '#795548' },
  'Horse':           { badge: 'EQUINE',      color: '#6D4C41' },
  'Medicinal Plant': { badge: 'MEDICINAL',   color: '#388E3C' },
  'Grain Crop':      { badge: 'GRAIN',       color: '#B8860B' },
  'Bovine':          { badge: 'BOVINE',      color: '#558B2F' },
  'Collective':      { badge: 'COLLECTIVE',  color: '#546E7A' },
  'Tool':            { badge: 'TOOLS',       color: '#4E342E' },
  'Hedge':           { badge: 'HEDGE',       color: '#43A047' },
}

// ?? Stock sub-groups ?????????????????????????????????????????????????????????
const STOCK_SUBGROUPS = [
  { sector: 'Finance', emoji: '\u{1F437}', label: 'Finance', color: '#1D5FA0' },
  { sector: 'Defense', emoji: '\u{1F415}', label: 'Defense', color: '#8B4513' },
  { sector: 'Tech', emoji: '\u{1F434}', label: 'Tech', color: '#6D28D9' },
  { sector: 'Pharma', emoji: '\u{1F33F}', label: 'Pharma', color: '#2D6A4F' },
  { sector: 'Commodities', emoji: '\u{1F33E}', label: 'Commodities', color: '#B8860B' },
]

// ?? Helpers ??????????????????????????????????????????????????????????????????
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

type LivestockItem = typeof LIVESTOCK_TYPED[number]

function AnimalCard({
  animal, idx, selected, expanded, onAdjust, onExpand, financialUnlocked = true,
}: {
  animal: LivestockItem
  idx: number
  selected: Record<string, number>
  expanded: string | null
  onAdjust: (id: string, delta: number) => void
  onExpand: (id: string) => void
  financialUnlocked?: boolean
}) {
  const count = selected[animal.id] ?? 0
  const isExpanded = expanded === animal.id
  return (
    <div
      className="v2-card emerge"
      style={{
        background: count > 0 ? 'white' : '#FEFCF7',
        border: `1px solid ${count > 0 ? '#C4622D' : '#E8D9C8'}`,
        borderRadius: '8px', padding: '14px 16px',
        animationDelay: `${idx * 0.05}s`,
        boxShadow: count > 0 ? '0 4px 20px rgba(196,98,45,0.15)' : '0 2px 8px rgba(44,24,16,0.05)',
        cursor: 'pointer',
      }}
      onClick={() => onExpand(animal.id)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>

        {/* Thumbnail */}
        <div style={{
          width: '52px', height: '52px', borderRadius: '6px', overflow: 'hidden',
          flexShrink: 0, background: '#F0E8D4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #E8D9C8',
        }}>
          {animal.image ? (
            <img src={animal.image} alt={animal.animalName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span className="v2-animal-emoji"
              style={{ fontSize: '28px', animationDelay: `${idx * 0.5}s` }}>
              {animal.emoji}
            </span>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '15px', fontWeight: 700, color: '#2C1810',
            }}>{animal.animalName}</span>
            {(() => {
              const bLabel = financialUnlocked ? animal.badge : LOCKED_BADGE_META[animal.animalCategory].badge
              const bColor = financialUnlocked ? animal.badgeColor : LOCKED_BADGE_META[animal.animalCategory].color
              return (
                <span style={{
                  fontSize: '9px', padding: '2px 6px', borderRadius: '2px',
                  background: `${bColor}15`, color: bColor,
                  letterSpacing: '1px', fontFamily: '"Lora", serif',
                  border: `1px solid ${bColor}30`, whiteSpace: 'nowrap',
                }}>{bLabel}</span>
              )
            })()}
          </div>
          {financialUnlocked ? (
            <div style={{
              fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50',
              display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
            }}>
              {animal.animalCategory !== 'Hedge' && <span>{animal.assetName}</span>}
              <span>{animal.returnProfile}</span>
            </div>
          ) : (
            <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#B89070', fontStyle: 'italic' }}>
              Seasonal breed ? farm performance
            </div>
          )}
          <div style={{ marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#B89070', fontFamily: '"Lora", serif' }}>Risk:</span>
            <RiskDots level={animal.risk} />
          </div>
        </div>

        {/* Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}>
          <button onClick={() => onAdjust(animal.id, -1)} style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'transparent', border: '1.5px solid #E8D9C8', color: '#8B6B50',
            cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.color = '#C4622D' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8D9C8'; e.currentTarget.style.color = '#8B6B50' }}
          >&minus;</button>
          <span style={{
            fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 700,
            color: count > 0 ? '#C4622D' : '#D4BFA8', minWidth: '22px', textAlign: 'center',
          }}>{count}</span>
          <button onClick={() => onAdjust(animal.id, 1)} style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: count > 0 ? '#C4622D' : 'transparent',
            border: '1.5px solid #C4622D', color: count > 0 ? '#FAF4E8' : '#C4622D',
            cursor: 'pointer', fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }}>+</button>
        </div>
      </div>

      {isExpanded && (
        <div style={{
          marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E8D9C8',
          fontFamily: '"Lora", serif', fontSize: '12px',
          color: '#6B4E37', lineHeight: 1.7, fontStyle: 'italic',
        }}>
          {financialUnlocked ? (
            <>
              <strong style={{ fontStyle: 'normal' }}>{animal.animalName}</strong> represents{' '}
              <strong style={{ fontStyle: 'normal' }}>{animal.assetName}</strong>, a{' '}
              {animal.sectorLabel.toLowerCase()} asset. Its performance in the game mirrors
              real historical price data from the markets.
            </>
          ) : (
            <>
              <strong style={{ fontStyle: 'normal' }}>{animal.animalName}</strong> is a prized
              breed on the farm. Its growth is shaped by world events and seasonal forces ?
              build your herd wisely and diversity will see you through any storm.
            </>
          )}
        </div>
      )}
    </div>
  )
}


// ?? Locking overlay ??????????????????????????????????????????????????????????
function LockOverlay({ phase, round }: { phase: GamePhase; round: number }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Dark vignette */}
      <div className="lock-vignette" style={{
        position: 'absolute', inset: 0,
        background: 'rgba(20,12,8,0.78)',
        animation: 'vignetteIn 0.45s ease forwards',
      }} />

      {/* Ornate frame */}
      <div className="lock-frame" style={{
        position: 'absolute',
        inset: '24px',
        border: '3px solid #F5C842',
        borderRadius: '6px',
        boxShadow: '0 0 0 1px rgba(245,200,66,0.3), inset 0 0 0 1px rgba(245,200,66,0.2), 0 0 60px rgba(245,200,66,0.12)',
        animation: 'frameReveal 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.25s both',
      }}>
        {(['tl', 'tr', 'bl', 'br'] as const).map(pos => (
          <div key={pos} style={{
            position: 'absolute',
            width: '20px', height: '20px',
            borderColor: '#F5C842',
            borderStyle: 'solid',
            borderWidth: pos === 'tl' ? '2px 0 0 2px' : pos === 'tr' ? '2px 2px 0 0' : pos === 'bl' ? '0 0 2px 2px' : '0 2px 2px 0',
            top: pos.startsWith('t') ? '-4px' : undefined,
            bottom: pos.startsWith('b') ? '-4px' : undefined,
            left: pos.endsWith('l') ? '-4px' : undefined,
            right: pos.endsWith('r') ? '-4px' : undefined,
          }} />
        ))}
      </div>

      {phase === 'locking' && (
        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center',
          animation: 'stampIn 0.5s cubic-bezier(0.34,1.4,0.64,1) 0.6s both',
        }}>
          <div style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '13px', letterSpacing: '8px', color: '#F5C842',
            opacity: 0.7, textTransform: 'uppercase', marginBottom: '6px',
          }}>Portfolio Locked</div>
          <div style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '52px', fontWeight: 900, color: '#FAF4E8',
            letterSpacing: '3px', lineHeight: 1,
            textShadow: '0 4px 32px rgba(245,200,66,0.4), 2px 2px 0 rgba(20,12,8,0.6)',
          }}>ROUND {round}</div>
          <div style={{
            fontFamily: '"Lora", serif', fontSize: '12px',
            color: '#A8D5B8', letterSpacing: '4px', textTransform: 'uppercase',
            marginTop: '8px',
          }}>of {TOTAL_ROUNDS} ? The Harvest Begins</div>
        </div>
      )}
    </div>
  )
}


// ?? Main component ????????????????????????????????????????????????????????????
export default function LandingV2() {
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AssetType>('Stock')
  const [gamePhase, setGamePhase] = useState<GamePhase>('profile')

  // User / game identity
  const [userName, setUserName]             = useState('')
  const [currentUserId, setCurrentUserId]   = useState<Id<'users'> | null>(null)
  const [currentGameId, setCurrentGameId]   = useState<Id<'games'> | null>(null)
  const [profilePanelOpen, setProfilePanelOpen] = useState(false)
  const [financialUnlocked, setFinancialUnlocked] = useState(
    () => localStorage.getItem('leog_finance_unlocked') === '1'
  )
  const [activeAnimalTab, setActiveAnimalTab] = useState<AnimalGroupTab>('livestock')

  // Convex mutations
  const createGameMutation     = useMutation(api.games.createGame)
  const saveRoundMutation      = useMutation(api.rounds.saveRound)
  const completeGameMutation   = useMutation(api.games.completeGame)
  const updateUserStatsMutation = useMutation(api.users.updateUserStats)

  // CSV data
  const [csvData, setCsvData] = useState<CsvDataMap | null>(null)
  const [multiplierMap, setMultiplierMap] = useState<MultiplierMap>(new Map())
  const [csvLoading, setCsvLoading] = useState(true)

  // Round system
  const [currentRound, setCurrentRound]       = useState(1)
  const [currentCsvDate, setCurrentCsvDate]   = useState<Date>(SESSION_START_DATE)
  const [roundTimeSkips, setRoundTimeSkips]   = useState<number[]>([])
  const [roundEventIds, setRoundEventIds]     = useState<number[][]>([])
  const [roundHistory, setRoundHistory]       = useState<RoundResult[]>([])
  const [currentResult, setCurrentResult]     = useState<RoundResult | null>(null)
  const [portfolioValue, setPortfolioValue]   = useState(1000)

  // Round-active animation step: 'time-skip' ? 'event-1' ? 'event-2'
  const [activeStep, setActiveStep] = useState<'time-skip' | 'event-1' | 'event-2'>('time-skip')

  // Budget: $1000 for round 1, then carry-over value (floored to nearest unit cost)
  const budget = currentRound === 1 ? 1000 : Math.floor(portfolioValue / UNIT_COST) * UNIT_COST
  const totalUnits = Object.values(selected).reduce((a, b) => a + b, 0)
  const spent = totalUnits * UNIT_COST

  // Load all CSV data on mount
  useEffect(() => {
    loadAllCsvData()
      .then(({ csvData: data, multiplierMap: mmap }) => {
        setCsvData(data)
        setMultiplierMap(mmap)
        setCsvLoading(false)
      })
      .catch(err => { console.error('CSV load error:', err); setCsvLoading(false) })
  }, [])

  function adjust(id: string, delta: number) {
    setSelected(prev => {
      const curr = prev[id] ?? 0
      const next = Math.max(0, curr + delta)
      // Budget cap: reject if adding would exceed budget
      if (delta > 0) {
        const newSpent = Object.entries(prev).reduce((s, [k, v]) => s + (k === id ? next : v) * UNIT_COST, 0)
        if (newSpent > budget) return prev
      }
      if (next === 0) { const { [id]: _, ...rest } = prev; return rest }
      return { ...prev, [id]: next }
    })
  }

  function toggleExpand(id: string) {
    setExpanded(prev => prev === id ? null : id)
  }

  const tabItems = (type: AssetType) => LIVESTOCK_TYPED.filter(a => a.assetType === type)
  const tabSelectedCount = (type: AssetType) =>
    tabItems(type).filter(a => (selected[a.id] ?? 0) > 0).length

  /** Convert the selection (id ? count) to PortfolioItem[] for the engine */
  function buildPortfolioItems(): PortfolioItem[] {
    return Object.entries(selected).map(([id, units]) => {
      const a = LIVESTOCK.find(l => l.id === id)!
      return {
        assetName: a.assetName,
        animalName: a.animalName,
        animalCategory: a.animalCategory,
        units,
        multiplier: a.multiplier,
      }
    })
  }

  function handleLock() {
    // Pre-roll all 7 time skips on the very first lock (they don't depend on portfolio)
    if (currentRound === 1 && roundTimeSkips.length === 0) {
      setRoundTimeSkips(rollTimeSkips())
    }

    // Pick 2 events for THIS round weighted by how many units the player holds
    // in each affected asset ? heavier positions attract more news.
    const eventIdsForRound = pickEventsForRound(buildPortfolioItems(), 2)
    setRoundEventIds(prev => {
      const updated = [...prev]
      updated[currentRound - 1] = eventIdsForRound
      return updated
    })

    setActiveStep('time-skip')
    setGamePhase('locking')
    setTimeout(() => setGamePhase('round-active'), 1800)
  }

  // Sequence the round-active animation steps: time-skip ? event-1
  useEffect(() => {
    if (gamePhase !== 'round-active') return
    setActiveStep('time-skip')
    const t1 = setTimeout(() => setActiveStep('event-1'), 2000)
    return () => { clearTimeout(t1) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase])

  /** Advance from event-1 card to event-2 card */
  function handleNextEvent() {
    setActiveStep('event-2')
  }

  /** Calculate P&L from both events and move to recap */
  function handleEventContinue() {
    if (!csvData) { setGamePhase('round-recap'); return }
    const roundIdx  = currentRound - 1
    const skipDays  = roundTimeSkips[roundIdx] ?? 30
    const eventIds  = roundEventIds[roundIdx] ?? [1]
    const startDate = currentCsvDate
    const endDate = advanceDate(currentCsvDate, skipDays)
    const portfolio = buildPortfolioItems()
    const events    = eventIds.map(id => getEventById(id))
    const result    = calculateRoundPnl(
      currentRound, events, portfolio,
      startDate, endDate, skipDays,
      csvData, multiplierMap, portfolioValue,
    )
    setCurrentResult(result)
    setGamePhase('round-recap')
  }

  const handleBeginGame = useCallback(async (userId: Id<'users'>, name: string) => {
    setCurrentUserId(userId)
    setUserName(name)
    try {
      const gameId = await createGameMutation({ userId })
      setCurrentGameId(gameId)
    } catch (err) {
      console.error('Failed to create game record:', err)
    }
    setGamePhase('selection')
  }, [createGameMutation])

  function handleRoundComplete() {
    if (!currentResult) return
    const newHistory = [...roundHistory, currentResult]
    setRoundHistory(newHistory)
    setPortfolioValue(currentResult.portfolioValueAfter)
    // Advance the CSV cursor
    setCurrentCsvDate(currentResult.endDate)

    // Persist round to Convex
    if (currentUserId && currentGameId) {
      saveRoundMutation({
        gameId: currentGameId,
        userId: currentUserId,
        roundNumber: currentResult.round,
        portfolioValueBefore: currentResult.portfolioValueBefore,
        portfolioValueAfter: currentResult.portfolioValueAfter,
        totalPnl: currentResult.totalPnl,
        startDate: currentResult.startDate.toISOString(),
        endDate: currentResult.endDate.toISOString(),
        timeSkipDays: currentResult.timeSkipDays,
        eventIds: currentResult.eventIds,
        portfolioChoices: currentResult.assetResults.map(r => ({
          assetName: r.assetName,
          animalName: r.animalName,
          units: r.units,
        })),
        assetResults: currentResult.assetResults.map(r => ({
          assetName: r.assetName,
          animalName: r.animalName,
          animalCategory: r.animalCategory as string,
          units: r.units,
          multiplier: r.multiplier,
          startPrice: r.startPrice ?? undefined,
          endPrice: r.endPrice ?? undefined,
          rawPct: r.rawPct,
          effectivePct: r.effectivePct,
          eventBonusPct: r.eventBonusPct,
          isEventAffected: r.isEventAffected,
          dollarPnl: r.dollarPnl,
        })),
      }).catch(err => console.error('Failed to save round:', err))
    }

    if (currentRound >= TOTAL_ROUNDS) {
      // Persist game completion
      if (currentUserId && currentGameId) {
        const finalValue = currentResult.portfolioValueAfter
        const totalPnlAll = newHistory.reduce((s, r) => s + r.totalPnl, 0)
        completeGameMutation({
          gameId: currentGameId,
          finalPortfolioValue: finalValue,
          totalPnl: totalPnlAll,
        }).catch(err => console.error('Failed to complete game:', err))
        updateUserStatsMutation({
          userId: currentUserId,
          finalPortfolioValue: finalValue,
          roundsPlayed: newHistory.length,
        }).catch(err => console.error('Failed to update user stats:', err))
      }
      setGamePhase('game-over')
    } else {
      setCurrentRound(r => r + 1)
      setGamePhase('selection')
    }
  }

  async function handleRestart() {
    setSelected({})
    setCurrentRound(1)
    setCurrentCsvDate(SESSION_START_DATE)
    setRoundTimeSkips([])
    setRoundEventIds([])
    setRoundHistory([])
    setCurrentResult(null)
    setPortfolioValue(1000)
    setActiveTab('Stock')

    // Create a new game for the same player (skips profile screen)
    if (currentUserId) {
      try {
        const gameId = await createGameMutation({ userId: currentUserId })
        setCurrentGameId(gameId)
      } catch (err) {
        console.error('Failed to create new game record:', err)
        setCurrentGameId(null)
      }
      setGamePhase('selection')
    } else {
      setGamePhase('profile')
    }
  }

  function handleUnlock() {
    localStorage.setItem('leog_finance_unlocked', '1')
    setFinancialUnlocked(true)
  }

  const isLocking = gamePhase === 'locking'
  const isSelection = gamePhase === 'selection' || gamePhase === 'locking'

  // Computed values used in render
  const roundSkipDays = roundTimeSkips[currentRound - 1] ?? 30
  const roundSkipLabel = getTimeSkipLabel(roundSkipDays)
  const currentEventIds = roundEventIds[currentRound - 1] ?? []
  const currentEvents   = currentEventIds.map(id => getEventById(id))
  const currentEvent    = currentEvents[0] ?? null
  const lastResult = roundHistory[roundHistory.length - 1] ?? null

  return (
    <div style={{ minHeight: '100vh', background: '#FAF4E8', color: '#2C1810', fontFamily: '"Georgia", serif' }}>

      {/* ?? Profile Phase ??????????????????????????????????????????????????????? */}
      {gamePhase === 'profile' && (
        <UserProfileScreen onBegin={handleBeginGame} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lora:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .v2-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .v2-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(44,24,16,0.12) !important; }

        @keyframes emerge {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .emerge { animation: emerge 0.4s ease forwards; opacity: 0; }

        @keyframes bob {
          0%,100% { transform:translateY(0) rotate(-1deg); }
          50%      { transform:translateY(-6px) rotate(1deg); }
        }
        .v2-animal-emoji { animation: bob 4s ease-in-out infinite; display:inline-block; }

        /* Lock transition keyframes */
        @keyframes lockFadeUp {
          from { opacity:1; transform:translateY(0); }
          to   { opacity:0; transform:translateY(-24px); }
        }
        @keyframes vignetteIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes frameReveal {
          from { opacity:0; transform:scale(0.88); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes stampIn {
          from { opacity:0; transform:scale(1.35); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes seasonReveal {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes eventPop {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .lock-fade-up {
          animation: lockFadeUp 0.35s ease forwards;
        }
        .season-reveal {
          animation: seasonReveal 0.5s ease 0.1s both;
        }
        .event-pop {
          animation: eventPop 0.4s cubic-bezier(0.34,1.2,0.64,1) both;
        }

        @keyframes farmPulseRing {
          0%   { transform: scale(0.92); opacity: 0.9; }
          60%  { transform: scale(1.06); opacity: 0.4; }
          100% { transform: scale(1.12); opacity: 0; }
        }
        .farm-pulse-ring {
          animation: farmPulseRing 1.2s ease-out forwards;
        }
        @keyframes eventBadgePop {
          0%   { opacity: 0; transform: scale(0.6) translateY(8px); }
          60%  { opacity: 1; transform: scale(1.1) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .event-badge-pop {
          animation: eventBadgePop 0.45s cubic-bezier(0.34,1.4,0.64,1) forwards;
        }

        @keyframes diceFlicker {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.6; transform:scale(0.96) rotateX(12deg); }
        }
        .dice-flicker { animation: diceFlicker 0.18s ease-in-out infinite; }

        @keyframes slideUp {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .slide-up { animation: slideUp 0.55s cubic-bezier(0.34,1.3,0.64,1) both; }

        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        .fade-in { animation: fadeIn 0.5s ease both; }

        @keyframes pnlCardIn {
          from { opacity:0; transform:translateX(-12px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .pnl-card-in { animation: pnlCardIn 0.4s ease both; }

        @keyframes counterUp {
          from { opacity:0; transform:translateY(8px) scale(0.9); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .counter-up { animation: counterUp 0.6s cubic-bezier(0.34,1.4,0.64,1) both; }
      `}</style>

      {/* ?? Round-Active Phase ??????????????????????????????????????????????? */}
      {gamePhase === 'round-active' && currentEvent && (
        <div style={{
          minHeight: '100vh', background: '#1C1008', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Subtle grid texture */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(90deg, transparent 0, transparent 80px, rgba(245,200,66,0.02) 80px, rgba(245,200,66,0.02) 81px), repeating-linear-gradient(0deg, transparent 0, transparent 80px, rgba(245,200,66,0.02) 80px, rgba(245,200,66,0.02) 81px)',
            pointerEvents: 'none',
          }} />

          {/* Round badge */}
          <div className="slide-up" style={{ animationDelay: '0s', textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-block',
              border: '1px solid rgba(245,200,66,0.3)', borderRadius: '2px',
              padding: '6px 20px', marginBottom: '12px',
              fontFamily: '"Lora", serif', fontSize: '11px',
              color: '#A8D5B8', letterSpacing: '4px', textTransform: 'uppercase',
            }}>Season One</div>
            <div style={{
              fontFamily: '"Playfair Display", serif', fontSize: '42px',
              fontWeight: 900, color: '#FAF4E8', letterSpacing: '2px', lineHeight: 1,
              textShadow: '0 4px 32px rgba(245,200,66,0.3)',
            }}>Round {currentRound} of {TOTAL_ROUNDS}</div>
          </div>

          {/* Time-skip reveal */}
          <div className="slide-up" style={{ animationDelay: '0.2s', textAlign: 'center', marginBottom: '48px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '16px',
              background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)',
              borderRadius: '8px', padding: '24px 40px',
            }}>
              <span style={{ fontSize: '36px' }}>??</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontFamily: '"Lora", serif', fontSize: '11px',
                  color: '#A8D5B870', letterSpacing: '3px', textTransform: 'uppercase',
                  marginBottom: '6px',
                }}>Time Passing</div>
                <div style={{
                  fontFamily: '"Playfair Display", serif', fontSize: '28px',
                  fontWeight: 700, color: '#F5C842',
                }}>
                  {activeStep === 'time-skip'
                    ? <span className="dice-flicker">Rolling?</span>
                    : roundSkipLabel}
                </div>
                {(activeStep === 'event-1' || activeStep === 'event-2') && (
                  <div className="fade-in" style={{
                    fontFamily: '"Lora", serif', fontSize: '12px',
                    color: '#A8D5B8', marginTop: '4px',
                  }}>
                    {formatMonthYear(currentCsvDate)} ? {formatMonthYear(advanceDate(currentCsvDate, roundSkipDays))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event reveal ? step 1 or step 2 */}
          {(activeStep === 'event-1' || activeStep === 'event-2') && (() => {
            const evIdx  = activeStep === 'event-1' ? 0 : 1
            const ev     = currentEvents[evIdx]
            const isLast = activeStep === 'event-2'
            if (!ev) return null
            return (
              <div key={activeStep} className="slide-up" style={{ animationDelay: '0s', textAlign: 'center', maxWidth: '560px', width: '100%' }}>
                {/* Step indicator + sentiment badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    fontFamily: '"Lora", serif', fontSize: '10px',
                    color: '#A8D5B870', letterSpacing: '3px', textTransform: 'uppercase',
                  }}>Event {evIdx + 1} of 2</div>
                  <div style={{
                    background: ev.isPositive ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                    border: `1px solid ${ev.isPositive ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)'}`,
                    borderRadius: '4px', padding: '2px 10px',
                    fontFamily: '"Lora", serif', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
                    color: ev.isPositive ? '#4ade80' : '#f87171', fontWeight: 600,
                  }}>{ev.isPositive ? '? Positive' : '? Negative'}</div>
                </div>

                {/* Main card */}
                <div style={{
                  background: `${ev.color}12`,
                  border: `1.5px solid ${ev.color}50`,
                  borderRadius: '10px', padding: '28px 32px',
                  boxShadow: `0 8px 48px ${ev.color}25`,
                  textAlign: 'left',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '38px', lineHeight: 1, flexShrink: 0 }}>{ev.icon}</div>
                    <div>
                      <div style={{
                        fontFamily: '"Playfair Display", serif', fontSize: '20px',
                        fontWeight: 700, color: '#FAF4E8', lineHeight: 1.25, marginBottom: '6px',
                      }}>{ev.title}</div>
                      <div style={{
                        display: 'inline-block',
                        background: `${ev.color}20`, border: `1px solid ${ev.color}40`,
                        borderRadius: '4px', padding: '2px 10px',
                        fontFamily: '"Lora", serif', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase',
                        color: `${ev.color}DD`,
                      }}>{ev.impactLabel}</div>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: `${ev.color}25`, marginBottom: '16px' }} />

                  <div style={{
                    fontFamily: '"Lora", serif', fontSize: '14px',
                    color: '#D4C9B4', lineHeight: 1.8,
                  }}>{ev.description}</div>

                  <div style={{ marginTop: '20px' }}>
                    <div style={{
                      fontFamily: '"Lora", serif', fontSize: '10px',
                      color: '#A8D5B860', letterSpacing: '2px', textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}>Assets Affected</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {ev.affectedAnimalNames.map(name => (
                        <span key={name} style={{
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '4px', padding: '3px 10px',
                          fontFamily: '"Lora", serif', fontSize: '11px', color: '#A8D5B8CC',
                        }}>{name}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="fade-in" style={{ marginTop: '28px', animationDelay: '0.4s' }}>
                  <button
                    onClick={isLast ? handleEventContinue : handleNextEvent}
                    style={{
                      background: ev.isPositive
                        ? 'linear-gradient(135deg, #2D6A4F, #1a4a35)'
                        : 'linear-gradient(135deg, #7C2D12, #4a1508)',
                      border: `1.5px solid ${ev.isPositive ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)'}`,
                      borderRadius: '6px', padding: '14px 40px',
                      fontFamily: '"Lora", serif', fontSize: '13px', letterSpacing: '2px',
                      textTransform: 'uppercase', color: '#FAF4E8', cursor: 'pointer',
                      fontWeight: 600, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.9' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                  >
                    {isLast ? 'See Results ?' : 'Next Event ?'}
                  </button>
                  <div style={{
                    marginTop: '10px', fontFamily: '"Lora", serif', fontSize: '10px',
                    color: '#A8D5B840', letterSpacing: '1px',
                  }}>{isLast ? 'Take your time ? press when ready' : 'One more event to read'}</div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ?? Round-Recap Phase ????????????????????????????????????????????????? */}
      {gamePhase === 'round-recap' && currentResult && (
        <div style={{ minHeight: '100vh', background: '#FAF4E8', display: 'flex', flexDirection: 'column' }}>

          {/* Header bar */}
          <div style={{
            background: '#2C1810', padding: '0 40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: '64px', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
              <span style={{
                fontFamily: '"Playfair Display", serif', fontSize: '20px',
                fontWeight: 900, color: '#F5C842', letterSpacing: '1px',
              }}>Round {currentRound} ? Results</span>
              <span style={{
                fontFamily: '"Lora", serif', fontSize: '10px',
                color: '#A8D5B870', letterSpacing: '3px', textTransform: 'uppercase',
              }}>of {TOTAL_ROUNDS}</span>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              {[
                { label: 'Time Passed', value: getTimeSkipLabel(currentResult.timeSkipDays) },
                { label: 'Round P&L', value: formatPnl(currentResult.totalPnl) },
                { label: 'Portfolio Now', value: `$${currentResult.portfolioValueAfter.toFixed(0)}` },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#A8D5B8', letterSpacing: '1.5px', fontFamily: '"Lora", serif', textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{
                    fontFamily: '"Playfair Display", serif', fontSize: '15px',
                    color: s.label === 'Round P&L'
                      ? currentResult.totalPnl >= 0 ? '#4ADE80' : '#F87171'
                      : '#FAF4E8',
                    fontWeight: 700, lineHeight: 1.2,
                  }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Body: two columns */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', overflow: 'hidden' }}>

            {/* LEFT: per-asset P&L */}
            <div style={{ overflowY: 'auto', padding: '32px 40px 48px', borderRight: '1px solid #E8D9C8' }}>
              {/* Event chips ? one per event */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                {currentEvents.map(ev => (
                  <div key={ev.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: `${ev.color}12`, border: `1px solid ${ev.color}35`,
                    borderRadius: '4px', padding: '6px 14px',
                  }}>
                    <span>{ev.icon}</span>
                    <span style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#2C1810', fontWeight: 600 }}>
                      {ev.title}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '18px', fontWeight: 700, color: '#2C1810', marginBottom: '20px' }}>
                Your Livestock This Round
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentResult.assetResults.map((r, i) => {
                  const meta = CATEGORY_META[r.animalCategory]
                  const isPos = r.dollarPnl >= 0
                  return (
                    <div
                      key={r.assetName}
                      className="pnl-card-in"
                      style={{
                        animationDelay: `${i * 0.06}s`,
                        display: 'flex', alignItems: 'center', gap: '14px',
                        background: 'white', border: `1px solid ${isPos ? '#bbf7d030' : '#fecaca30'}`,
                        borderLeft: `3px solid ${isPos ? '#22c55e' : '#ef4444'}`,
                        borderRadius: '8px', padding: '14px 16px',
                        boxShadow: '0 2px 8px rgba(44,24,16,0.05)',
                      }}
                    >
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '6px',
                        background: '#F0E8D4', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', border: '1px solid #E8D9C8',
                      }}>
                        {meta.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '14px', fontWeight: 700, color: '#2C1810' }}>
                          {r.animalName}
                        </div>
                        <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50' }}>
                          {r.assetName} ? {r.units} unit{r.units !== 1 ? 's' : ''}
                          {r.isEventAffected && (
                            <span style={{
                              color: r.eventBonusPct >= 0 ? '#16a34a' : '#dc2626',
                              marginLeft: '6px',
                              fontWeight: 600,
                            }}>
                              {currentEvent?.icon} {r.eventBonusPct >= 0 ? '+' : ''}{(r.eventBonusPct * 100).toFixed(2)}%
                            </span>
                          )}
                        </div>
                        {r.startPrice != null && r.endPrice != null && (
                          <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#B89070', marginTop: '2px' }}>
                            {r.startPrice.toFixed(2)} ? {r.endPrice.toFixed(2)}
                          </div>
                        )}
                        {r.startPrice == null && (
                          <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#B89070', marginTop: '2px', fontStyle: 'italic' }}>
                            No price data available
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{
                          fontFamily: '"Playfair Display", serif', fontSize: '16px',
                          fontWeight: 700, color: isPos ? '#22c55e' : '#ef4444',
                        }}>{formatPnl(r.dollarPnl)}</div>
                        <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: isPos ? '#22c55e' : '#ef4444', opacity: 0.8 }}>
                          {formatPct(r.effectivePct)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RIGHT: summary panel */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '32px 28px', background: '#F7F0E4', gap: '20px', overflowY: 'auto' }}>

              {/* Total P&L card */}
              <div className="counter-up" style={{
                background: currentResult.totalPnl >= 0 ? '#f0fdf4' : '#fef2f2',
                border: `1.5px solid ${currentResult.totalPnl >= 0 ? '#86efac' : '#fca5a5'}`,
                borderRadius: '8px', padding: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#8B6B50', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Round P&L</div>
                <div style={{
                  fontFamily: '"Playfair Display", serif', fontSize: '32px', fontWeight: 900,
                  color: currentResult.totalPnl >= 0 ? '#16a34a' : '#dc2626',
                }}>{formatPnl(currentResult.totalPnl)}</div>
                <div style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#8B6B50', marginTop: '4px' }}>
                  {formatPct(currentResult.totalPnl / currentResult.portfolioValueBefore)}
                </div>
              </div>

              {/* Portfolio value transition */}
              <div style={{ background: 'white', border: '1px solid #E8D9C8', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#8B6B50', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Portfolio Value</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '16px', color: '#8B6B50' }}>${currentResult.portfolioValueBefore.toFixed(0)}</span>
                  <span style={{ color: '#B89070', fontSize: '14px' }}>?</span>
                  <span style={{
                    fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 700,
                    color: currentResult.portfolioValueAfter >= currentResult.portfolioValueBefore ? '#16a34a' : '#dc2626',
                  }}>${currentResult.portfolioValueAfter.toFixed(0)}</span>
                </div>
              </div>

              {/* Round history mini-bars */}
              {roundHistory.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #E8D9C8', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#8B6B50', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Previous Rounds</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {roundHistory.map(h => (
                      <div key={h.round} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50' }}>R{h.round}</span>
                        <div style={{ flex: 1, height: '4px', background: '#F0E8D4', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '2px',
                            width: `${Math.min(100, Math.abs(h.totalPnl / h.portfolioValueBefore) * 100 * 5)}%`,
                            background: h.totalPnl >= 0 ? '#22c55e' : '#ef4444',
                          }} />
                        </div>
                        <span style={{
                          fontFamily: '"Lora", serif', fontSize: '11px', fontWeight: 600,
                          color: h.totalPnl >= 0 ? '#16a34a' : '#dc2626', minWidth: '64px', textAlign: 'right',
                        }}>{formatPnl(h.totalPnl)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA button */}
              <button
                onClick={handleRoundComplete}
                style={{
                  marginTop: 'auto', padding: '18px',
                  background: '#2D6A4F', color: '#FAF4E8',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                  fontFamily: '"Playfair Display", serif', fontSize: '16px',
                  fontWeight: 700, letterSpacing: '0.5px',
                  boxShadow: '0 4px 16px rgba(45,106,79,0.3)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#3A8A63' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2D6A4F' }}
              >
                {currentRound >= TOTAL_ROUNDS
                  ? 'See Final Results ??'
                  : `Adjust Portfolio ? Round ${currentRound + 1} ?`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ?? Game-Over Phase ??????????????????????????????????????????????????? */}
      {gamePhase === 'game-over' && (
        <div style={{
          minHeight: '100vh', background: '#1C1008',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '60px 40px', gap: '32px',
        }}>
          <div className="slide-up" style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: '"Lora", serif', fontSize: '11px',
              color: '#A8D5B870', letterSpacing: '4px', textTransform: 'uppercase',
              marginBottom: '8px',
            }}>Season One ? Complete</div>
            <div style={{
              fontFamily: '"Playfair Display", serif', fontSize: '48px',
              fontWeight: 900, color: '#FAF4E8',
              textShadow: '0 4px 32px rgba(245,200,66,0.4)',
            }}>The Harvest Is In</div>
            {userName && (
              <div style={{
                fontFamily: '"Lora", serif', fontSize: '16px',
                color: '#F5C842', marginTop: '8px', fontStyle: 'italic',
              }}>
                Well played, {userName}.
              </div>
            )}
          </div>

          {/* Final portfolio value */}
          <div className="counter-up" style={{ animationDelay: '0.2s', textAlign: 'center' }}>
            <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#A8D5B870', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>Final Portfolio Value</div>
            <div style={{
              fontFamily: '"Playfair Display", serif', fontSize: '56px',
              fontWeight: 900,
              color: portfolioValue >= 1000 ? '#4ADE80' : '#F87171',
              textShadow: `0 4px 32px ${portfolioValue >= 1000 ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)'}`,
            }}>${portfolioValue.toFixed(0)}</div>
            <div style={{
              fontFamily: '"Lora", serif', fontSize: '14px',
              color: portfolioValue >= 1000 ? '#4ADE80' : '#F87171',
              marginTop: '4px',
            }}>
              {formatPnl(portfolioValue - 1000)} from $1,000 start ({formatPct((portfolioValue - 1000) / 1000)})
            </div>
          </div>
            <StrategyAdvisor portfolio={buildPortfolioItems()} currentValue={portfolioValue} round={currentRound} history={roundHistory} isFinal={true} />

          {/* Round-by-round summary */}
          <div className="slide-up" style={{ animationDelay: '0.4s', width: '100%', maxWidth: '640px' }}>
            <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#A8D5B870', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px', textAlign: 'center' }}>Round-by-Round</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roundHistory.map((h, i) => {
                const ev = getEventById(h.eventIds[0])
                return (
                  <div key={h.round} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px', padding: '12px 16px',
                    animation: `pnlCardIn 0.4s ease ${i * 0.06}s both`,
                  }}>
                    <div style={{
                      fontFamily: '"Playfair Display", serif', fontSize: '13px',
                      color: '#F5C84290', minWidth: '60px',
                    }}>Rnd {h.round}</div>
                    <span style={{ fontSize: '16px' }}>{ev.icon}</span>
                    <div style={{ flex: 1, fontFamily: '"Lora", serif', fontSize: '12px', color: '#A8D5B870' }}>
                      {getTimeSkipLabel(h.timeSkipDays)}
                    </div>
                    <div style={{
                      fontFamily: '"Playfair Display", serif', fontSize: '15px', fontWeight: 700,
                      color: h.totalPnl >= 0 ? '#4ADE80' : '#F87171',
                    }}>{formatPnl(h.totalPnl)}</div>
                    <div style={{
                      fontFamily: '"Lora", serif', fontSize: '12px',
                      color: h.totalPnl >= 0 ? '#4ADE8080' : '#F8717180',
                      minWidth: '60px', textAlign: 'right',
                    }}>${h.portfolioValueAfter.toFixed(0)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="slide-up" style={{ animationDelay: '0.6s', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {currentUserId && (
              <button
                onClick={() => setProfilePanelOpen(true)}
                style={{
                  padding: '18px 28px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px', cursor: 'pointer',
                  fontFamily: '"Playfair Display", serif', fontSize: '16px',
                  fontWeight: 700, letterSpacing: '1px', color: '#FAF4E8',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              >
                View My Profile
              </button>
            )}
            <button
              onClick={handleRestart}
              style={{
                padding: '18px 48px',
                background: '#2D6A4F', color: '#FAF4E8',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
                fontFamily: '"Playfair Display", serif', fontSize: '18px',
                fontWeight: 700, letterSpacing: '1px',
                boxShadow: '0 4px 24px rgba(45,106,79,0.4)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#3A8A63' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2D6A4F' }}
            >
              {userName ? `Play Again, ${userName} ?` : 'Play Again ? New Season'}
            </button>
          </div>
        </div>
      )}


      {/* ?? Selection / Locking Phase ??????????????????????????????????????? */}
      {isSelection && (
        <>
          {/* CSV loading progress bar */}
          {csvLoading && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 200,
              background: 'linear-gradient(90deg, #2D6A4F 0%, #F5C842 50%, #2D6A4F 100%)',
              backgroundSize: '200% 100%',
              animation: 'bob 1.8s ease-in-out infinite',
            }} />
          )}

          {/* Header */}
          <div style={{
            background: '#2D6A4F', padding: '0 40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: '64px', flexShrink: 0, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', fontSize: '36px', opacity: 0.08, letterSpacing: '4px', pointerEvents: 'none' }}>
              &#x1F437;&#x1F415;&#x1F434;&#x1F33F;&#x1F33E;
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              {currentRound === 1 ? (
                <>
                  <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 900, color: '#FAF4E8' }}>
                    {userName ? <><em style={{ color: '#F5C842' }}>{userName}</em>'s Farm</> : <>Build Your <em style={{ color: '#F5C842' }}>Dream Farm</em></>}
                  </span>
                  <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#A8D5B880', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Season One &middot; The Harvest Begins
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 900, color: '#FAF4E8' }}>
                    Round <em style={{ color: '#F5C842' }}>{currentRound}</em> of {TOTAL_ROUNDS}
                  </span>
                  <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#A8D5B880', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    {userName ? `${userName} ? ` : ''}Adjust Your Farm &middot; Next skip: {roundSkipLabel}
                  </span>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              {[
                { label: 'Budget', value: `$${budget}` },
                { label: 'Spent', value: `$${spent}` },
                { label: 'Remaining', value: `$${budget - spent}` },
                { label: 'Animals', value: totalUnits },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#A8D5B8', letterSpacing: '1.5px', fontFamily: '"Lora", serif', textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '16px', color: '#FAF4E8', fontWeight: 700, lineHeight: 1.2 }}>{s.value}</div>
                </div>
              ))}
              {currentUserId && (
                <button
                  onClick={() => setProfilePanelOpen(true)}
                  title="View your profile"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#FAF4E8',
                    fontFamily: '"Lora", serif', fontSize: '12px',
                    cursor: 'pointer', transition: 'background 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                >
                  Profile
                </button>
              )}
            </div>
          </div>

          {/* Last round recap banner (rounds 2+) */}
          {currentRound > 1 && lastResult && (
            <div style={{
              background: lastResult.totalPnl >= 0 ? '#f0fdf4' : '#fef2f2',
              borderBottom: `1px solid ${lastResult.totalPnl >= 0 ? '#86efac' : '#fca5a5'}`,
              padding: '8px 40px',
              display: 'flex', alignItems: 'center', gap: '12px',
              fontFamily: '"Lora", serif', fontSize: '12px',
            }}>
              <span style={{ color: '#8B6B50' }}>Round {lastResult.round} result:</span>
              <span style={{ fontWeight: 600, color: lastResult.totalPnl >= 0 ? '#16a34a' : '#dc2626' }}>
                {formatPnl(lastResult.totalPnl)} ({formatPct(lastResult.totalPnl / lastResult.portfolioValueBefore)})
              </span>
              <span style={{ color: '#8B6B50' }}>
                ? Portfolio: <strong>${lastResult.portfolioValueAfter.toFixed(0)}</strong>
              </span>
            </div>
          )}

          {/* Two-column body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: `calc(100vh - ${currentRound > 1 && lastResult ? '100px' : '64px'})` }}>

            {/* LEFT: livestock selection ? collapses during locking */}
            <div style={{ borderRight: '1px solid #E8D9C8', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

              {/* Sticky header + tabs ? hidden when locking */}
              <div
                className={isLocking ? 'lock-fade-up' : ''}
                style={{ padding: '20px 24px 0', flexShrink: 0 }}
              >
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 700, color: '#2C1810', marginBottom: '16px' }}>
                  Choose Your Livestock
                </div>
                <div style={{ display: 'flex', borderBottom: '2px solid #E8D9C8' }}>
                  {financialUnlocked ? (
                    ASSET_TYPE_ORDER.map(type => {
                      const m = ASSET_TYPE_META[type]
                      const isActive = activeTab === type
                      const cnt = tabSelectedCount(type)
                      return (
                        <button
                          key={type}
                          onClick={() => setActiveTab(type)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                            padding: '9px 4px', border: 'none', background: 'transparent',
                            cursor: 'pointer', fontFamily: '"Lora", serif',
                            fontSize: '12px', fontWeight: isActive ? 600 : 400,
                            color: isActive ? m.color : '#8B6B50',
                            borderBottom: `2px solid ${isActive ? m.color : 'transparent'}`,
                            marginBottom: '-2px', transition: 'all 0.18s', whiteSpace: 'nowrap',
                          }}
                        >
                          <span>{m.emoji}</span>
                          {m.label}
                          {cnt > 0 && (
                            <span style={{
                              background: m.color, color: '#fff', borderRadius: '10px',
                              fontSize: '9px', padding: '1px 5px', fontWeight: 700, lineHeight: 1.5,
                            }}>{cnt}</span>
                          )}
                        </button>
                      )
                    })
                  ) : (
                    ANIMAL_GROUP_ORDER.map(tab => {
                      const m = ANIMAL_GROUP_META[tab]
                      const isActive = activeAnimalTab === tab
                      const cnt = LIVESTOCK_TYPED
                        .filter(a => (m.categories as string[]).includes(a.animalCategory) && (selected[a.id] ?? 0) > 0)
                        .length
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveAnimalTab(tab)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                            padding: '9px 4px', border: 'none', background: 'transparent',
                            cursor: 'pointer', fontFamily: '"Lora", serif',
                            fontSize: '12px', fontWeight: isActive ? 600 : 400,
                            color: isActive ? m.color : '#8B6B50',
                            borderBottom: `2px solid ${isActive ? m.color : 'transparent'}`,
                            marginBottom: '-2px', transition: 'all 0.18s', whiteSpace: 'nowrap',
                          }}
                        >
                          <span>{m.emoji}</span>
                          {m.label}
                          {cnt > 0 && (
                            <span style={{
                              background: m.color, color: '#fff', borderRadius: '10px',
                              fontSize: '9px', padding: '1px 5px', fontWeight: 700, lineHeight: 1.5,
                            }}>{cnt}</span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Scrollable card list ? hidden when locking */}
              <div
                className={isLocking ? 'lock-fade-up' : ''}
                style={{
                  flex: 1, overflowY: 'auto', padding: '20px 24px 32px',
                  animationDelay: isLocking ? '0.05s' : undefined,
                }}
              >
                {financialUnlocked ? (
                  activeTab === 'Stock' ? (
                    STOCK_SUBGROUPS.map(sub => {
                      const subItems = LIVESTOCK_TYPED.filter(a => a.assetType === 'Stock' && a.sector === sub.sector)
                      return (
                        <div key={sub.sector} style={{ marginBottom: '28px' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            marginBottom: '10px', paddingBottom: '6px',
                            borderBottom: `1.5px solid ${sub.color}28`,
                          }}>
                            <span style={{ fontSize: '14px' }}>{sub.emoji}</span>
                            <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', fontWeight: 600, color: sub.color, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{sub.label}</span>
                            <span style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#B89070', marginLeft: '2px' }}>&middot; {subItems.length} assets</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {subItems.map((animal, idx) => (
                              <AnimalCard key={animal.id} animal={animal} idx={idx}
                                selected={selected} expanded={expanded}
                                onAdjust={adjust} onExpand={toggleExpand}
                                financialUnlocked={true} />
                            ))}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {tabItems(activeTab).map((animal, idx) => (
                        <AnimalCard key={animal.id} animal={animal} idx={idx}
                          selected={selected} expanded={expanded}
                          onAdjust={adjust} onExpand={toggleExpand}
                          financialUnlocked={true} />
                      ))}
                    </div>
                  )
                ) : (
                  ANIMAL_SUBGROUPS[activeAnimalTab].map(sub => {
                    const subItems = LIVESTOCK_TYPED.filter(a => a.animalCategory === sub.category)
                    return (
                      <div key={sub.category} style={{ marginBottom: '28px' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          marginBottom: '10px', paddingBottom: '6px',
                          borderBottom: `1.5px solid ${sub.color}28`,
                        }}>
                          <span style={{ fontSize: '14px' }}>{sub.emoji}</span>
                          <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', fontWeight: 600, color: sub.color, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{sub.label}</span>
                          <span style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#B89070', marginLeft: '2px' }}>&middot; {subItems.length} breeds</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {subItems.map((animal, idx) => (
                            <AnimalCard key={animal.id} animal={animal} idx={idx}
                              selected={selected} expanded={expanded}
                              onAdjust={adjust} onExpand={toggleExpand}
                              financialUnlocked={false} />
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* RIGHT: farm preview */}
            <div style={{ background: '#F0E8D4', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ height: '4px', background: 'repeating-linear-gradient(90deg, #C4622D 0, #C4622D 20px, #2D6A4F 20px, #2D6A4F 40px)' }} />

              <div style={{ padding: '28px 32px', borderBottom: '1px solid #E8D9C8', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 700, color: '#2C1810' }}>Your Farm Preview</div>
                  <div style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#8B6B50', marginTop: '2px' }}>
                    {currentRound === 1 ? 'A world awaits your decisions' : `Round ${currentRound} ? next skip: ${roundSkipLabel}`}
                  </div>
                </div>
                <span style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#C4622D' }}>
                  {totalUnits} asset{totalUnits !== 1 ? 's' : ''} selected
                </span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                <AnimatedFarm
                  selected={selected}
                  animalNames={Object.fromEntries(LIVESTOCK.map(l => [l.id, l.animalName]))}
                  animalCats={Object.fromEntries(LIVESTOCK.map(l => [l.id, l.animalCategory]))}
                  imageMap={IMAGE_MAP}
                  pixelImageMap={PIXEL_IMAGE_MAP}
                />
                <div style={{ marginTop: '12px', fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50', fontStyle: 'italic', textAlign: 'center' }}>
                  Pixel animation will populate based on your portfolio
                </div>
              </div>

              {totalUnits > 0 && (
                <div style={{ padding: '24px 32px', borderTop: '1px solid #E8D9C8', background: '#FAF4E8' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {Object.entries(selected).map(([id, count]) => {
                      const a = LIVESTOCK.find(l => l.id === id)!
                      return (
                        <span key={id} style={{ fontFamily: '"Lora", serif', fontSize: '11px', padding: '3px 10px', background: '#FFF', border: '1px solid #E8D9C8', borderRadius: '2px', color: '#2C1810', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {a.image
                            ? <PixelAnimal name={a.animalName} size={16} style={{ borderRadius: '2px', background: '#F0E8D4' }} />
                            : <span style={{ fontSize: '12px' }}>{a.emoji}</span>
                          }
                          {a.animalName} &times;{count}
                        </span>
                      )
                    })}
                  </div>
                    <StrategyAdvisor portfolio={buildPortfolioItems()} currentValue={portfolioValue} round={currentRound} />
                  <button
                    disabled={isLocking || csvLoading}
                    onClick={handleLock}
                    style={{
                      width: '100%', padding: '16px',
                      background: isLocking ? '#1C4A35' : csvLoading ? '#8B9E92' : '#2D6A4F',
                      color: '#FAF4E8', border: 'none', borderRadius: '4px',
                      fontFamily: '"Playfair Display", serif', fontSize: '16px',
                      fontWeight: 700, cursor: (isLocking || csvLoading) ? 'default' : 'pointer',
                      letterSpacing: '1px', transition: 'all 0.2s',
                      boxShadow: '0 4px 16px rgba(45,106,79,0.3)',
                      opacity: (isLocking || csvLoading) ? 0.7 : 1,
                    }}
                    onMouseEnter={e => { if (!isLocking && !csvLoading) e.currentTarget.style.background = '#3A8A63' }}
                    onMouseLeave={e => { if (!isLocking && !csvLoading) e.currentTarget.style.background = '#2D6A4F' }}
                  >
                    {csvLoading
                      ? 'Loading market data...'
                      : isLocking
                        ? 'Locking...'
                        : `Lock Portfolio & Begin Round ${currentRound}`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Locking overlay rendered on top */}
          {isLocking && <LockOverlay phase={gamePhase} round={currentRound} />}
        </>
      )}

      {/* Profile panel ? available on any phase once user is identified */}
      {profilePanelOpen && currentUserId && (
        <ProfilePanel
          userId={currentUserId}
          userName={userName}
          financialUnlocked={financialUnlocked}
          onUnlock={handleUnlock}
          onClose={() => setProfilePanelOpen(false)}
        />
      )}
    </div>
  )
}
