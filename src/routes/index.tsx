import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { PixelAnimal } from '../components/PixelAnimal'
import { AnimatedFarm, type FarmEffect } from '../components/AnimatedFarm'
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

// 
import BerkshirePig from '../../Images/Pigs/Berkshirepig.jpg'
import SwissPig from '../../Images/Pigs/Swisspig.jpg'
import MeishanPig from '../../Images/Pigs/Meishanpig.jpg'
import HampshirePig from '../../Images/Pigs/Hampshirepig.jpg'
import DurocPig from '../../Images/Pigs/Durocpig.jpg'
// 
import DogueBordeaux from '../../Images/GuardDogs/Doguedebordeaux.jpg'
import AmBulldog from '../../Images/GuardDogs/Americanbulldog.jpg'
import AmFoxhound from '../../Images/GuardDogs/Americanfoxhound.jpg'
import GermanShepherd from '../../Images/GuardDogs/Germanshepherd.jpg'
import DutchShepherd from '../../Images/GuardDogs/Dutchshepherd.jpg'
// 
import AmQuarterHorse from '../../Images/Horses/Americanhorse.jpg'
import MorganHorse from '../../Images/Horses/Morganhorse.jpg'
import Mustang from '../../Images/Horses/Mustang.jpg'
import TaiwaneseHorse from '../../Images/Horses/Poney.jpg'
import Saddlebred from '../../Images/Horses/Saddleberghorse.jpg'
// 
import SwissCow from '../../Images/Cows/Swisscow.jpg'
import DevonCow from '../../Images/Cows/Devoncow.jpg'
import Bison from '../../Images/Cows/Bison.jpg'
import Yak from '../../Images/Cows/Yak.jpg'
import CharolaisCow from '../../Images/Cows/Charloraiscow.jpg'
import FleckviehCow from '../../Images/Cows/Fleckviehcow.jpg'
import BrahmanCow from '../../Images/Cows/Brahmancow.jpg'
// 
import Arnica from '../../Images/Herbs/Arnica.jpg'
import Gentian from '../../Images/Herbs/Gentian.jpg'
import Echinacea from '../../Images/Herbs/Echinacea.jpg'
import Rosehip from '../../Images/Herbs/Rosehip.jpg'
import ValerianRoot from '../../Images/Herbs/Valerianroot.jpg'
// 
import AlpineBarley from '../../Images/Cereals/Barley.jpg'
import WhiteWheat from '../../Images/Cereals/Whitewheat.jpg'
import WinterWheat from '../../Images/Cereals/Winterwheat.png'
import YellowCorn from '../../Images/Cereals/Corn.jpg'
// 
import HammerImg from '../../Images/Tools/Hammer.jpg'
import AxeImg from '../../Images/Tools/Axe.jpg'
import ChainsawImg from '../../Images/Tools/Chainsaw.jpg'
import RiceImg from '../../Images/Cereals/Rice.jpg'
// 
import PixelPig from '../../Images/pixelpig.png'
import PixelDog from '../../Images/Pixeldog_1.jpg'
import PixelHorse from '../../Images/pixelhorse.png'
import PixelCow from '../../Images/Pixelcow1.png'
import PixelTool from '../../Images/pixeltool.png'
import PixelHouse from '../../Images/pixelhouse.png'

export const Route = createFileRoute('/')({
  component: LandingV2,
})

type GamePhase = 'profile' | 'selection' | 'locking' | 'round-active' | 'round-recap' | 'round-results' | 'game-over'

// 
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
  'Tool': PixelTool,
  'Collective': PixelHouse,
}

// â”€â”€ Event â†’ visual farm effect mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getEffectsForEvents(events: { id: number; isPositive: boolean }[]): FarmEffect[] {
  const out: FarmEffect[] = []
  for (const ev of events) {
    switch (ev.id) {
      case 1:  out.push({ type: 'locusts' }); break                           // locust swarm
      case 2:  out.push({ type: 'sparkles', zone: 'livestock' }); break       // high harvest
      case 3:  out.push({ type: 'disease',  zone: 'livestock' }); break       // swine flu
      case 4:  out.push({ type: 'sparkles', zone: 'build' }); break           // timber rush
      case 5:  out.push({ type: 'storm' }); break                             // wolf attack
      case 6:  out.push({ type: 'sparkles', zone: 'livestock' }); break       // guard dogs boom
      case 7:  out.push({ type: 'extra_clouds' }); break                      // concrete shelter storm
      case 8:  out.push({ type: 'sparkles', zone: 'farming' }); break         // greenhouse herbs
      case 9:  out.push({ type: 'sparkles', zone: 'livestock' }); break       // iron hoof upgrade
      case 10: out.push({ type: 'rain', intensity: 0.5 }); break              // silo leak
      case 11: out.push({ type: 'drought' }); break                           // scorched drought
      case 12: out.push({ type: 'sparkles', zone: 'livestock' }); break       // spring farrowing
      case 13: out.push({ type: 'golden_sky' }); break                        // cattle rally
      case 14: out.push({ type: 'disease',  zone: 'livestock' }); break       // cattle blight
      case 15: out.push({ type: 'sparkles', zone: 'build' }); break           // precious metal rush
      case 16: out.push({ type: 'extra_clouds' }); break                      // tarnished vault
      case 17: out.push({ type: 'sparkles', zone: 'livestock' }); break       // pig jamboree
      case 18: out.push({ type: 'disease',  zone: 'livestock' }); break       // sick sow season
      case 19: out.push({ type: 'sparkles', zone: 'livestock' }); break       // watchtower contracts
      case 20: out.push({ type: 'sparkles', zone: 'livestock' }); break       // racing circuit
      case 21: out.push({ type: 'sparkles', zone: 'farming' }); break         // valley plague herbs
      case 22: out.push({ type: 'golden_sky' }); break                        // eastern harvest boom
      case 23: out.push({ type: 'rain', intensity: 0.6 }); break              // lame season wet spring
      case 24: out.push({ type: 'disease',  zone: 'livestock' }); break       // valley distemper
      case 25: out.push({ type: 'disease',  zone: 'farming' }); break         // root blight
      case 26: out.push({ type: 'extra_clouds' }); break                      // workshop collapse
      case 27: out.push({ type: 'storm' }); break                             // valley enclosure
      case 28: out.push({ type: 'extra_clouds' }); break                      // reserve audit
      case 29: out.push({ type: 'golden_sky' }); break                        // golden harvest
    }
  }
  return out
}

//
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

// 
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

// 
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

// 
const STOCK_SUBGROUPS = [
  { sector: 'Finance', emoji: '\u{1F437}', label: 'Finance', color: '#1D5FA0' },
  { sector: 'Defense', emoji: '\u{1F415}', label: 'Defense', color: '#8B4513' },
  { sector: 'Tech', emoji: '\u{1F434}', label: 'Tech', color: '#6D28D9' },
  { sector: 'Pharma', emoji: '\u{1F33F}', label: 'Pharma', color: '#2D6A4F' },
  { sector: 'Commodities', emoji: '\u{1F33E}', label: 'Commodities', color: '#B8860B' },
]

// 
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
              Seasonal breed &middot; farm performance
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
              breed on the farm. Its growth is shaped by world events and seasonal forces&mdash;
              build your herd wisely and diversity will see you through any storm.
            </>
          )}
        </div>
      )}
    </div>
  )
}


// 
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
          }}>of {TOTAL_ROUNDS} &middot; The Harvest Begins</div>
        </div>
      )}
    </div>
  )
}


// 
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

  // Convex mutations & actions
  const createGameMutation      = useMutation(api.games.createGame)
  const saveRoundMutation       = useMutation(api.rounds.saveRound)
  const completeGameMutation    = useMutation(api.games.completeGame)
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
  const [rewindRound, setRewindRound]         = useState<number | null>(null)

  // Round-active animation step: 'time-skip' ? 'event-1' ? 'event-2'
  const [activeStep, setActiveStep] = useState<'time-skip' | 'event-1' | 'event-2'>('time-skip')

  // Event chip hover state (round-results)
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null)
  const [seenEventIds, setSeenEventIds] = useState<Set<number>>(new Set())
  // Event chip hover state (rewind overlay)
  const [rewindHoveredEventId, setRewindHoveredEventId] = useState<number | null>(null)
  const [roundByRoundOpen, setRoundByRoundOpen] = useState(false)

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
    // Capture time skips locally to avoid async-state read issues after setRoundTimeSkips
    const timeSkips = (currentRound === 1 && roundTimeSkips.length === 0)
      ? rollTimeSkips()
      : roundTimeSkips
    if (currentRound === 1 && roundTimeSkips.length === 0) {
      setRoundTimeSkips(timeSkips)
    }

    // Pick 2 events for THIS round weighted by how many units the player holds
    const eventIdsForRound = pickEventsForRound(buildPortfolioItems(), 2)
    setRoundEventIds(prev => {
      const updated = [...prev]
      updated[currentRound - 1] = eventIdsForRound
      return updated
    })

    // Compute P&L immediately using local variables (state updates are async)
    if (csvData) {
      const roundIdx = currentRound - 1
      const skipDays = timeSkips[roundIdx] ?? 30
      const startDate = currentCsvDate
      const endDate = advanceDate(currentCsvDate, skipDays)
      const portfolio = buildPortfolioItems()
      const events = eventIdsForRound.map(id => getEventById(id))
      const result = calculateRoundPnl(
        currentRound, events, portfolio,
        startDate, endDate, skipDays,
        csvData, multiplierMap, portfolioValue,
      )
      const cashFloor = portfolioValue - spent
      const clampedPortfolioValueAfter = Math.max(cashFloor, result.portfolioValueAfter)
      const clampedTotalPnl = clampedPortfolioValueAfter - portfolioValue
      setCurrentResult({ ...result, portfolioValueAfter: clampedPortfolioValueAfter, totalPnl: clampedTotalPnl })
    }

    setGamePhase('locking')
    setTimeout(() => setGamePhase('round-results'), 1800)
  }

  // Sequence the round-active animation steps: time-skip ? event-1
  useEffect(() => {
    if (gamePhase !== 'round-active') return
    setActiveStep('time-skip')
    const t1 = setTimeout(() => setActiveStep('event-1'), 2000)
    return () => { clearTimeout(t1) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase])

  useEffect(() => {
    if (gamePhase === 'round-results') {
      setSeenEventIds(new Set())
      setHoveredEventId(null)
    }
  }, [currentRound, gamePhase])

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

    // Losses are capped at the invested amount ? uninvested cash is never at risk.
    // You can lose at most what you put in; the idle cash is always preserved.
    const cashFloor = portfolioValue - spent
    const clampedPortfolioValueAfter = Math.max(cashFloor, result.portfolioValueAfter)
    const clampedTotalPnl = clampedPortfolioValueAfter - portfolioValue

    setCurrentResult({ ...result, portfolioValueAfter: clampedPortfolioValueAfter, totalPnl: clampedTotalPnl })
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
    const newPortfolioValue = currentResult.portfolioValueAfter
    setPortfolioValue(newPortfolioValue)
    // Advance the CSV cursor
    setCurrentCsvDate(currentResult.endDate)

    // Sync selected quantities to reflect the P&L on invested assets only.
    // Scale based on what the investment returned ? never consume uninvested cash.
    const investedAfterPnl = Math.max(0, spent + currentResult.totalPnl)
    const newMaxUnits = Math.floor(investedAfterPnl / UNIT_COST)
    const currentTotalUnits = Object.values(selected).reduce((a, b) => a + b, 0)
    if (currentTotalUnits > newMaxUnits) {
      if (newMaxUnits <= 0) {
        setSelected({})
      } else {
        const scale = newMaxUnits / currentTotalUnits
        const entries = Object.entries(selected).map(([id, count]) => {
          const raw = count * scale
          return { id, count, newCount: Math.floor(raw), frac: raw - Math.floor(raw) }
        })
        let allocated = entries.reduce((s, e) => s + e.newCount, 0)
        let remaining = newMaxUnits - allocated
        // Distribute leftover slots to the assets with the largest fractional remainders
        const sorted = [...entries].sort((a, b) => b.frac - a.frac)
        for (const e of sorted) {
          if (remaining <= 0) break
          e.newCount++
          remaining--
        }
        const newSelected: Record<string, number> = {}
        for (const e of entries) {
          if (e.newCount > 0) newSelected[e.id] = e.newCount
        }
        setSelected(newSelected)
      }
    }

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
  const activeEffects   = getEffectsForEvents(currentEvents)

  return (
    <div style={{ minHeight: '100vh', background: '#FAF4E8', color: '#2C1810', fontFamily: '"Georgia", serif' }}>

      {/*  */}
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

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

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

        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @keyframes fadeInLeft {
          from { opacity:0; transform:translateX(-10px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .fade-in-left { animation: fadeInLeft 0.45s ease both; }

        @keyframes chipGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(196,98,45,0); }
          50%       { box-shadow: 0 0 10px 3px rgba(196,98,45,0.38); }
        }
        .chip-shine { animation: chipGlow 2s ease-in-out infinite; cursor: pointer; }

        @keyframes eventOverlayIn {
          from { opacity:0; transform:translateY(6px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .event-chip { cursor: pointer; transition: border-color 0.18s, background 0.18s; }
        .event-chip:hover { filter: brightness(1.08); }
      `}</style>

      {/*  */}
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
              <span style={{ fontSize: '36px' }} aria-hidden role="img">&#x1F3B2;</span>
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
                    ? <span className="dice-flicker">Rolling&hellip;</span>
                    : roundSkipLabel}
                </div>
                {(activeStep === 'event-1' || activeStep === 'event-2') && (
                  <div className="fade-in" style={{
                    fontFamily: '"Lora", serif', fontSize: '12px',
                    color: '#A8D5B8', marginTop: '4px',
                  }}>
                    {formatMonthYear(currentCsvDate)} &ndash; {formatMonthYear(advanceDate(currentCsvDate, roundSkipDays))}
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
                  }}>{ev.isPositive ? 'Positive' : 'Negative'}</div>
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
                    {isLast ? 'See Results' : 'Next Event'}
                  </button>
                  <div style={{
                    marginTop: '10px', fontFamily: '"Lora", serif', fontSize: '10px',
                    color: '#A8D5B840', letterSpacing: '1px',
                  }}>{isLast ? 'Take your time &mdash; press when ready' : 'One more event to read'}</div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/*  */}
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
              }}>Round {currentRound} &middot; Results</span>
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

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '18px', fontWeight: 700, color: '#2C1810' }}>
                  Your Livestock This Round
                </div>
                {(() => {
                  const typeCounts: Partial<Record<AssetType, number>> = {}
                  currentResult.assetResults.forEach(r => {
                    const ls = LIVESTOCK_TYPED.find(l => l.assetName === r.assetName)
                    if (ls) {
                      typeCounts[ls.assetType] = (typeCounts[ls.assetType] ?? 0) + r.units
                    }
                  })
                  return ASSET_TYPE_ORDER.filter(t => typeCounts[t]).map(t => (
                    <div key={t} style={{
                      fontFamily: '"Lora", serif', fontSize: '11px', color: '#6B5240',
                      background: '#F0E8D4', border: '1px solid #DDD0B8',
                      borderRadius: '5px', padding: '2px 8px',
                    }}>
                      {typeCounts[t]} {t}{(typeCounts[t] ?? 0) > 1 ? 's' : ''}
                    </div>
                  ))
                })()}
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
                          {r.assetName} &middot; {r.units} unit{r.units !== 1 ? 's' : ''}
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
                            {r.startPrice.toFixed(2)} &rarr; {r.endPrice.toFixed(2)}
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
                  <span style={{ color: '#B89070', fontSize: '14px' }} aria-hidden>&rarr;</span>
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
                  ? 'See Final Results'
                  : `Adjust Portfolio \u00B7 Round ${currentRound + 1}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  */}
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
            }}>Season One &middot; Complete</div>
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

          {/* Rewind Timeline */}
          {roundHistory.length > 0 && (
            <div
              className="slide-up"
              style={{
                animationDelay: '0.4s', width: '100%', maxWidth: '640px',
                marginTop: '28px', marginBottom: '36px',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '22px',
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '6px',
                  textTransform: 'uppercase',
                  color: '#E8D4A8',
                  textShadow: '0 0 28px rgba(245,200,66,0.35), 0 2px 12px rgba(0,0,0,0.4)',
                }}
              >
                Rewind
              </div>

              {/* Timeline rail */}
              <div style={{ paddingBottom: '2px' }}>
                {/* Round dots - left = oldest (R1), right = most recent */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', alignItems: 'center' }}>
                  {roundHistory.map(h => {
                    const isPos = h.totalPnl >= 0
                    const isSelected = rewindRound === h.round
                    const borderColor = isPos ? 'rgba(74,222,128,0.55)' : 'rgba(248,113,113,0.55)'
                    const bgColor = isPos ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)'
                    const textColor = isPos ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)'
                    return (
                      <button
                        key={h.round}
                        onClick={() => setRewindRound(h.round)}
                        title={`Round ${h.round} Â· ${formatPnl(h.totalPnl)}`}
                        style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: isSelected ? (isPos ? '#4ADE80' : '#F87171') : bgColor,
                          border: `2px solid ${isSelected ? (isPos ? '#4ADE80' : '#F87171') : borderColor}`,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: '"Playfair Display", serif', fontSize: '14px', fontWeight: 700,
                          color: isSelected ? '#1C1008' : textColor,
                          transition: 'all 0.18s cubic-bezier(0.34,1.3,0.64,1)',
                          flexShrink: 0, position: 'relative', zIndex: 1,
                          boxShadow: isSelected
                            ? `0 0 20px ${isPos ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)'}, inset 0 1px 0 rgba(255,255,255,0.2)`
                            : `inset 0 1px 0 rgba(255,255,255,0.05)`,
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) {
                            e.currentTarget.style.background = isPos ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'
                            e.currentTarget.style.transform = 'scale(1.15)'
                            e.currentTarget.style.borderColor = isPos ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.background = bgColor
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.borderColor = borderColor
                          }
                        }}
                      >
                        {h.round}
                      </button>
                    )
                  })}
                </div>

                {/* Direction labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '2px' }}>
                  <span style={{ fontFamily: '"Lora", serif', fontSize: '9px', color: '#A8D5B860', letterSpacing: '2px', textTransform: 'uppercase' }}>&#x2190; Past</span>
                  <span style={{ fontFamily: '"Lora", serif', fontSize: '9px', color: '#A8D5B860', letterSpacing: '2px', textTransform: 'uppercase' }}>Recent &#x2192;</span>
                </div>
              </div>

              {rewindRound === null && (
                <div style={{
                  textAlign: 'center',
                  fontFamily: '"Lora", serif',
                  fontSize: '12px',
                  color: '#A8D5B8A8',
                  fontStyle: 'italic',
                  marginTop: '8px',
                  lineHeight: 1.45,
                  paddingBottom: '4px',
                }}>
                  Click a round to revisit your farm &amp; results
                </div>
              )}
            </div>
          )}

          {/* Round-by-round summary */}
          {(() => {
            const totalDays = roundHistory.reduce((s, h) => s + h.timeSkipDays, 0)
            const years   = Math.floor(totalDays / 365)
            const months  = Math.floor((totalDays % 365) / 30)
            const days    = totalDays % 30
            const parts: string[] = []
            if (years  > 0) parts.push(`${years} yr${years  !== 1 ? 's' : ''}`)
            if (months > 0) parts.push(`${months} mo`)
            if (days   > 0 && years === 0) parts.push(`${days} d`)
            const totalLabel = parts.join(' ') || `${totalDays} days`

            return (
              <div className="slide-up" style={{ animationDelay: '0.5s', width: '100%', maxWidth: '640px' }}>
                <button
                  onClick={() => setRoundByRoundOpen(o => !o)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,213,184,0.08)'; e.currentTarget.style.borderColor = 'rgba(168,213,184,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,213,184,0.04)'; e.currentTarget.style.borderColor = 'rgba(168,213,184,0.12)' }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    width: '100%', marginBottom: roundByRoundOpen ? '16px' : '0',
                    background: 'rgba(168,213,184,0.04)',
                    border: '1px solid rgba(168,213,184,0.12)',
                    borderRadius: '6px',
                    cursor: 'pointer', padding: '10px 20px',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#A8D5B8A0', letterSpacing: '3px', textTransform: 'uppercase' }}>Round-by-Round</span>
                  <span
                    aria-hidden
                    style={{
                      color: '#A8D5B870',
                      fontSize: '10px',
                      lineHeight: 1,
                      fontFamily: 'system-ui, sans-serif',
                      transition: 'transform 0.2s',
                      display: 'inline-block',
                      transform: roundByRoundOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    {'\u25BC'}
                  </span>
                </button>
                {roundByRoundOpen && <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {roundHistory.map((h, i) => {
                    const ev = getEventById(h.eventIds[0])
                    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    const startFmt = fmt(h.startDate instanceof Date ? h.startDate : new Date(h.startDate))
                    const endFmt   = fmt(h.endDate   instanceof Date ? h.endDate   : new Date(h.endDate))
                    return (
                      <div key={h.round} style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px', padding: '10px 16px',
                        animation: `pnlCardIn 0.4s ease ${i * 0.06}s both`,
                      }}>
                        {/* Top row: round label + event + P&L */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            fontFamily: '"Playfair Display", serif', fontSize: '13px',
                            color: '#F5C84290', minWidth: '52px',
                          }}>Rnd {h.round}</div>
                          <span style={{ fontSize: '15px' }}>{ev.icon}</span>
                          <div style={{ flex: 1 }} />
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
                        {/* Bottom row: date range + duration */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', paddingLeft: '64px' }}>
                          <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#F5C842B0', fontWeight: 600 }}>
                            {startFmt}
                          </span>
                          <span style={{ color: '#A8D5B840', fontSize: '10px' }} aria-hidden>&ndash;</span>
                          <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#F5C842B0', fontWeight: 600 }}>
                            {endFmt}
                          </span>
                          <span style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#A8D5B850', marginLeft: '4px' }}>
                            &middot; {getTimeSkipLabel(h.timeSkipDays)} ({h.timeSkipDays}d)
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Aggregated totals row */}
                  {/* Aggregated totals row */}
                  {(() => {
                    const first = roundHistory[0]
                    const last  = roundHistory[roundHistory.length - 1]
                    const fmtShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    const spanStart = fmtShort(first?.startDate instanceof Date ? first.startDate : new Date(first?.startDate))
                    const spanEnd   = fmtShort(last?.endDate   instanceof Date ? last.endDate   : new Date(last?.endDate))
                    return (
                      <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.12)',
                        paddingTop: '10px', marginTop: '2px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            fontFamily: '"Lora", serif', fontSize: '11px',
                            color: '#A8D5B860', letterSpacing: '1.5px', textTransform: 'uppercase',
                            minWidth: '52px',
                          }}>Total</div>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontFamily: '"Playfair Display", serif', fontSize: '15px',
                              fontWeight: 700, color: '#F5C842',
                            }}>{totalLabel}</span>
                            <span style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#F5C84260' }}>
                              ({totalDays} days)
                            </span>
                          </div>
                          <div style={{
                            fontFamily: '"Playfair Display", serif', fontSize: '15px', fontWeight: 700,
                            color: portfolioValue >= 1000 ? '#4ADE80' : '#F87171',
                          }}>{formatPnl(portfolioValue - 1000)}</div>
                          <div style={{
                            fontFamily: '"Lora", serif', fontSize: '12px',
                            color: portfolioValue >= 1000 ? '#4ADE8080' : '#F8717180',
                            minWidth: '60px', textAlign: 'right',
                          }}>${portfolioValue.toFixed(0)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', paddingLeft: '60px' }}>
                          <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#F5C84275' }}>{spanStart}</span>
                          <span style={{ color: '#A8D5B840', fontSize: '10px' }}>{'->'}</span>
                          <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#F5C84275' }}>{spanEnd}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>}
              </div>
            )
          })()}

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
              {userName ? `Play Again, ${userName}` : 'Play Again \u00B7 New Season'}
            </button>
          </div>
        </div>
      )}


      {/*  */}
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
                    {userName ? `${userName} \u00B7 ` : ''}Adjust Your Farm &middot; Next skip: {roundSkipLabel}
                  </span>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              {[
                { label: 'Budget', value: `$${budget}` },
                { label: 'Spent', value: `$${spent}` },
                { label: 'Remaining', value: `$${budget - spent}` },
                { label: 'Assets', value: totalUnits },
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
                &middot; Portfolio: <strong>${lastResult.portfolioValueAfter.toFixed(0)}</strong>
              </span>
            </div>
          )}

          {/* Two-column body */}
          <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', height: `calc(100vh - ${currentRound > 1 && lastResult ? '100px' : '64px'})` }}>

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

              <div style={{ padding: '28px 32px', borderBottom: '1px solid #E8D9C8', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 700, color: '#2C1810' }}>Your Farm Preview</div>
                  <div style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#8B6B50', marginTop: '2px' }}>
                    {currentRound === 1 ? 'A world awaits your decisions' : `Round ${currentRound} \u00B7 next skip: ${roundSkipLabel}`}
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
                  effects={activeEffects}
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
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      disabled={csvLoading}
                      onClick={handleLock}
                      style={{
                        width: 'auto', padding: '10px 32px',
                        background: csvLoading ? '#8B9E92' : '#2D6A4F',
                        color: '#FAF4E8', border: 'none', borderRadius: '999px',
                        fontFamily: '"Playfair Display", serif', fontSize: '14px',
                        fontWeight: 700, cursor: csvLoading ? 'default' : 'pointer',
                        letterSpacing: '1px', transition: 'all 0.2s',
                        boxShadow: '0 4px 16px rgba(45,106,79,0.3)',
                        opacity: csvLoading ? 0.7 : 1,
                      }}
                      onMouseEnter={e => { if (!csvLoading) e.currentTarget.style.background = '#3A8A63' }}
                      onMouseLeave={e => { if (!csvLoading) e.currentTarget.style.background = '#2D6A4F' }}
                    >
                      {csvLoading ? 'Loading market data...' : `Lock Portfolio & Begin Round ${currentRound}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Locking overlay rendered on top */}
          {isLocking && <LockOverlay phase={gamePhase} round={currentRound} />}
        </>
      )}

      {/*  */}
      {gamePhase === 'round-results' && currentResult && (
        <>
          {/* Top nav bar (same forest green as End Round / selection header) */}
          <div style={{
            height: '64px', background: '#2D6A4F', display: 'flex', alignItems: 'center',
            padding: '0 32px', gap: '16px', position: 'sticky', top: 0, zIndex: 10,
          }}>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '18px', fontWeight: 700, color: '#FAF4E8', letterSpacing: '0.5px' }}>
              LeoG
            </div>
            <div style={{ flex: 1 }} />
            {userName && (
              <div style={{ fontFamily: '"Lora", serif', fontSize: '13px', color: '#A8D5B8' }}>
                {userName}
              </div>
            )}
          </div>

          {/* Two-column body */}
          <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', height: 'calc(100vh - 64px)' }}>

            {/* LEFT: per-asset diff */}
            <div style={{ borderRight: '1px solid #E8D9C8', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div style={{ overflowY: 'auto', padding: '32px 28px 48px' }}>

                {/* Round title */}
                <div className="fade-in-left" style={{ marginBottom: '20px' }}>
                  <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Season One
                  </div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 700, color: '#2C1810' }}>
                    Round {currentRound} Results
                  </div>
                </div>

                {/* Event chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {currentEvents.map(ev => {
                    const isSeen = seenEventIds.has(ev.id)
                    return (
                      <div
                        key={ev.id}
                        className={`event-chip${!isSeen ? ' chip-shine' : ''}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                          background: `${ev.color}12`, border: `1px solid ${ev.color}35`,
                          borderRadius: '4px', padding: '6px 14px',
                        }}
                        onMouseEnter={() => {
                          setHoveredEventId(ev.id)
                          setSeenEventIds(prev => new Set([...prev, ev.id]))
                        }}
                        onMouseLeave={() => setHoveredEventId(null)}
                      >
                        <span>{ev.icon}</span>
                        <span style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#2C1810', fontWeight: 600 }}>
                          {ev.title}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Full-news hover overlay */}
                {hoveredEventId !== null && (() => {
                  const ev = currentEvents.find(e => e.id === hoveredEventId)
                  if (!ev) return null
                  return (
                    <div style={{
                      position: 'fixed', top: '108px', left: '16px',
                      width: 'calc(40vw - 32px)',
                      background: '#2C1810',
                      borderRadius: '10px', padding: '18px 20px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.40)',
                      border: `1px solid ${ev.color}55`,
                      zIndex: 200,
                      animation: 'eventOverlayIn 0.16s ease both',
                      pointerEvents: 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '22px' }}>{ev.icon}</span>
                        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '14px', fontWeight: 700, color: '#FAF4E8', lineHeight: 1.3 }}>
                          {ev.title}
                        </div>
                      </div>
                      <div style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#C8A882', lineHeight: '1.7' }}>
                        {ev.description}
                      </div>
                      <div style={{
                        marginTop: '12px', paddingTop: '10px',
                        borderTop: `1px solid ${ev.color}30`,
                        fontFamily: '"Lora", serif', fontSize: '10px',
                        color: ev.color, letterSpacing: '1.5px', textTransform: 'uppercase',
                      }}>
                        {ev.impactLabel}
                      </div>
                    </div>
                  )
                })()}

                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '16px', fontWeight: 700, color: '#2C1810' }}>
                    Your Livestock This Round
                  </div>
                  {(() => {
                    const typeCounts: Partial<Record<AssetType, number>> = {}
                    currentResult.assetResults.forEach(r => {
                      const ls = LIVESTOCK_TYPED.find(l => l.assetName === r.assetName)
                      if (ls) {
                        typeCounts[ls.assetType] = (typeCounts[ls.assetType] ?? 0) + r.units
                      }
                    })
                    return ASSET_TYPE_ORDER.filter(t => typeCounts[t]).map(t => (
                      <div key={t} style={{
                        fontFamily: '"Lora", serif', fontSize: '11px', color: '#6B5240',
                        background: '#F0E8D4', border: '1px solid #DDD0B8',
                        borderRadius: '5px', padding: '2px 8px',
                      }}>
                        {typeCounts[t]} {t}{(typeCounts[t] ?? 0) > 1 ? 's' : ''}
                      </div>
                    ))
                  })()}
                </div>

                {/* Per-asset P&L cards */}
                {(() => {
                  // Compute next-round unit counts using the same scaling as handleRoundComplete
                  const investedAfterPnl = Math.max(0, spent + currentResult.totalPnl)
                  const newMaxUnits = Math.floor(investedAfterPnl / UNIT_COST)
                  const nextUnitsById: Record<string, number> = {}
                  if (newMaxUnits > 0 && totalUnits > 0) {
                    if (totalUnits <= newMaxUnits) {
                      Object.entries(selected).forEach(([id, c]) => { nextUnitsById[id] = c })
                    } else {
                      const scale = newMaxUnits / totalUnits
                      const entries = Object.entries(selected).map(([id, count]) => {
                        const raw = count * scale
                        return { id, newCount: Math.floor(raw), frac: raw - Math.floor(raw) }
                      })
                      let remaining = newMaxUnits - entries.reduce((s, e) => s + e.newCount, 0)
                      entries.sort((a, b) => b.frac - a.frac).forEach(e => {
                        if (remaining > 0) { e.newCount++; remaining-- }
                      })
                      entries.forEach(e => { if (e.newCount > 0) nextUnitsById[e.id] = e.newCount })
                    }
                  }
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {currentResult.assetResults.map((r, i) => {
                        const meta = CATEGORY_META[r.animalCategory]
                        const isPos = r.dollarPnl >= 0
                        const livestock = LIVESTOCK.find(l => l.assetName === r.assetName)
                        const nextUnits = livestock ? (nextUnitsById[livestock.id] ?? 0) : r.units
                        const unitDelta = nextUnits - r.units
                        return (
                          <div
                            key={r.assetName}
                            className="pnl-card-in fade-in-left"
                            style={{
                              animationDelay: `${i * 0.07}s`,
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
                              <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                <span>{r.assetName}</span>
                                <span>&middot;</span>
                                {/* Unit count with next-round delta */}
                                {unitDelta < 0 ? (
                                  <>
                                    <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{r.units} unit{r.units !== 1 ? 's' : ''}</span>
                                    <span style={{ color: '#ef4444', fontWeight: 700 }}>
                                      {nextUnits} unit{nextUnits !== 1 ? 's' : ''}
                                    </span>
                                    <span style={{
                                      background: '#fef2f2', border: '1px solid #fca5a5',
                                      borderRadius: '4px', padding: '0 5px',
                                      color: '#ef4444', fontWeight: 700, fontSize: '10px',
                                    }}>
                                      {Math.abs(unitDelta)} lost
                                    </span>
                                  </>
                                ) : (
                                  <span>{r.units} unit{r.units !== 1 ? 's' : ''}</span>
                                )}
                                {r.isEventAffected && (
                                  <span style={{ display: 'none', color: r.eventBonusPct >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                    {currentEvent?.icon} {r.eventBonusPct >= 0 ? '+' : ''}{(r.eventBonusPct * 100).toFixed(2)}%
                                  </span>
                                )}
                              </div>
                              {r.startPrice != null && r.endPrice != null && (
                                <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#B89070', marginTop: '2px' }}>
                                  {r.startPrice.toFixed(2)} &rarr; {r.endPrice.toFixed(2)}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '16px', fontWeight: 700, color: isPos ? '#22c55e' : '#ef4444' }}>
                                {formatPnl(r.dollarPnl)}
                              </div>
                              <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: isPos ? '#22c55e' : '#ef4444', opacity: 0.8 }}>
                                {formatPct(r.effectivePct)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                {/* Total P&L summary */}
                {(() => {
                  const investedAfterPnl = Math.max(0, spent + currentResult.totalPnl)
                  const newMaxUnits = Math.floor(investedAfterPnl / UNIT_COST)
                  const totalUnitDelta = newMaxUnits - totalUnits
                  return (
                    <div className="counter-up" style={{
                      marginTop: '20px',
                      background: currentResult.totalPnl >= 0 ? '#f0fdf4' : '#fef2f2',
                      border: `1.5px solid ${currentResult.totalPnl >= 0 ? '#86efac' : '#fca5a5'}`,
                      borderRadius: '8px', padding: '16px 20px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50', letterSpacing: '2px', textTransform: 'uppercase' }}>
                          Round P&amp;L
                        </div>
                        <div>
                          <span style={{
                            fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 700,
                            color: currentResult.totalPnl >= 0 ? '#22c55e' : '#ef4444',
                          }}>
                            {formatPnl(currentResult.totalPnl)}
                          </span>
                          <span style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: currentResult.totalPnl >= 0 ? '#22c55e' : '#ef4444', marginLeft: '8px', opacity: 0.8 }}>
                            {formatPct(currentResult.totalPnl / currentResult.portfolioValueBefore)}
                          </span>
                        </div>
                      </div>
                      {totalUnitDelta !== 0 && (
                        <div style={{
                          marginTop: '10px', paddingTop: '10px',
                          borderTop: `1px solid ${currentResult.totalPnl >= 0 ? '#86efac50' : '#fca5a550'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50', letterSpacing: '2px', textTransform: 'uppercase' }}>
                            Portfolio Capacity
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Lora", serif', fontSize: '12px' }}>
                            <span style={{ color: '#8B6B50' }}>{totalUnits} unit{totalUnits !== 1 ? 's' : ''}</span>
                            <span style={{ color: '#B89070' }}>&rarr;</span>
                            <span style={{ fontWeight: 700, color: totalUnitDelta < 0 ? '#ef4444' : '#22c55e' }}>
                              {newMaxUnits} unit{newMaxUnits !== 1 ? 's' : ''}
                            </span>
                            <span style={{
                              background: totalUnitDelta < 0 ? '#fef2f2' : '#f0fdf4',
                              border: `1px solid ${totalUnitDelta < 0 ? '#fca5a5' : '#86efac'}`,
                              borderRadius: '4px', padding: '1px 7px',
                              color: totalUnitDelta < 0 ? '#ef4444' : '#22c55e',
                              fontWeight: 700, fontSize: '11px',
                            }}>
                              {totalUnitDelta > 0 ? '+' : '\u2212'}{Math.abs(totalUnitDelta)} {Math.abs(totalUnitDelta) === 1 ? 'animal' : 'animals'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

              </div>
            </div>

            {/* RIGHT: farm preview + news banderole + End Round */}
            <div style={{ background: '#F0E8D4', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

              <div style={{ padding: '28px 32px', borderBottom: '1px solid #E8D9C8', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 700, color: '#2C1810' }}>Your Farm</div>
                  <div style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#8B6B50', marginTop: '2px' }}>
                    Round {currentRound} &middot; {currentResult.timeSkipDays} months passed
                  </div>
                </div>
                <span style={{
                  fontFamily: '"Playfair Display", serif', fontSize: '16px', fontWeight: 700,
                  color: currentResult.totalPnl >= 0 ? '#22c55e' : '#ef4444',
                }}>
                  ${currentResult.portfolioValueAfter.toFixed(0)}
                </span>
              </div>

              {/* Farm animation */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 32px' }}>
                <AnimatedFarm
                  selected={selected}
                  animalNames={Object.fromEntries(LIVESTOCK.map(l => [l.id, l.animalName]))}
                  animalCats={Object.fromEntries(LIVESTOCK.map(l => [l.id, l.animalCategory]))}
                  imageMap={IMAGE_MAP}
                  pixelImageMap={PIXEL_IMAGE_MAP}
                  effects={activeEffects}
                />
              </div>

              {/* News banderole */}
              {currentEvents.length > 0 && (
                <div style={{
                  background: '#2C1810', overflow: 'hidden',
                  display: 'flex', alignItems: 'stretch',
                  borderTop: '1px solid #4A2C1A', borderBottom: '1px solid #4A2C1A',
                  height: '40px',
                }}>
                  {/* LIVE label */}
                  <div style={{
                    flexShrink: 0, background: '#C4622D', padding: '0 14px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontFamily: '"Lora", serif', fontSize: '10px', fontWeight: 700,
                    color: '#FAF4E8', letterSpacing: '2px', textTransform: 'uppercase',
                    zIndex: 1,
                  }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#FAF4E8', animation: 'fadeIn 1s ease infinite alternate' }} />
                    Live
                  </div>
                  {/* Scrolling ticker */}
                  <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      display: 'inline-flex', gap: '0',
                      animation: `marquee ${currentEvents.length * 8}s linear infinite`,
                      whiteSpace: 'nowrap',
                    }}>
                      {/* Doubled for seamless loop */}
                      {[...currentEvents, ...currentEvents].map((ev, i) => (
                        <span key={i} style={{
                          fontFamily: '"Lora", serif', fontSize: '12px', color: '#FAF4E8',
                          padding: '0 32px', lineHeight: '40px', display: 'inline-flex', alignItems: 'center', gap: '8px',
                        }}>
                          <span>{ev.icon}</span>
                          <span style={{ color: ev.isPositive ? '#86efac' : '#fca5a5', fontWeight: 600 }}>
                            {ev.isPositive ? '+' : '\u2212'}
                          </span>
                          {ev.title}
                          <span style={{ color: '#8B6B50', margin: '0 8px' }}>&middot;</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* End Round button */}
              <div style={{ padding: '20px 32px', borderTop: '1px solid #E8D9C8', background: '#FAF4E8', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={handleRoundComplete}
                  style={{
                    padding: '12px 40px',
                    background: '#2D6A4F',
                    color: '#FAF4E8', border: 'none', borderRadius: '999px',
                    fontFamily: '"Playfair Display", serif', fontSize: '15px',
                    fontWeight: 700, cursor: 'pointer',
                    letterSpacing: '1px', transition: 'all 0.2s',
                    boxShadow: '0 4px 16px rgba(45,106,79,0.3)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#3A8A63' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#2D6A4F' }}
                >
                  {currentRound >= TOTAL_ROUNDS ? 'See Final Results' : `End Round \u00B7 Start Round ${currentRound + 1}`}
                </button>
              </div>
            </div>

          </div>
        </>
      )}

      {/* Rewind overlay ? full-screen historical round viewer */}
      {rewindRound !== null && (() => {
        const result = roundHistory.find(h => h.round === rewindRound)
        if (!result) return null
        const rewindEvents = result.eventIds.map(id => getEventById(id))
        const rewindEvent  = rewindEvents[0] ?? null
        const rewindSelected: Record<string, number> = Object.fromEntries(
          result.assetResults
            .map(r => {
              const l = LIVESTOCK.find(lv => lv.assetName === r.assetName)
              return l ? [l.id, r.units] as [string, number] : null
            })
            .filter((e): e is [string, number] => e !== null)
        )
        const prevResult = roundHistory.find(h => h.round === rewindRound - 1) ?? null
        const nextResult = roundHistory.find(h => h.round === rewindRound + 1) ?? null
        const fmt = (d: Date) => (d instanceof Date ? d : new Date(d)).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: '#FAF4E8', zIndex: 600,
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.18s ease',
          }}>
            {/* Top bar ? beige, matches the rest of the screen */}
            <div style={{
              height: '64px', background: '#FAF4E8', flexShrink: 0,
              display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px',
              borderBottom: '1px solid #E8D9C8',
            }}>
              <div style={{
                fontFamily: '"Playfair Display", serif', fontSize: '18px', fontWeight: 700,
                color: '#2C1810', letterSpacing: '0.5px',
              }}>
                Rewind &middot; Round {rewindRound}
                <span style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B5090', marginLeft: '10px' }}>
                  {fmt(result.startDate)} &rarr; {fmt(result.endDate)}
                </span>
              </div>

              <div style={{ flex: 1 }} />

              {/* Round stats */}
              {[
                { label: 'Round P&L', value: formatPnl(result.totalPnl), color: result.totalPnl >= 0 ? '#16a34a' : '#dc2626' },
                { label: 'Portfolio After', value: `$${result.portfolioValueAfter.toFixed(0)}`, color: '#2C1810' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', marginRight: '8px' }}>
                  <div style={{ fontFamily: '"Lora", serif', fontSize: '9px', color: '#8B6B5080', letterSpacing: '2px', textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '15px', fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Mini timeline strip ï¿½?? beige, no stray white lines */}
            <div style={{
              background: '#F2E8D8', borderBottom: '1px solid #E0CEB4',
              padding: '10px 24px', display: 'flex', alignItems: 'center', flexShrink: 0, gap: '12px',
            }}>
              <span style={{ fontFamily: '"Lora", serif', fontSize: '9px', color: '#8B6B5090', letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>&#x2190; Past</span>
              <div style={{ flex: 1, display: 'flex', gap: '6px', alignItems: 'center', position: 'relative' }}>
                {roundHistory.map(h => {
                  const isPos = h.totalPnl >= 0
                  const isActive = h.round === rewindRound
                  return (
                    <button
                      key={h.round}
                      onClick={() => setRewindRound(h.round)}
                      title={`Round ${h.round} Â· ${formatPnl(h.totalPnl)}`}
                      style={{
                        flex: 1, height: '28px', borderRadius: '14px',
                        background: isActive
                          ? (isPos ? '#2D6A4F' : '#8B3A28')
                          : (isPos ? 'rgba(45,106,79,0.10)' : 'rgba(139,58,40,0.10)'),
                        border: `1.5px solid ${isActive
                          ? (isPos ? '#2D6A4F' : '#8B3A28')
                          : (isPos ? 'rgba(45,106,79,0.30)' : 'rgba(139,58,40,0.30)')}`,
                        cursor: 'pointer',
                        fontFamily: '"Lora", serif', fontSize: '10px', fontWeight: 600,
                        color: isActive ? '#FAF4E8' : (isPos ? '#2D6A4F' : '#8B3A28'),
                        transition: 'all 0.15s',
                        position: 'relative', zIndex: 1,
                        boxShadow: 'none',
                      }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = isPos ? 'rgba(45,106,79,0.20)' : 'rgba(139,58,40,0.20)'; e.currentTarget.style.borderColor = isPos ? 'rgba(45,106,79,0.55)' : 'rgba(139,58,40,0.55)' } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = isPos ? 'rgba(45,106,79,0.10)' : 'rgba(139,58,40,0.10)'; e.currentTarget.style.borderColor = isPos ? 'rgba(45,106,79,0.30)' : 'rgba(139,58,40,0.30)' } }}
                    >
                      R{h.round}
                    </button>
                  )
                })}
              </div>
              <span style={{ fontFamily: '"Lora", serif', fontSize: '9px', color: '#8B6B5090', letterSpacing: '2px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Recent &#x2192;</span>
            </div>

            {/* Two-column body */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '40% 60%', overflow: 'hidden' }}>

              {/* LEFT: per-asset P&L */}
              <div style={{ borderRight: '1px solid #E8D9C8', overflowY: 'auto', padding: '28px 28px 48px', position: 'relative' }}>
                {/* "NEWS" section label */}
                <div style={{ fontFamily: '"Lora", serif', fontSize: '9px', color: '#8B6B5080', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  News
                </div>

                {/* Event chips ? hover to reveal full news */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {rewindEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="event-chip"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: `${ev.color}12`, border: `1px solid ${ev.color}35`,
                        borderRadius: '4px', padding: '6px 14px', cursor: 'default',
                      }}
                      onMouseEnter={() => setRewindHoveredEventId(ev.id)}
                      onMouseLeave={() => setRewindHoveredEventId(null)}
                    >
                      <span>{ev.icon}</span>
                      <span style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#2C1810', fontWeight: 600 }}>{ev.title}</span>
                    </div>
                  ))}
                </div>

                {/* Full-news hover overlay */}
                {rewindHoveredEventId !== null && (() => {
                  const ev = rewindEvents.find(e => e.id === rewindHoveredEventId)
                  if (!ev) return null
                  return (
                    <div style={{
                      position: 'fixed', top: '160px', left: '16px',
                      width: 'calc(40vw - 32px)',
                      background: '#2C1810',
                      borderRadius: '10px', padding: '18px 20px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.40)',
                      border: `1px solid ${ev.color}55`,
                      zIndex: 700,
                      animation: 'eventOverlayIn 0.16s ease both',
                      pointerEvents: 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '22px' }}>{ev.icon}</span>
                        <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '14px', fontWeight: 700, color: '#FAF4E8', lineHeight: 1.3 }}>
                          {ev.title}
                        </div>
                      </div>
                      <div style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#C8A882', lineHeight: '1.7' }}>
                        {ev.description}
                      </div>
                      <div style={{
                        marginTop: '12px', paddingTop: '10px',
                        borderTop: `1px solid ${ev.color}30`,
                        fontFamily: '"Lora", serif', fontSize: '10px',
                        color: ev.color, letterSpacing: '1.5px', textTransform: 'uppercase',
                      }}>
                        {ev.impactLabel}
                      </div>
                    </div>
                  )
                })()}

                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '16px', fontWeight: 700, color: '#2C1810' }}>
                    Your Livestock &middot; Round {rewindRound}
                  </div>
                  {(() => {
                    const typeCounts: Partial<Record<AssetType, number>> = {}
                    result.assetResults.forEach(r => {
                      const ls = LIVESTOCK_TYPED.find(l => l.assetName === r.assetName)
                      if (ls) {
                        typeCounts[ls.assetType] = (typeCounts[ls.assetType] ?? 0) + r.units
                      }
                    })
                    return ASSET_TYPE_ORDER.filter(t => typeCounts[t]).map(t => (
                      <div key={t} style={{
                        fontFamily: '"Lora", serif', fontSize: '11px', color: '#6B5240',
                        background: '#F0E8D4', border: '1px solid #DDD0B8',
                        borderRadius: '5px', padding: '2px 8px',
                      }}>
                        {typeCounts[t]} {t}{(typeCounts[t] ?? 0) > 1 ? 's' : ''}
                      </div>
                    ))
                  })()}
                </div>

                {/* Asset cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.assetResults.map((r, i) => {
                    const meta = CATEGORY_META[r.animalCategory]
                    const isPos = r.dollarPnl >= 0
                    // Unit delta vs the previous round for this same asset
                    const prevAsset = prevResult?.assetResults.find(a => a.assetName === r.assetName)
                    const unitDelta = prevAsset !== undefined ? r.units - prevAsset.units : null
                    const invested = r.units * UNIT_COST
                    return (
                      <div key={r.assetName} style={{
                        animationDelay: `${i * 0.06}s`,
                        background: 'white', border: `1px solid ${isPos ? '#bbf7d030' : '#fecaca30'}`,
                        borderLeft: `3px solid ${isPos ? '#22c55e' : '#ef4444'}`,
                        borderRadius: '8px', padding: '12px 16px',
                        boxShadow: '0 2px 8px rgba(44,24,16,0.05)',
                      }}>
                        {/* Top row: icon + name + units badge + P&L */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '6px',
                            background: '#F0E8D4', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px', border: '1px solid #E8D9C8',
                          }}>{meta.emoji}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '14px', fontWeight: 700, color: '#2C1810', lineHeight: 1.2 }}>
                              {r.animalName}
                            </div>
                            <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#8B6B50', marginTop: '1px' }}>
                              {r.assetName}
                            </div>
                          </div>
                          {/* Unit count ? prominent pill */}
                          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <div style={{
                              fontFamily: '"Playfair Display", serif', fontSize: '15px', fontWeight: 700,
                              color: '#2C1810', textAlign: 'center', lineHeight: 1.3,
                            }}>
                              {r.units}
                              <span style={{ fontFamily: '"Lora", serif', fontSize: '9px', color: '#8B6B50', fontWeight: 400, marginLeft: '3px' }}>
                                unit{r.units !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {/* Delta badge vs previous round */}
                            {unitDelta !== null && unitDelta !== 0 && (
                              <div style={{
                                background: unitDelta > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                borderRadius: '4px', padding: '1px 7px',
                                fontFamily: '"Lora", serif', fontSize: '9px', fontWeight: 700,
                                color: unitDelta > 0 ? '#16a34a' : '#dc2626',
                              }}>
                                {unitDelta > 0 ? '+' : ''}{unitDelta} vs R{rewindRound - 1}
                              </div>
                            )}
                            {unitDelta === null && (
                              <div style={{ fontFamily: '"Lora", serif', fontSize: '9px', color: '#8B6B5050' }}>
                                first round
                              </div>
                            )}
                          </div>
                          {/* P&L */}
                          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '72px' }}>
                            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '15px', fontWeight: 700, color: isPos ? '#22c55e' : '#ef4444' }}>
                              {formatPnl(r.dollarPnl)}
                            </div>
                            <div style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: isPos ? '#22c55e' : '#ef4444', opacity: 0.8 }}>
                              {formatPct(r.effectivePct)}
                            </div>
                          </div>
                        </div>
                        {/* Bottom row: invested value + price range + event impact */}
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(44,24,16,0.05)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#8B6B50' }}>
                            <span style={{ color: '#B89070' }}>$</span>{invested} invested
                          </span>
                          {r.startPrice != null && r.endPrice != null && (
                            <>
                              <span style={{ color: '#E8D9C8' }}>?</span>
                              <span style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: '#B89070' }}>
                                {r.startPrice.toFixed(2)} &rarr; {r.endPrice.toFixed(2)}
                              </span>
                            </>
                          )}
                          {r.isEventAffected && (
                            <>
                              <span style={{ color: '#E8D9C8' }}>?</span>
                              <span style={{ fontFamily: '"Lora", serif', fontSize: '10px', color: r.eventBonusPct >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                {rewindEvent?.icon} event {r.eventBonusPct >= 0 ? '+' : ''}{(r.eventBonusPct * 100).toFixed(2)}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Round P&L summary */}
                <div style={{
                  marginTop: '20px',
                  background: result.totalPnl >= 0 ? '#f0fdf4' : '#fef2f2',
                  border: `1.5px solid ${result.totalPnl >= 0 ? '#86efac' : '#fca5a5'}`,
                  borderRadius: '8px', padding: '16px 20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50', letterSpacing: '2px', textTransform: 'uppercase' }}>
                      Round P&amp;L
                    </div>
                    <div>
                      <span style={{
                        fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 700,
                        color: result.totalPnl >= 0 ? '#22c55e' : '#ef4444',
                      }}>
                        {formatPnl(result.totalPnl)}
                      </span>
                      <span style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: result.totalPnl >= 0 ? '#22c55e' : '#ef4444', marginLeft: '8px', opacity: 0.8 }}>
                        {formatPct(result.totalPnl / result.portfolioValueBefore)}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', fontFamily: '"Lora", serif', fontSize: '11px', color: '#8B6B50' }}>
                    ${result.portfolioValueBefore.toFixed(0)} &rarr; ${result.portfolioValueAfter.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* RIGHT: farm view */}
              <div style={{ background: '#F0E8D4', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
  
                <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #E8D9C8', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '18px', fontWeight: 700, color: '#2C1810' }}>Your Farm</div>
                    <div style={{ fontFamily: '"Lora", serif', fontSize: '12px', color: '#8B6B50', marginTop: '2px' }}>
                      Round {rewindRound} &middot; {getTimeSkipLabel(result.timeSkipDays)} passed
                    </div>
                  </div>
                  <span style={{
                    fontFamily: '"Playfair Display", serif', fontSize: '16px', fontWeight: 700,
                    color: result.totalPnl >= 0 ? '#22c55e' : '#ef4444',
                  }}>
                    ${result.portfolioValueAfter.toFixed(0)}
                  </span>
                </div>

                {/* Farm animation */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 32px' }}>
                  <AnimatedFarm
                    selected={rewindSelected}
                    animalNames={Object.fromEntries(LIVESTOCK.map(l => [l.id, l.animalName]))}
                    animalCats={Object.fromEntries(LIVESTOCK.map(l => [l.id, l.animalCategory]))}
                    imageMap={IMAGE_MAP}
                    pixelImageMap={PIXEL_IMAGE_MAP}
                    effects={getEffectsForEvents(rewindEvents)}
                  />
                </div>

                {/* News banderole */}
                {rewindEvents.length > 0 && (
                  <div style={{
                    background: '#2C1810', overflow: 'hidden',
                    display: 'flex', alignItems: 'stretch',
                    borderTop: '1px solid #4A2C1A', borderBottom: '1px solid #4A2C1A',
                    height: '40px',
                  }}>
                    <div style={{
                      flexShrink: 0, background: '#C4622D', padding: '0 14px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontFamily: '"Lora", serif', fontSize: '10px', fontWeight: 700,
                      color: '#FAF4E8', letterSpacing: '2px', textTransform: 'uppercase', zIndex: 1,
                    }}>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#FAF4E8' }} />
                      Rewind
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        display: 'inline-flex', gap: '0',
                        animation: `marquee ${rewindEvents.length * 8}s linear infinite`,
                        whiteSpace: 'nowrap',
                      }}>
                        {[...rewindEvents, ...rewindEvents].map((ev, i) => (
                          <span key={i} style={{
                            fontFamily: '"Lora", serif', fontSize: '12px', color: '#FAF4E8',
                            padding: '0 32px', lineHeight: '40px', display: 'inline-flex', alignItems: 'center', gap: '8px',
                          }}>
                            <span>{ev.icon}</span>
                            <span style={{ color: ev.isPositive ? '#86efac' : '#fca5a5', fontWeight: 600 }}>
                              {ev.isPositive ? '+' : '\u2212'}
                            </span>
                            {ev.title}
                            <span style={{ color: '#8B6B50', margin: '0 8px' }}>&middot;</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom nav strip */}
                <div style={{ padding: '16px 28px', borderTop: '1px solid #E8D9C8', background: '#FAF4E8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => prevResult && setRewindRound(prevResult.round)}
                    disabled={!prevResult}
                    style={{
                      padding: '8px 20px', borderRadius: '999px',
                      background: prevResult ? 'rgba(44,24,16,0.08)' : 'rgba(44,24,16,0.03)',
                      border: '1px solid rgba(44,24,16,0.15)',
                      color: prevResult ? '#2C1810' : '#2C181040',
                      cursor: prevResult ? 'pointer' : 'default',
                      fontFamily: '"Lora", serif', fontSize: '13px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (prevResult) e.currentTarget.style.background = 'rgba(44,24,16,0.14)' }}
                    onMouseLeave={e => { if (prevResult) e.currentTarget.style.background = 'rgba(44,24,16,0.08)' }}
                  >
                    &#x2190; Round {prevResult?.round ?? ''}
                  </button>
                  <button
                    onClick={() => setRewindRound(null)}
                    style={{
                      padding: '8px 20px', borderRadius: '999px',
                      background: 'transparent', border: '1px solid rgba(44,24,16,0.2)',
                      color: '#8B6B50', cursor: 'pointer',
                      fontFamily: '"Lora", serif', fontSize: '12px',
                    }}
                  >
                    &#x2715; Close
                  </button>
                  <button
                    onClick={() => nextResult && setRewindRound(nextResult.round)}
                    disabled={!nextResult}
                    style={{
                      padding: '8px 20px', borderRadius: '999px',
                      background: nextResult ? 'rgba(44,24,16,0.08)' : 'rgba(44,24,16,0.03)',
                      border: '1px solid rgba(44,24,16,0.15)',
                      color: nextResult ? '#2C1810' : '#2C181040',
                      cursor: nextResult ? 'pointer' : 'default',
                      fontFamily: '"Lora", serif', fontSize: '13px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (nextResult) e.currentTarget.style.background = 'rgba(44,24,16,0.14)' }}
                    onMouseLeave={e => { if (nextResult) e.currentTarget.style.background = 'rgba(44,24,16,0.08)' }}
                  >
                    Round {nextResult?.round ?? ''} &#x2192;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
