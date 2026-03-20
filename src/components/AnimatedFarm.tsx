/**
 * AnimatedFarm – HTML5 canvas, 60fps pixel-art farm scene.
 * 3 discrete regions: Livestock, Farming Land, Build Zone.
 */

import { useEffect, useRef } from 'react'
import { PIXEL_SPRITES } from './PixelAnimal'

// ── Public Effect Types ───────────────────────────────────────────────────────

export type FarmEffect =
  | { type: 'rain';        intensity?: number }
  | { type: 'storm' }
  | { type: 'drought' }
  | { type: 'locusts' }
  | { type: 'snow' }
  | { type: 'sparkles';    zone?: 'livestock' | 'farming' | 'build' | 'all' }
  | { type: 'disease';     zone?: 'livestock' | 'farming' | 'build' }
  | { type: 'golden_sky' }
  | { type: 'extra_clouds' }

// ── Internal Types ────────────────────────────────────────────────────────────

interface Critter {
  id:       string
  assetId:  string
  name:     string
  category: string
  x:        number
  y:        number
  vx:       number
  vy:       number
  frame:    number
  flip:     boolean
  bobOff:   number
  dying:    boolean
  dyingAge: number
}

interface Cloud        { x: number; y: number; speed: number; scale: number }
interface RainDrop     { x: number; y: number; speed: number; len: number }
interface SnowFlake    { x: number; y: number; speed: number; r: number; wobble: number }
interface Locust       { x: number; y: number; vx: number; vy: number }
interface Sparkle      { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; hue: number }
interface WindDebris   { x: number; y: number; vx: number; vy: number; len: number }
interface DustStreak   { x: number; y: number; speed: number; len: number; alpha: number }
interface Spore        { x: number; y: number; vy: number; wobbleOff: number; size: number }
interface PollenDot    { x: number; y: number; vx: number; vy: number; wobbleOff: number; life: number; maxLife: number }
interface FallingDebris{ x: number; y: number; vy: number; tilt: number; w: number; h: number }

// ── SVG cache ─────────────────────────────────────────────────────────────────

type Grid    = number[][]
type Palette = readonly string[]

function buildSvgDataUrl(grid: Grid, palette: Palette, size: number, flip: boolean): string {
  const cols = grid[0].length
  const px   = size / cols
  const transform = flip ? `transform="scale(-1,1) translate(-${size},0)"` : ''
  const rects = grid
    .flatMap((row, y) =>
      row.map((idx, x) => {
        if (idx === 0 || !palette[idx]) return ''
        return `<rect x="${(x * px).toFixed(1)}" y="${(y * px).toFixed(1)}" width="${(px + 0.5).toFixed(1)}" height="${(px + 0.5).toFixed(1)}" fill="${palette[idx]}"/>`
      }),
    )
    .join('')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ${transform}>${rects}</svg>`
  )}`
}

const svgCache = new Map<string, HTMLImageElement>()

function getSvgImg(name: string, size: number, flip: boolean): HTMLImageElement {
  const key = `${name}:${size}:${flip ? 1 : 0}`
  if (svgCache.has(key)) return svgCache.get(key)!
  const img    = new Image()
  const sprite = PIXEL_SPRITES[name]
  if (sprite) img.src = buildSvgDataUrl(sprite.grid as Grid, sprite.palette as Palette, size, flip)
  svgCache.set(key, img)
  return img
}

const urlCache = new Map<string, HTMLImageElement>()

function getUrlImg(url: string): HTMLImageElement {
  if (urlCache.has(url)) return urlCache.get(url)!
  const img = new Image()
  img.src   = url
  urlCache.set(url, img)
  return img
}

// ── Background removal (flood-fill from corners) ──────────────────────────────

const processedCache = new Map<string, HTMLImageElement>()

function getProcessedImg(url: string): HTMLImageElement | null {
  if (processedCache.has(url)) return processedCache.get(url)!
  const src = getUrlImg(url)
  if (!src.complete || src.naturalWidth === 0) return null

  const canvas = document.createElement('canvas')
  canvas.width  = src.naturalWidth
  canvas.height = src.naturalHeight
  const c = canvas.getContext('2d')!
  c.drawImage(src, 0, 0)
  const imgData = c.getImageData(0, 0, canvas.width, canvas.height)
  const d = imgData.data
  const w = canvas.width, h = canvas.height

  // Sample corner pixel as background reference
  const bgR = d[0], bgG = d[1], bgB = d[2]
  const TOL = 50

  // Flood fill from all 4 corners
  const visited = new Uint8Array(w * h)
  const stack: number[] = []
  for (const idx of [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1]) {
    if (!visited[idx]) { visited[idx] = 1; stack.push(idx) }
  }

  while (stack.length > 0) {
    const idx = stack.pop()!
    const p = idx * 4
    d[p + 3] = 0                          // make transparent
    const x = idx % w, y = (idx / w) | 0
    const ns = [x > 0 && idx - 1, x < w - 1 && idx + 1, y > 0 && idx - w, y < h - 1 && idx + w] as (number | false)[]
    for (const n of ns) {
      if (n === false || visited[n]) continue
      const np = n * 4
      if (Math.abs(d[np] - bgR) + Math.abs(d[np + 1] - bgG) + Math.abs(d[np + 2] - bgB) < TOL * 3) {
        visited[n] = 1; stack.push(n)
      }
    }
  }

  c.putImageData(imgData, 0, 0)
  const result = new Image()
  result.src = canvas.toDataURL('image/png')
  processedCache.set(url, result)
  return result
}

// ── Constants ────────────────────────────────────────────────────────────────

const W             = 480
const H             = 360
const SPRITE_SZ     = 32
const SKY_H         = H * 0.38
const MAX_PER_ASSET = 8
const MAX_TOTAL     = 40
const DYING_FRAMES  = 55
const ZONE_LIVE_X1  = 12,  ZONE_LIVE_X2  = 180
const ZONE_FARM_X1  = 190, ZONE_FARM_X2  = 350
const ZONE_BUILD_X1 = 360, ZONE_BUILD_X2 = W - 12
const ZONE_Y1       = SKY_H + 16, ZONE_Y2 = H - 20
const FENCE_C       = '#C8A460'
const FENCE_SH      = '#8B6520'

// ── Helpers ──────────────────────────────────────────────────────────────────

let _uid = 0
function uid() { return `c${++_uid}` }
function rand(a: number, b: number) { return a + Math.random() * (b - a) }
function isPlant(cat: string)    { return cat === 'Medicinal Plant' || cat === 'Grain Crop' }
function isBuilding(cat: string) { return cat === 'Collective' || cat === 'Tool' || cat === 'Hedge' }

function spawnLivestock(assetId: string, name: string, category: string): Critter {
  return {
    id: uid(), assetId, name, category,
    x:      rand(ZONE_LIVE_X1 + 8, ZONE_LIVE_X2 - SPRITE_SZ - 8),
    y:      rand(ZONE_Y1 + 10, ZONE_Y2 - SPRITE_SZ - 8),
    vx:     rand(0.4, 1.0) * (Math.random() < 0.5 ? 1 : -1),
    vy:     rand(0.08, 0.3) * (Math.random() < 0.5 ? 1 : -1),
    frame:  0, flip: Math.random() < 0.5, bobOff: rand(0, Math.PI * 2),
    dying: false, dyingAge: 0,
  }
}

function buildStaticCritters(
  sel: Record<string, number>,
  names: Record<string, string>,
  cats: Record<string, string>,
): Critter[] {
  const list: Critter[] = []
  let plantCount = 0, buildCount = 0
  for (const [id, count] of Object.entries(sel)) {
    if (count <= 0) continue
    const name = names[id]; const cat = cats[id] ?? ''
    if (!name || (!isPlant(cat) && !isBuilding(cat))) continue
    const cap = Math.min(count, 4)
    for (let i = 0; i < cap; i++) {
      if (isPlant(cat)) {
        const c = plantCount % 2, r = Math.floor(plantCount / 2)
        list.push({ id: uid(), assetId: id, name, category: cat,
          x: ZONE_FARM_X1 + 15 + c * 60, y: ZONE_Y1 + 15 + r * 45,
          vx: 0, vy: 0, frame: 0, flip: false, bobOff: 0, dying: false, dyingAge: 0 })
        plantCount++
      } else {
        const c = buildCount % 2, r = Math.floor(buildCount / 2)
        list.push({ id: uid(), assetId: id, name, category: cat,
          x: ZONE_BUILD_X1 + 10 + c * 50, y: ZONE_Y1 + 10 + r * 50,
          vx: 0, vy: 0, frame: 0, flip: false, bobOff: 0, dying: false, dyingAge: 0 })
        buildCount++
      }
    }
  }
  return list
}

function spawnClouds(): Cloud[] {
  return [
    { x: 40,  y: rand(18, 48), speed: 0.22, scale: 1.0  },
    { x: 200, y: rand(22, 52), speed: 0.16, scale: 0.75 },
    { x: 360, y: rand(15, 40), speed: 0.28, scale: 1.2  },
  ]
}

function spawnExtraClouds(): Cloud[] {
  return [
    { x: 110, y: rand(12, 38), speed: 0.20, scale: 0.9  },
    { x: 280, y: rand(8,  32), speed: 0.25, scale: 1.05 },
    { x: 430, y: rand(18, 44), speed: 0.17, scale: 0.85 },
    { x:  70, y: rand(5,  25), speed: 0.19, scale: 1.15 },
    { x: 340, y: rand(20, 45), speed: 0.22, scale: 0.80 },
  ]
}

// Generate a zigzag lightning bolt path
function makeBolt(): number[] {
  const segs: number[] = []; let cx = 0
  for (let i = 0; i < 8; i++) { cx += rand(-18, 18); cx = Math.max(-28, Math.min(28, cx)); segs.push(cx) }
  return segs
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  selected:      Record<string, number>
  animalNames:   Record<string, string>
  animalCats:    Record<string, string>
  imageMap:      Record<string, string>
  pixelImageMap: Record<string, string>
  effects?:      FarmEffect[]
}

export function AnimatedFarm({
  selected, animalNames, animalCats, imageMap, pixelImageMap, effects = [],
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)

  const stateRef = useRef<{
    critters:    Critter[]
    clouds:      Cloud[]
    extraClouds: Cloud[]
    rain:        RainDrop[]
    snow:        SnowFlake[]
    locusts:     Locust[]
    sparkles:    Sparkle[]
    windDebris:  WindDebris[]
    dust:        DustStreak[]
    spores:      Spore[]
    pollen:      PollenDot[]
    debris:      FallingDebris[]
    tick:        number
    lightningCD: number
    boltX:       number
    boltSegs:    number[]
    boltAge:     number
    effects:     FarmEffect[]
  }>({
    critters: [], clouds: [], extraClouds: [],
    rain: [], snow: [], locusts: [], sparkles: [],
    windDebris: [], dust: [], spores: [], pollen: [], debris: [],
    tick: 0, lightningCD: 180, boltX: -1, boltSegs: [], boltAge: 999,
    effects: [],
  })

  const propsRef = useRef({ selected, animalNames, animalCats, imageMap, pixelImageMap })
  propsRef.current = { selected, animalNames, animalCats, imageMap, pixelImageMap }

  const prevSelectedRef = useRef<Record<string, number> | null>(null)

  // ── One-time RAF setup ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    const { selected: s0, animalNames: n0, animalCats: c0 } = propsRef.current

    const initLive: Critter[] = []
    for (const [id, count] of Object.entries(s0)) {
      const name = n0[id]; const cat = c0[id] ?? ''
      if (!name || isPlant(cat) || isBuilding(cat)) continue
      for (let i = 0; i < Math.min(count, MAX_PER_ASSET) && initLive.length < MAX_TOTAL; i++)
        initLive.push(spawnLivestock(id, name, cat))
    }

    stateRef.current.critters    = [...initLive, ...buildStaticCritters(s0, n0, c0)]
    stateRef.current.clouds      = spawnClouds()
    stateRef.current.extraClouds = []
    prevSelectedRef.current      = { ...s0 }

    for (const [id, count] of Object.entries(s0)) {
      if (!count) continue
      const name = n0[id]; const cat = c0[id] ?? ''
      if (!name) continue
      if (PIXEL_SPRITES[name]) { getSvgImg(name, SPRITE_SZ, false); getSvgImg(name, SPRITE_SZ, true) }
      else if (propsRef.current.pixelImageMap[cat]) getUrlImg(propsRef.current.pixelImageMap[cat])
      else if (propsRef.current.imageMap[name])     getUrlImg(propsRef.current.imageMap[name])
    }

    // ── Draw helpers ──────────────────────────────────────────────────────

    const has = (type: string) => stateRef.current.effects.some(e => e.type === type)

    // ── Sky ──────────────────────────────────────────────────────────────

    function drawSky() {
      const g = ctx.createLinearGradient(0, 0, 0, SKY_H)
      if      (has('golden_sky')) { g.addColorStop(0, '#F5C842'); g.addColorStop(1, '#FFE8A0') }
      else if (has('storm'))      { g.addColorStop(0, '#30404E'); g.addColorStop(1, '#586878') }
      else if (has('rain'))       { g.addColorStop(0, '#485870'); g.addColorStop(1, '#7090A8') }
      else if (has('drought'))    { g.addColorStop(0, '#E8A040'); g.addColorStop(1, '#F5CC80') }
      else if (has('snow'))       { g.addColorStop(0, '#9AACBC'); g.addColorStop(1, '#C8D8E8') }
      else                        { g.addColorStop(0, '#5AD4FF'); g.addColorStop(1, '#A8E8FF') }
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, SKY_H)
    }

    // ── Mountains ────────────────────────────────────────────────────────

    function drawAlpsMountain() {
      const base = SKY_H + 2
      // Snow effect on mountains
      const snowTint = has('snow') ? 0.5 : 0
      ctx.fillStyle = `rgba(180,195,210,${0.5 + snowTint})`
      ctx.beginPath(); ctx.moveTo(290, base); ctx.lineTo(345, base - 32); ctx.lineTo(400, base); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#90AEBB'
      ctx.beginPath(); ctx.moveTo(180, base); ctx.lineTo(242, base - 50); ctx.lineTo(305, base); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#7A9AAA'
      ctx.beginPath(); ctx.moveTo(242, base - 50); ctx.lineTo(305, base); ctx.lineTo(274, base); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#7A9AAA'
      ctx.beginPath(); ctx.moveTo(222, base); ctx.lineTo(298, base - 78); ctx.lineTo(374, base); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#5C7D8E'
      ctx.beginPath(); ctx.moveTo(298, base - 78); ctx.lineTo(374, base); ctx.lineTo(336, base); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#8CB0BF'
      ctx.beginPath(); ctx.moveTo(298, base - 78); ctx.lineTo(222, base); ctx.lineTo(250, base); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#EDF2F6'
      ctx.beginPath(); ctx.moveTo(276, base - 62); ctx.lineTo(298, base - 78); ctx.lineTo(320, base - 62); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.moveTo(230, base - 40); ctx.lineTo(242, base - 50); ctx.lineTo(254, base - 40); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.moveTo(337, base - 24); ctx.lineTo(345, base - 32); ctx.lineTo(353, base - 24); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.moveTo(294, base - 70); ctx.lineTo(298, base - 78); ctx.lineTo(302, base - 70); ctx.closePath(); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.fillRect(264, base - 55, 14, 2); ctx.fillRect(280, base - 48, 10, 2)
    }

    // ── Swiss Flag ────────────────────────────────────────────────────────

    function drawSwissFlag(tick: number) {
      const px = ZONE_BUILD_X1 + 52
      const poleTop = ZONE_Y1 - 42, poleBase = ZONE_Y1 + 4
      ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(px + 3, poleTop + 6, 2, poleBase - poleTop)
      ctx.fillStyle = '#B0B0B0'; ctx.fillRect(px,     poleTop, 2, poleBase - poleTop)
      ctx.fillStyle = '#D8D8D8'; ctx.fillRect(px,     poleTop, 1, poleBase - poleTop)
      ctx.fillStyle = '#C0C0C0'; ctx.fillRect(px - 1, poleTop - 1, 4, 3)
      ctx.fillStyle = '#E8E8E8'; ctx.fillRect(px,     poleTop - 2, 2, 2)
      // Storm: flag whips violently; normal: gentle wave
      const amp   = has('storm') ? 3.5 : 1.5
      const speed = has('storm') ? 0.12 : 0.06
      const fs = 22, fx = px + 2, fy = poleTop
      for (let row = 0; row < fs; row++) {
        const wave = Math.round(amp * Math.sin(tick * speed + row * 0.35))
        ctx.fillStyle = '#D52B1E'; ctx.fillRect(fx + wave, fy + row, fs, 1)
      }
      for (let row = 0; row < fs; row++) {
        const wave = Math.round(amp * Math.sin(tick * speed + row * 0.35))
        ctx.fillStyle = '#FFFFFF'
        if (row >= 9 && row <= 12) ctx.fillRect(fx + wave + 4, fy + row, 14, 1)
        else if (row >= 4 && row <= 17) ctx.fillRect(fx + wave + 9, fy + row, 4, 1)
      }
      ctx.fillStyle = 'rgba(0,0,0,0.10)'
      ctx.fillRect(fx + fs, fy, 1, fs); ctx.fillRect(fx, fy + fs, fs + 1, 1)
    }

    // ── Ground ────────────────────────────────────────────────────────────

    function drawGround() {
      const drought = has('drought')
      const snow    = has('snow')
      ctx.fillStyle = drought ? '#C8A840' : snow ? '#D8E8F0' : '#6BBF5A'
      ctx.fillRect(0, SKY_H, W, H - SKY_H)
      ctx.fillStyle = drought ? '#A8882A' : snow ? '#C8D8E8' : '#58A848'
      ctx.fillRect(ZONE_LIVE_X1 - 4, ZONE_Y1 - 4, ZONE_LIVE_X2 - ZONE_LIVE_X1 + 8, ZONE_Y2 - ZONE_Y1 + 8)
      ctx.fillStyle = drought ? '#5A3018' : '#4D3B2D'
      ctx.fillRect(ZONE_FARM_X1, ZONE_Y1, ZONE_FARM_X2 - ZONE_FARM_X1, ZONE_Y2 - ZONE_Y1)
      ctx.strokeStyle = drought ? '#3A1C08' : '#3D2B1D'; ctx.lineWidth = 1
      for (let fx = ZONE_FARM_X1 + 10; fx < ZONE_FARM_X2; fx += 15) {
        ctx.beginPath(); ctx.moveTo(fx, ZONE_Y1); ctx.lineTo(fx, ZONE_Y2); ctx.stroke()
      }
      ctx.fillStyle = snow ? '#C8D8E8' : '#8FB185'
      ctx.fillRect(ZONE_BUILD_X1, ZONE_Y1, ZONE_BUILD_X2 - ZONE_BUILD_X1, ZONE_Y2 - ZONE_Y1)
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      for (let bx = ZONE_BUILD_X1 + 10; bx < ZONE_BUILD_X2; bx += 20)
        for (let by = ZONE_Y1 + 10; by < ZONE_Y2; by += 20) ctx.fillRect(bx, by, 2, 2)
      ctx.fillStyle = drought ? '#806020' : snow ? '#B8CCD8' : '#2A7020'
      ctx.fillRect(0, SKY_H, W, 4)
      if (drought) {
        ctx.strokeStyle = 'rgba(80,40,0,0.35)'; ctx.lineWidth = 1
        const cracks: [number,number,number,number][] = [
          [18,198,45,218],[60,180,32,206],[95,192,138,208],[70,215,88,238],[30,224,55,210],
        ]
        for (const [x1,y1,x2,y2] of cracks) { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke() }
      }
      // Snow: thin white accumulation on ground surfaces
      if (snow) {
        ctx.fillStyle = 'rgba(240,248,255,0.7)'
        ctx.fillRect(0, SKY_H, W, 3)
        ctx.fillRect(ZONE_LIVE_X1 - 4, ZONE_Y1 - 4, ZONE_LIVE_X2 - ZONE_LIVE_X1 + 8, 3)
        ctx.fillRect(ZONE_BUILD_X1, ZONE_Y1, ZONE_BUILD_X2 - ZONE_BUILD_X1, 3)
      }
    }

    // ── Clouds ────────────────────────────────────────────────────────────

    function drawCloud(c: Cloud, dark: boolean) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(c.scale, c.scale)
      ctx.globalAlpha = dark ? 0.80 : 0.9
      ctx.fillStyle = dark ? '#8898AC' : '#C8E8F8'; ctx.fillRect(4, 22, 56, 5)
      ctx.fillStyle = dark ? '#AABAC8' : '#FFFFFF'
      for (const [bx, by, bw, bh] of [[8,12,18,10],[0,16,34,12],[24,10,16,10],[12,8,14,8]])
        ctx.fillRect(bx, by, bw, bh)
      ctx.globalAlpha = 1; ctx.restore()
    }

    // Big dark rain clouds with puffy tops and drips
    function drawRainClouds(tick: number) {
      const defs = [
        { baseX:   0, baseY: 3,  w: 185, h: 34, speed: 0.040 },
        { baseX: 150, baseY: 0,  w: 210, h: 38, speed: 0.033 },
        { baseX: 320, baseY: 5,  w: 175, h: 32, speed: 0.047 },
        { baseX: 460, baseY: 2,  w: 190, h: 36, speed: 0.036 },
      ]
      for (const d of defs) {
        const x = ((d.baseX + tick * d.speed) % (W + 240)) - 100
        ctx.save()
        ctx.fillStyle = '#687888'
        for (let px = x + 14; px < x + d.w - 14; px += 30) {
          ctx.fillRect(px - 12, d.baseY - 8,  24, 10)
          ctx.fillRect(px - 8,  d.baseY - 13, 16,  7)
          ctx.fillRect(px - 5,  d.baseY - 17, 10,  6)
        }
        ctx.fillStyle = '#536070'
        ctx.fillRect(x, d.baseY, d.w, d.h)
        ctx.fillStyle = '#687888'
        ctx.fillRect(x + 4, d.baseY, d.w - 8, 5)
        ctx.fillStyle = '#3C4A58'
        ctx.fillRect(x, d.baseY + d.h - 6, d.w, 6)
        ctx.fillStyle = '#7AAAC8'
        for (let px = x + 10; px < x + d.w - 6; px += 12) {
          const dripLen = 5 + ((Math.floor(px * 13 + d.baseY * 7)) % 7)
          ctx.fillRect(px, d.baseY + d.h, 2, dripLen)
        }
        ctx.restore()
      }
    }

    // ── Sun ───────────────────────────────────────────────────────────────

    function drawSun(tick: number) {
      if (has('storm') || has('rain') || has('snow')) return
      const drought    = has('drought')
      const goldenSky  = has('golden_sky')
      const scale = drought    ? (1.3 + 0.10 * Math.sin(tick * 0.035))
                  : goldenSky  ? (1.1 + 0.06 * Math.sin(tick * 0.025))
                  :               1 + 0.06 * Math.sin(tick * 0.035)
      const cx = W - 44, cy = 32
      ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale)

      if (goldenSky) {
        // Slow rotating golden rays
        for (let i = 0; i < 12; i++) {
          const angle  = (i / 12) * Math.PI * 2 + tick * 0.004
          const alpha  = 0.25 + 0.15 * Math.sin(tick * 0.06 + i * 0.5)
          const innerR = 16, outerR = 52
          ctx.strokeStyle = `rgba(255,210,50,${alpha.toFixed(2)})`
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR)
          ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR)
          ctx.stroke()
        }
        // Warm glow halo
        const halo = ctx.createRadialGradient(0, 0, 10, 0, 0, 38)
        halo.addColorStop(0, 'rgba(255,220,60,0.50)'); halo.addColorStop(1, 'rgba(255,180,20,0)')
        ctx.fillStyle = halo; ctx.fillRect(-38, -38, 76, 76)
        // Core
        ctx.fillStyle = '#FFD020'; ctx.fillRect(-10, -10, 20, 20)
        ctx.fillStyle = '#FFEC70'; ctx.fillRect(-7, -7, 14, 14)
        ctx.fillStyle = '#FFCC00'
        for (const [rx,ry] of [[-14,0],[14,0],[0,-14],[0,14],[-10,-10],[10,-10],[-10,10],[10,10]])
          ctx.fillRect(rx-2,ry-2,4,4)
      } else if (drought) {
        const g = ctx.createRadialGradient(0, 0, 8, 0, 0, 34)
        g.addColorStop(0, 'rgba(255,150,0,0.75)'); g.addColorStop(1, 'rgba(255,100,0,0)')
        ctx.fillStyle = g; ctx.fillRect(-34, -34, 68, 68)
        ctx.fillStyle = '#FF7000'; ctx.fillRect(-10, -10, 20, 20)
        ctx.fillStyle = '#FF9A20'; ctx.fillRect(-7, -7, 14, 14)
        ctx.fillStyle = '#FF5000'
        for (const [rx,ry] of [[-16,0],[16,0],[0,-16],[0,16],[-12,-12],[12,-12],[-12,12],[12,12]])
          ctx.fillRect(rx-3,ry-3,6,6)
      } else {
        const g = ctx.createRadialGradient(0, 0, 6, 0, 0, 24)
        g.addColorStop(0, 'rgba(255,230,80,0.55)'); g.addColorStop(1, 'rgba(255,230,80,0)')
        ctx.fillStyle = g; ctx.fillRect(-24, -24, 48, 48)
        ctx.fillStyle = '#FFE020'; ctx.fillRect(-9, -9, 18, 18)
        ctx.fillStyle = '#FFEA60'; ctx.fillRect(-6, -6, 12, 12)
        ctx.fillStyle = '#FFD000'
        for (const [rx,ry] of [[-14,0],[14,0],[0,-14],[0,14],[-10,-10],[10,-10],[-10,10],[10,10]])
          ctx.fillRect(rx-2,ry-2,4,4)
      }
      ctx.restore()
    }

    // ── Fence ─────────────────────────────────────────────────────────────

    function drawFence() {
      const x1 = ZONE_LIVE_X1 - 4, y1 = ZONE_Y1 - 4
      const x2 = ZONE_LIVE_X2 + 4, y2 = ZONE_Y2 + 4
      const postH = 12
      const rails = [y1 + postH, y1 + Math.round((y2 - y1) * 0.42), y2 - postH]
      ctx.fillStyle = FENCE_C
      for (const ry of rails) { ctx.fillRect(x1, ry - 2, x2 - x1, 4); ctx.fillStyle = FENCE_SH; ctx.fillRect(x1, ry + 1, x2 - x1, 1); ctx.fillStyle = FENCE_C }
      for (let px = x1; px <= x2; px += 25) { ctx.fillStyle = FENCE_C; ctx.fillRect(px - 2, y1, 4, y2 - y1); ctx.fillStyle = FENCE_SH; ctx.fillRect(px + 1, y1, 1, y2 - y1) }
      ctx.fillStyle = FENCE_C
      for (const ry of rails) { ctx.fillRect(x1, ry - 2, x2 - x1, 4); ctx.fillStyle = FENCE_SH; ctx.fillRect(x1, ry + 1, x2 - x1, 1); ctx.fillStyle = FENCE_C }
    }

    // ── House ─────────────────────────────────────────────────────────────

    function drawHouse() {
      const hx = W - 62, hy = H - 58
      ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(hx + 4, hy + 44, 48, 10)
      ctx.fillStyle = '#D4A860'; ctx.fillRect(hx, hy + 18, 48, 36)
      ctx.fillStyle = '#C09040'
      for (let py = hy + 24; py < hy + 54; py += 8) ctx.fillRect(hx, py, 48, 2)
      ctx.fillStyle = '#702010'
      ctx.beginPath(); ctx.moveTo(hx - 4, hy + 18); ctx.lineTo(hx + 24, hy); ctx.lineTo(hx + 52, hy + 18); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#A03020'; ctx.fillRect(hx + 14, hy + 4, 4, 10)
      ctx.fillStyle = '#6B3A10'; ctx.fillRect(hx + 18, hy + 30, 12, 24)
      ctx.fillStyle = '#C88040'; ctx.fillRect(hx + 22, hy + 40, 3, 3)
      ctx.fillStyle = '#A8D8F8'; ctx.fillRect(hx + 6, hy + 26, 10, 8)
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(hx + 10, hy + 26, 1, 8); ctx.fillRect(hx + 6, hy + 30, 10, 1)
      ctx.fillStyle = '#883020'; ctx.fillRect(hx + 34, hy + 2, 8, 18)
      ctx.fillStyle = '#AA4030'; ctx.fillRect(hx + 34, hy + 2, 8, 4)
      ctx.fillStyle = '#FAF4E8'; ctx.font = '8px "Lora", serif'
      ctx.fillText('BUILD ZONE', ZONE_BUILD_X1 + 10, ZONE_Y2 + 5)
    }

    // ── Trees ─────────────────────────────────────────────────────────────

    function drawTree(tx: number, ty: number) {
      // In snow: white-tipped trees
      ctx.fillStyle = '#7B4518'; ctx.fillRect(tx - 3, ty + 14, 6, 16)
      ctx.fillStyle = has('snow') ? '#4A8040' : '#2A9A30'
      for (const [lx, ly, lw] of [[tx, ty + 10, 16],[tx, ty + 4, 12],[tx, ty, 8]] as [number,number,number][])
        ctx.fillRect(lx - lw / 2, ly, lw, 10)
      if (has('snow')) {
        ctx.fillStyle = 'rgba(230,245,255,0.85)'
        for (const [lx, ly, lw] of [[tx, ty + 10, 16],[tx, ty + 4, 12],[tx, ty, 8]] as [number,number,number][])
          ctx.fillRect(lx - lw / 2, ly, lw, 3)
      } else {
        ctx.fillStyle = '#48C848'
        for (const [lx, ly, lw] of [[tx, ty + 10, 16],[tx, ty + 4, 12],[tx, ty, 8]] as [number,number,number][])
          ctx.fillRect(lx - lw / 2 + 2, ly, lw - 4, 4)
      }
    }

    // ── Critters ──────────────────────────────────────────────────────────

    function drawCritter(c: Critter, bob: number) {
      const sz = SPRITE_SZ, dx = Math.round(c.x), dy = Math.round(c.y + bob)
      const { imageMap: im, pixelImageMap: pm } = propsRef.current
      const pixUrl = pm[c.category]
      if (pixUrl) {
        const img = getProcessedImg(pixUrl)
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save(); ctx.imageSmoothingEnabled = false
          if (c.flip) { ctx.translate(dx + sz / 2, dy); ctx.scale(-1, 1); ctx.translate(-sz / 2, 0); ctx.drawImage(img, 0, 0, sz, sz) }
          else ctx.drawImage(img, dx, dy, sz, sz)
          ctx.restore()
        }
        // category has a custom image — never fall back to old SVG sprite
        return
      }
      if (PIXEL_SPRITES[c.name]) {
        const img = getSvgImg(c.name, sz, c.flip)
        if (img.complete && img.naturalWidth > 0) {
          ctx.imageSmoothingEnabled = false; ctx.drawImage(img, dx, dy, sz, sz); return
        }
      }
      const pUrl = im[c.name]
      if (pUrl) {
        const img = getUrlImg(pUrl)
        if (img.complete && img.naturalWidth > 0) {
          ctx.save(); ctx.beginPath(); const r = 6
          ctx.moveTo(dx + r, dy); ctx.arcTo(dx + sz, dy, dx + sz, dy + sz, r)
          ctx.arcTo(dx + sz, dy + sz, dx, dy + sz, r); ctx.arcTo(dx, dy + sz, dx, dy, r); ctx.arcTo(dx, dy, dx + sz, dy, r)
          ctx.clip(); ctx.drawImage(img, dx, dy, sz, sz)
          ctx.strokeStyle = 'rgba(44,24,16,0.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); return
        }
      }
      ctx.fillStyle = '#B8A090'; ctx.fillRect(dx, dy, sz, sz)
    }

    // ── Effect Renderers ──────────────────────────────────────────────────

    // Rain
    function drawRain(drops: RainDrop[]) {
      ctx.save()
      ctx.strokeStyle = 'rgba(160,200,240,0.80)'; ctx.lineWidth = 1.5
      for (const d of drops) {
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 3, d.y + d.len); ctx.stroke()
        d.y += d.speed; d.x -= 1.2
        if (d.y > H) { d.y = rand(-40, 0); d.x = rand(0, W + 30) }
      }
      ctx.restore()
    }

    // Snow
    function drawSnow(flakes: SnowFlake[], tick: number) {
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.92)'
      for (const f of flakes) {
        ctx.beginPath()
        ctx.arc(f.x + Math.sin(tick * 0.018 + f.wobble) * 4, f.y, f.r, 0, Math.PI * 2)
        ctx.fill()
        f.y += f.speed
        if (f.y > H) { f.y = -8; f.x = rand(0, W) }
      }
      ctx.restore()
    }

    // Storm: jagged lightning bolt
    function drawLightningBolt(boltX: number, boltSegs: number[], boltAge: number) {
      if (boltAge > 10) return
      const alpha = Math.max(0, 1 - boltAge / 10)
      const segH  = SKY_H / boltSegs.length
      ctx.save()
      // Outer glow
      ctx.strokeStyle = `rgba(200,230,255,${(alpha * 0.4).toFixed(2)})`
      ctx.lineWidth = 10
      ctx.beginPath(); ctx.moveTo(boltX, 0)
      boltSegs.forEach((dx, i) => ctx.lineTo(boltX + dx, (i + 1) * segH))
      ctx.stroke()
      // Mid glow
      ctx.strokeStyle = `rgba(220,240,255,${(alpha * 0.65).toFixed(2)})`
      ctx.lineWidth = 4
      ctx.stroke()
      // Bright core
      ctx.strokeStyle = `rgba(255,255,220,${alpha.toFixed(2)})`
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(boltX, 0)
      boltSegs.forEach((dx, i) => ctx.lineTo(boltX + dx, (i + 1) * segH))
      ctx.stroke()
      ctx.restore()
    }

    // Storm: wind debris blowing across scene
    function drawWindDebris(debris: WindDebris[]) {
      ctx.save(); ctx.strokeStyle = 'rgba(110,90,60,0.65)'; ctx.lineWidth = 1.5
      for (const d of debris) {
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.len, d.y + d.vy * 4); ctx.stroke()
        d.x += d.vx; d.y += d.vy
        if (d.x > W + 30) { d.x = rand(-50, -5); d.y = rand(SKY_H, H - 20) }
      }
      ctx.restore()
    }

    // Drought: heat shimmer rising from ground
    function drawHeatShimmer(tick: number) {
      ctx.save()
      for (let col = 0; col < 8; col++) {
        const baseX = 18 + col * 54
        const baseY = ZONE_Y1 + (col % 3) * 25
        ctx.strokeStyle = `rgba(255,${170 + col * 5},50,0.22)`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(baseX + Math.sin(tick * 0.06 + col) * 3, baseY)
        for (let seg = 1; seg <= 12; seg++) {
          const py = baseY - seg * 8
          const px = baseX + Math.sin(tick * 0.08 + seg * 0.4 + col * 0.7) * (3 + seg * 0.3)
          ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
      ctx.restore()
    }

    // Drought: horizontal dust streaks
    function drawDust(dust: DustStreak[]) {
      ctx.save()
      for (const d of dust) {
        ctx.globalAlpha = d.alpha
        ctx.fillStyle = '#C8A060'
        ctx.fillRect(d.x, d.y, d.len, 2)
        d.x += d.speed
        if (d.x > W + 60) { d.x = rand(-80, -10); d.y = rand(SKY_H + 8, ZONE_Y1 - 4) }
      }
      ctx.globalAlpha = 1; ctx.restore()
    }

    // Locusts: dark swarm haze + individual bugs
    function drawLocustCloud(tick: number) {
      const alpha = 0.18 + 0.06 * Math.sin(tick * 0.035)
      ctx.fillStyle = `rgba(55,35,8,${alpha.toFixed(2)})`
      ctx.fillRect(ZONE_FARM_X1 - 8, ZONE_Y1 - 25, ZONE_FARM_X2 - ZONE_FARM_X1 + 16, ZONE_Y2 - ZONE_Y1 + 35)
    }
    function drawLocusts(locusts: Locust[]) {
      ctx.save(); ctx.fillStyle = 'rgba(80,55,15,0.88)'
      for (const l of locusts) {
        l.vx += rand(-0.4, 0.4); l.vy += rand(-0.3, 0.3)
        l.vx = Math.max(-2.8, Math.min(2.8, l.vx))
        l.vy = Math.max(-2.2, Math.min(2.2, l.vy))
        l.x += l.vx; l.y += l.vy
        if (l.x < ZONE_FARM_X1 - 30) l.x = ZONE_FARM_X2 + 10
        if (l.x > ZONE_FARM_X2 + 30) l.x = ZONE_FARM_X1 - 10
        if (l.y < SKY_H - 15)        l.y = ZONE_Y2
        if (l.y > H + 10)            l.y = SKY_H + 5
        ctx.fillRect(l.x, l.y, 3, 2)
      }
      ctx.restore()
    }

    // Sparkles: 4-pointed star shapes
    function drawSparkles(sparkles: Sparkle[], zone: string | undefined, tick: number) {
      if (tick % 3 === 0 && sparkles.length < 32) {
        let x1 = ZONE_LIVE_X1, x2 = ZONE_LIVE_X2
        if (zone === 'farming') { x1 = ZONE_FARM_X1; x2 = ZONE_FARM_X2 }
        else if (zone === 'build') { x1 = ZONE_BUILD_X1; x2 = ZONE_BUILD_X2 }
        else if (zone === 'all')   { x1 = 0; x2 = W }
        const hue = [50, 45, 55, 42, 48][Math.floor(rand(0, 5))] // warm gold range
        sparkles.push({ x: rand(x1, x2), y: rand(ZONE_Y1, ZONE_Y2), vx: rand(-0.4, 0.4), vy: rand(-2.0, -0.7), life: 0, maxLife: Math.floor(rand(40, 90)), hue })
      }
      ctx.save()
      for (const sp of sparkles) {
        const alpha = Math.max(0, 1 - sp.life / sp.maxLife)
        const arm = 4 * alpha, w = 1.5 * alpha
        ctx.globalAlpha = alpha
        // Alternate between pure gold and white shimmer
        ctx.fillStyle = sp.life % 8 < 4 ? `hsl(${sp.hue},100%,60%)` : '#FFFFFF'
        // Draw + shaped star
        ctx.fillRect(sp.x - w / 2, sp.y - arm,     w, arm * 2) // vertical
        ctx.fillRect(sp.x - arm,   sp.y - w / 2, arm * 2,   w) // horizontal
        sp.x += sp.vx; sp.y += sp.vy; sp.life++
      }
      ctx.globalAlpha = 1; ctx.restore()
      for (let i = sparkles.length - 1; i >= 0; i--)
        if (sparkles[i].life >= sparkles[i].maxLife) sparkles.splice(i, 1)
    }

    // Disease: pulsing zone overlay + floating spores
    function drawDiseaseOverlay(zone: string | undefined, tick: number) {
      let x1 = ZONE_LIVE_X1 - 4, x2 = ZONE_LIVE_X2 + 4
      if (zone === 'farming') { x1 = ZONE_FARM_X1; x2 = ZONE_FARM_X2 }
      else if (zone === 'build') { x1 = ZONE_BUILD_X1; x2 = ZONE_BUILD_X2 }
      const pulse = 0.14 + 0.05 * Math.sin(tick * 0.04)
      // Livestock: dark red/crimson; farming: sickly dark green
      const overlayColor = zone === 'farming'
        ? `rgba(30,80,10,${pulse.toFixed(2)})`
        : `rgba(110,0,15,${pulse.toFixed(2)})`
      ctx.fillStyle = overlayColor
      ctx.fillRect(x1, ZONE_Y1 - 4, x2 - x1, ZONE_Y2 - ZONE_Y1 + 8)
    }
    function drawSpores(spores: Spore[], zone: string | undefined, tick: number) {
      ctx.save()
      const color = zone === 'farming' ? '40,90,20' : '80,15,15'
      for (const sp of spores) {
        const alpha = 0.35 + 0.2 * Math.sin(tick * 0.03 + sp.wobbleOff)
        ctx.globalAlpha = alpha
        ctx.fillStyle = `rgb(${color})`
        ctx.beginPath()
        ctx.arc(sp.x + Math.sin(tick * 0.025 + sp.wobbleOff) * 3, sp.y, sp.size, 0, Math.PI * 2)
        ctx.fill()
        sp.y -= sp.vy
        if (sp.y < ZONE_Y1 - 10) sp.y = ZONE_Y2 + rand(0, 15)
      }
      ctx.globalAlpha = 1; ctx.restore()
    }

    // Golden sky: pollen particles
    function drawPollen(pollen: PollenDot[], tick: number) {
      if (tick % 5 === 0 && pollen.length < 20) {
        pollen.push({ x: rand(0, W), y: rand(ZONE_Y1, ZONE_Y2), vx: rand(-0.3, 0.3), vy: rand(-0.6, -0.2), wobbleOff: rand(0, Math.PI * 2), life: 0, maxLife: Math.floor(rand(80, 160)) })
      }
      ctx.save()
      for (const p of pollen) {
        const alpha = Math.min(1, p.life / 20) * Math.max(0, 1 - p.life / p.maxLife) * 0.7
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#FFD040'
        ctx.beginPath()
        ctx.arc(p.x + Math.sin(tick * 0.02 + p.wobbleOff) * 5, p.y, 2, 0, Math.PI * 2)
        ctx.fill()
        p.x += p.vx; p.y += p.vy; p.life++
      }
      ctx.globalAlpha = 1; ctx.restore()
      for (let i = pollen.length - 1; i >= 0; i--)
        if (pollen[i].life >= pollen[i].maxLife) pollen.splice(i, 1)
    }

    // Extra clouds: horizon fog + falling debris
    function drawHorizonFog() {
      const g = ctx.createLinearGradient(0, SKY_H - 8, 0, SKY_H + 36)
      g.addColorStop(0, 'rgba(140,155,170,0)')
      g.addColorStop(0.45, 'rgba(140,155,170,0.38)')
      g.addColorStop(1, 'rgba(140,155,170,0)')
      ctx.fillStyle = g; ctx.fillRect(0, SKY_H - 8, W, 44)
    }
    function drawFallingDebris(debris: FallingDebris[]) {
      ctx.save(); ctx.fillStyle = 'rgba(100,90,70,0.55)'
      for (const d of debris) {
        ctx.save()
        ctx.translate(d.x, d.y)
        ctx.rotate(d.tilt + d.vy * 0.05)
        ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h)
        ctx.restore()
        d.y += d.vy; d.tilt += 0.02
        if (d.y > H + 10) { d.y = rand(-20, 0); d.x = rand(0, W) }
      }
      ctx.restore()
    }

    // ── Main Frame Loop ───────────────────────────────────────────────────

    function frame() {
      const s    = stateRef.current; s.tick++
      const effs = s.effects
      const isStorm       = effs.some(e => e.type === 'storm')
      const isRain        = effs.some(e => e.type === 'rain')
      const hasMoreClouds = isStorm || isRain || effs.some(e => e.type === 'extra_clouds')
      const sparkEff      = effs.find(e => e.type === 'sparkles') as { type: 'sparkles'; zone?: string } | undefined
      const diseaseEff    = effs.find(e => e.type === 'disease')  as { type: 'disease';  zone?: string } | undefined

      drawSky(); drawAlpsMountain(); drawGround()

      // Rain clouds on top of mountains
      if (isRain) drawRainClouds(s.tick)

      // Horizon fog for extra_clouds
      if (effs.some(e => e.type === 'extra_clouds')) drawHorizonFog()

      const allClouds = hasMoreClouds ? [...s.clouds, ...s.extraClouds] : s.clouds
      for (const cloud of allClouds) {
        drawCloud(cloud, isStorm || isRain || effs.some(e => e.type === 'extra_clouds'))
        cloud.x += cloud.speed
        if (cloud.x > W + 80) cloud.x = -80
      }

      drawSun(s.tick); drawTree(24, SKY_H - 10); drawTree(22, SKY_H + 28); drawFence(); drawSwissFlag(s.tick)

      // Static critters
      for (const c of s.critters) {
        if (!isPlant(c.category) && !isBuilding(c.category)) continue
        if (c.dying) {
          ctx.globalAlpha = Math.max(0, 1 - c.dyingAge / DYING_FRAMES)
          drawCritter(c, 0)
          ctx.globalAlpha = 1; c.dyingAge++
        } else {
          drawCritter(c, 0)
        }
      }

      // Livestock (clipped)
      ctx.save()
      ctx.beginPath()
      ctx.rect(ZONE_LIVE_X1, ZONE_Y1, ZONE_LIVE_X2 - ZONE_LIVE_X1, ZONE_Y2 - ZONE_Y1)
      ctx.clip()
      for (const c of s.critters) {
        if (isPlant(c.category) || isBuilding(c.category)) continue
        c.x += c.vx; c.y += c.vy
        if (c.x < ZONE_LIVE_X1)              { c.x = ZONE_LIVE_X1;              c.vx =  Math.abs(c.vx) }
        if (c.x > ZONE_LIVE_X2 - SPRITE_SZ)  { c.x = ZONE_LIVE_X2 - SPRITE_SZ;  c.vx = -Math.abs(c.vx) }
        if (c.y < ZONE_Y1)                   { c.y = ZONE_Y1;                   c.vy =  Math.abs(c.vy) }
        if (c.y > ZONE_Y2 - SPRITE_SZ)       { c.y = ZONE_Y2 - SPRITE_SZ;       c.vy = -Math.abs(c.vy) }
        if (c.vx < 0) c.flip = true
        if (c.vx > 0) c.flip = false
        const bob = Math.sin(s.tick * 0.10 + c.bobOff) * 1.8
        if (c.dying) {
          ctx.globalAlpha = Math.max(0, 1 - c.dyingAge / DYING_FRAMES)
          drawCritter(c, bob)
          ctx.globalAlpha = 1; c.dyingAge++
        } else {
          drawCritter(c, bob)
        }
        c.frame++
      }
      ctx.restore()

      s.critters = s.critters.filter(c => !c.dying || c.dyingAge < DYING_FRAMES)

      // ── Effect overlays (order matters) ─────────────────────────────────

      // Locust cloud haze first, then individual bugs on top
      if (effs.some(e => e.type === 'locusts')) {
        drawLocustCloud(s.tick)
        drawLocusts(s.locusts)
      }

      // Disease: zone overlay + spore particles
      if (diseaseEff) {
        drawDiseaseOverlay(diseaseEff.zone, s.tick)
        drawSpores(s.spores, diseaseEff.zone, s.tick)
      }

      // Rain: ambient dim + drops
      if (isRain) {
        ctx.fillStyle = 'rgba(60,80,110,0.18)'; ctx.fillRect(0, 0, W, H)
        drawRain(s.rain)
      }

      // Snow
      if (effs.some(e => e.type === 'snow')) {
        ctx.fillStyle = 'rgba(200,220,240,0.08)'; ctx.fillRect(0, 0, W, H)
        drawSnow(s.snow, s.tick)
      }

      // Sparkles
      if (sparkEff) drawSparkles(s.sparkles, sparkEff.zone, s.tick)

      // Golden sky: pollen particles
      if (effs.some(e => e.type === 'golden_sky')) drawPollen(s.pollen, s.tick)

      // Drought: heat shimmer then dust
      if (effs.some(e => e.type === 'drought')) {
        drawHeatShimmer(s.tick)
        drawDust(s.dust)
      }

      // Storm: wind debris + lightning bolt + dark overlay
      if (isStorm) {
        drawWindDebris(s.windDebris)
        ctx.fillStyle = 'rgba(0,0,30,0.16)'; ctx.fillRect(0, 0, W, H)
        // Lightning cycle
        s.lightningCD--
        if (s.lightningCD <= 0) {
          s.boltX    = rand(W * 0.2, W * 0.85)
          s.boltSegs = makeBolt()
          s.boltAge  = 0
          // Brief sky flash
          ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(0, 0, W, SKY_H)
          s.lightningCD = 100 + Math.floor(Math.random() * 200)
        }
        if (s.boltAge <= 10) {
          drawLightningBolt(s.boltX, s.boltSegs, s.boltAge)
          s.boltAge++
        }
      }

      // Extra clouds: falling debris (market chaos)
      if (effs.some(e => e.type === 'extra_clouds')) drawFallingDebris(s.debris)

      drawHouse()

      // Empty-farm message
      if (s.critters.filter(c => !c.dying).length === 0) {
        ctx.fillStyle = 'rgba(44,24,16,0.55)'; ctx.beginPath()
        ;(ctx as any).roundRect?.(W / 2 - 128, H / 2 - 30, 256, 60, 6); ctx.fill()
        ctx.textAlign = 'center'; ctx.fillStyle = '#FAF4E8'; ctx.font = 'bold 14px "Playfair Display", serif'
        ctx.fillText('Your farm is empty.', W / 2, H / 2 - 6)
        ctx.font = 'italic 12px "Lora", serif'
        ctx.fillText('Add livestock to bring it to life.', W / 2, H / 2 + 14)
        ctx.textAlign = 'left'
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, []) // intentionally once — props via propsRef

  // ── Incremental critter updates ───────────────────────────────────────────
  useEffect(() => {
    if (prevSelectedRef.current === null) return

    const prev     = prevSelectedRef.current
    const next     = selected
    const { animalNames: names, animalCats: cats } = propsRef.current
    const critters = stateRef.current.critters

    const liveCounts: Record<string, number> = {}
    for (const c of critters) if (!c.dying) liveCounts[c.assetId] = (liveCounts[c.assetId] ?? 0) + 1

    let rebuildStatic = false
    const allIds = new Set([...Object.keys(prev), ...Object.keys(next)])

    for (const id of allIds) {
      const prevN = prev[id] ?? 0
      const nextN = next[id] ?? 0
      const name  = names[id]; const cat = cats[id] ?? ''
      if (!name) continue

      if (isPlant(cat) || isBuilding(cat)) {
        if (prevN !== nextN) rebuildStatic = true
        continue
      }

      const target = Math.min(nextN, MAX_PER_ASSET)
      const liveN  = liveCounts[id] ?? 0

      if (target < liveN) {
        const live = critters.filter(c => c.assetId === id && !c.dying)
        for (let i = 0; i < liveN - target && i < live.length; i++) {
          live[i].dying = true; live[i].dyingAge = 0
        }
      } else if (target > liveN) {
        const totalLive = critters.filter(c => !c.dying).length
        const toSpawn   = Math.min(target - liveN, MAX_TOTAL - totalLive)
        for (let i = 0; i < toSpawn; i++) {
          const c = spawnLivestock(id, name, cat)
          stateRef.current.critters.push(c)
          if (PIXEL_SPRITES[name]) { getSvgImg(name, SPRITE_SZ, false); getSvgImg(name, SPRITE_SZ, true) }
          else if (propsRef.current.pixelImageMap[cat]) getUrlImg(propsRef.current.pixelImageMap[cat])
          else if (propsRef.current.imageMap[name])     getUrlImg(propsRef.current.imageMap[name])
        }
      }
    }

    if (rebuildStatic) {
      stateRef.current.critters = stateRef.current.critters.filter(
        c => !isPlant(c.category) && !isBuilding(c.category)
      )
      stateRef.current.critters.push(...buildStaticCritters(next, names, cats))
    }

    prevSelectedRef.current = { ...next }
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update effects ────────────────────────────────────────────────────────
  useEffect(() => {
    const s  = stateRef.current
    s.effects = effects

    const diseaseEff = effects.find(e => e.type === 'disease') as { type: 'disease'; zone?: string } | undefined

    s.rain     = effects.some(e => e.type === 'rain')
      ? Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H), speed: rand(6, 13), len: rand(9, 20) }))
      : []
    s.snow     = effects.some(e => e.type === 'snow')
      ? Array.from({ length: 48 }, () => ({ x: rand(0, W), y: rand(0, H), speed: rand(0.7, 2.0), r: rand(2, 5), wobble: rand(0, Math.PI * 2) }))
      : []
    s.locusts  = effects.some(e => e.type === 'locusts')
      ? Array.from({ length: 75 }, () => ({ x: rand(ZONE_FARM_X1 - 20, ZONE_FARM_X2 + 20), y: rand(SKY_H + 5, ZONE_Y2), vx: rand(-1.8, 1.8), vy: rand(-1.2, 1.2) }))
      : []
    s.sparkles = []
    s.pollen   = []

    // Wind debris for storm
    s.windDebris = effects.some(e => e.type === 'storm')
      ? Array.from({ length: 22 }, () => ({ x: rand(-W, W), y: rand(SKY_H + 5, H - 15), vx: rand(2.8, 5.5), vy: rand(-0.6, 0.6), len: rand(7, 20) }))
      : []

    // Dust streaks for drought
    s.dust = effects.some(e => e.type === 'drought')
      ? Array.from({ length: 28 }, () => ({ x: rand(-W, 0), y: rand(SKY_H + 8, ZONE_Y1 - 4), speed: rand(1.5, 3.8), len: rand(16, 45), alpha: rand(0.18, 0.48) }))
      : []

    // Spores for disease
    let sporeZone: string | undefined
    if (diseaseEff) sporeZone = diseaseEff.zone
    const sporeX1 = sporeZone === 'farming' ? ZONE_FARM_X1 : ZONE_LIVE_X1
    const sporeX2 = sporeZone === 'farming' ? ZONE_FARM_X2 : ZONE_LIVE_X2
    s.spores = diseaseEff
      ? Array.from({ length: 30 }, () => ({ x: rand(sporeX1, sporeX2), y: rand(ZONE_Y1, ZONE_Y2), vy: rand(0.3, 0.8), wobbleOff: rand(0, Math.PI * 2), size: rand(2, 4) }))
      : []

    // Falling debris for extra_clouds (market/supply chaos)
    s.debris = effects.some(e => e.type === 'extra_clouds')
      ? Array.from({ length: 18 }, () => ({ x: rand(0, W), y: rand(-H, 0), vy: rand(0.6, 1.6), tilt: rand(0, Math.PI * 2), w: rand(6, 14), h: rand(3, 7) }))
      : []

    s.extraClouds = (effects.some(e => e.type === 'extra_clouds') || effects.some(e => e.type === 'storm'))
      ? spawnExtraClouds()
      : []

    // Reset lightning
    s.boltX = -1; s.boltSegs = []; s.boltAge = 999
    s.lightningCD = 120 + Math.floor(Math.random() * 80)
  }, [effects])

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{
        width: '100%', maxWidth: `${W * 1.25}px`, aspectRatio: '4/3',
        border: '3px solid #2C1810', borderRadius: '4px',
        boxShadow: '8px 8px 0 rgba(44,24,16,0.28)',
        imageRendering: 'pixelated', display: 'block',
      }}
    />
  )
}
