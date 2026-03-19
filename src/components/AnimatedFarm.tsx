/**
 * AnimatedFarm – HTML5 canvas, 60fps pixel-art farm scene.
 * 3 discrete regions: Livestock, Farming Land, Build Zone.
 */

import { useEffect, useRef, useCallback } from 'react'
import { PIXEL_SPRITES } from './PixelAnimal'

// ── Types ────────────────────────────────────────────────────────────────────

interface Critter {
  name:     string
  category: string
  x:        number
  y:        number
  vx:       number
  vy:       number
  frame:    number
  flip:     boolean
  bobOff:   number
}

interface Cloud { x: number; y: number; speed: number; scale: number }

// ── SVG pixel sprite → HTMLImageElement cache ─────────────────────────────────

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

// ── Constants ────────────────────────────────────────────────────────────────

const W         = 480
const H         = 360
const SPRITE_SZ = 36
const SKY_H     = H * 0.38

// ── Region Definitions ───────────────────────────────────────────────────────
const ZONE_LIVE_X1  = 12,  ZONE_LIVE_X2  = 180
const ZONE_FARM_X1  = 190, ZONE_FARM_X2  = 350
const ZONE_BUILD_X1 = 360, ZONE_BUILD_X2 = W - 12
const ZONE_Y1       = SKY_H + 16, ZONE_Y2 = H - 20


const FENCE_C     = '#C8A460'
const FENCE_SH    = '#8B6520'

// ── Helpers ──────────────────────────────────────────────────────────────────

function rand(a: number, b: number) { return a + Math.random() * (b - a) }

function isPlant(cat: string) {
  return cat === 'Medicinal Plant' || cat === 'Grain Crop'
}

function isBuilding(cat: string) {
  return cat === 'Collective' || cat === 'Tool' || cat === 'Hedge'
}

function spawnCritters(entries: { name: string; category: string }[]): Critter[] {
  let plantCount = 0
  let buildCount = 0
  return entries.map(({ name, category }) => {
    const isP = isPlant(category)
    const isB = isBuilding(category)

    if (isP) {
      const cols = 2
      const r = Math.floor(plantCount / cols)
      const c = plantCount % cols
      plantCount++
      return {
        name, category,
        x: ZONE_FARM_X1 + 15 + c * 60,
        y: ZONE_Y1 + 15 + r * 45,
        vx: 0, vy: 0, frame: 0, flip: false, bobOff: 0
      }
    }

    if (isB) {
      const cols = 2
      const r = Math.floor(buildCount / cols)
      const c = buildCount % cols
      buildCount++
      return {
        name, category,
        x: ZONE_BUILD_X1 + 10 + c * 50,
        y: ZONE_Y1 + 10 + r * 50,
        vx: 0, vy: 0, frame: 0, flip: false, bobOff: 0
      }
    }

    return {
      name, category,
      x:      rand(ZONE_LIVE_X1 + 8, ZONE_LIVE_X2 - SPRITE_SZ - 8),
      y:      rand(ZONE_Y1 + 10, ZONE_Y2 - SPRITE_SZ - 8),
      vx:     rand(0.45, 1.1) * (Math.random() < 0.5 ? 1 : -1),
      vy:     rand(0.1,  0.35) * (Math.random() < 0.5 ? 1 : -1),
      frame:  0,
      flip:   Math.random() < 0.5,
      bobOff: rand(0, Math.PI * 2),
    }
  })
}

function spawnClouds(): Cloud[] {
  return [
    { x: 40,  y: rand(18, 48), speed: 0.22, scale: 1.0  },
    { x: 200, y: rand(22, 52), speed: 0.16, scale: 0.75 },
    { x: 360, y: rand(15, 40), speed: 0.28, scale: 1.2  },
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  selected:      Record<string, number>
  animalNames:   Record<string, string>
  animalCats:    Record<string, string>
  imageMap:      Record<string, string>
  pixelImageMap: Record<string, string>
}

export function AnimatedFarm({ selected, animalNames, animalCats, imageMap, pixelImageMap }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const stateRef  = useRef<{ critters: Critter[]; clouds: Cloud[]; tick: number }>({
    critters: [], clouds: [], tick: 0,
  })

  const buildList = useCallback((): { name: string; category: string }[] => {
    const list: { name: string; category: string }[] = []
    for (const [id, count] of Object.entries(selected)) {
      const name     = animalNames[id]
      const category = animalCats[id]
      if (!name) continue
      for (let i = 0; i < Math.min(count, 4); i++) {
        list.push({ name, category: category ?? '' })
        if (list.length >= 20) return list
      }
    }
    return list
  }, [selected, animalNames, animalCats])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const entries = buildList()
    stateRef.current = { critters: spawnCritters(entries), clouds: spawnClouds(), tick: 0 }

    for (const { name, category } of entries) {
      if (PIXEL_SPRITES[name]) {
        getSvgImg(name, SPRITE_SZ, false)
        getSvgImg(name, SPRITE_SZ, true)
      } else if (pixelImageMap[category]) {
        getUrlImg(pixelImageMap[category])
      } else if (imageMap[name]) {
        getUrlImg(imageMap[name])
      }
    }

    // ── Draw helpers ──────────────────────────────────────────────────────────

    function drawSky() {
      if (!ctx) return
      const g = ctx.createLinearGradient(0, 0, 0, SKY_H)
      g.addColorStop(0, '#5AD4FF'); g.addColorStop(1, '#A8E8FF')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, SKY_H)
    }

    function drawAlpsMountain() {
      if (!ctx) return
      const base = SKY_H + 2

      // Distant ridge (lightest, atmospheric haze)
      ctx.fillStyle = '#C2D5E2'
      ctx.beginPath(); ctx.moveTo(290, base); ctx.lineTo(345, base - 32); ctx.lineTo(400, base); ctx.closePath(); ctx.fill()

      // Left secondary peak (mid distance)
      ctx.fillStyle = '#90AEBB'
      ctx.beginPath(); ctx.moveTo(180, base); ctx.lineTo(242, base - 50); ctx.lineTo(305, base); ctx.closePath(); ctx.fill()
      // Right face shading
      ctx.fillStyle = '#7A9AAA'
      ctx.beginPath(); ctx.moveTo(242, base - 50); ctx.lineTo(305, base); ctx.lineTo(274, base); ctx.closePath(); ctx.fill()

      // Main tall peak (foremost)
      ctx.fillStyle = '#7A9AAA'
      ctx.beginPath(); ctx.moveTo(222, base); ctx.lineTo(298, base - 78); ctx.lineTo(374, base); ctx.closePath(); ctx.fill()
      // Right face shadow
      ctx.fillStyle = '#5C7D8E'
      ctx.beginPath(); ctx.moveTo(298, base - 78); ctx.lineTo(374, base); ctx.lineTo(336, base); ctx.closePath(); ctx.fill()
      // Left face highlight stripe
      ctx.fillStyle = '#8CB0BF'
      ctx.beginPath(); ctx.moveTo(298, base - 78); ctx.lineTo(222, base); ctx.lineTo(250, base); ctx.closePath(); ctx.fill()

      // Snow caps
      ctx.fillStyle = '#EDF2F6'
      // Main peak
      ctx.beginPath(); ctx.moveTo(276, base - 62); ctx.lineTo(298, base - 78); ctx.lineTo(320, base - 62); ctx.closePath(); ctx.fill()
      // Left peak
      ctx.beginPath(); ctx.moveTo(230, base - 40); ctx.lineTo(242, base - 50); ctx.lineTo(254, base - 40); ctx.closePath(); ctx.fill()
      // Distant ridge
      ctx.beginPath(); ctx.moveTo(337, base - 24); ctx.lineTo(345, base - 32); ctx.lineTo(353, base - 24); ctx.closePath(); ctx.fill()

      // Bright snow highlight on main peak tip
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.moveTo(294, base - 70); ctx.lineTo(298, base - 78); ctx.lineTo(302, base - 70); ctx.closePath(); ctx.fill()

      // Snow ledge lines on main peak (pixel art texture)
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.fillRect(264, base - 55, 14, 2)
      ctx.fillRect(280, base - 48, 10, 2)
    }

    function drawSwissFlag(tick: number) {
      if (!ctx) return
      // Pole: same column as the house (hx = W-62 = 418), top of build zone
      const px = ZONE_BUILD_X1 + 52  // x≈412, centre-right of build zone
      const poleTop  = ZONE_Y1 - 42
      const poleBase = ZONE_Y1 + 4

      // Pole shadow
      ctx.fillStyle = 'rgba(0,0,0,0.14)'
      ctx.fillRect(px + 3, poleTop + 6, 2, poleBase - poleTop)
      // Pole body
      ctx.fillStyle = '#B0B0B0'; ctx.fillRect(px,     poleTop, 2, poleBase - poleTop)
      ctx.fillStyle = '#D8D8D8'; ctx.fillRect(px,     poleTop, 1, poleBase - poleTop)
      // Finial
      ctx.fillStyle = '#C0C0C0'; ctx.fillRect(px - 1, poleTop - 1, 4, 3)
      ctx.fillStyle = '#E8E8E8'; ctx.fillRect(px,     poleTop - 2, 2, 2)

      // Gentle flag wave via a subtle horizontal offset per row
      const fx = px + 2
      const fy = poleTop
      const fs = 22
      const amp = 1.5
      for (let row = 0; row < fs; row++) {
        const wave = Math.round(amp * Math.sin(tick * 0.06 + row * 0.35))
        ctx.fillStyle = '#D52B1E'
        ctx.fillRect(fx + wave, fy + row, fs, 1)
      }

      // White cross (pixel-perfect Swiss proportions: cross arm = 6/20 of flag width)
      for (let row = 0; row < fs; row++) {
        const wave = Math.round(amp * Math.sin(tick * 0.06 + row * 0.35))
        const inHBar = row >= 9 && row <= 12
        ctx.fillStyle = '#FFFFFF'
        if (inHBar) {
          ctx.fillRect(fx + wave + 4, fy + row, 14, 1)
        } else if (row >= 4 && row <= 17) {
          ctx.fillRect(fx + wave + 9, fy + row, 4, 1)
        }
      }

      // Flag edge shadow
      ctx.fillStyle = 'rgba(0,0,0,0.10)'
      ctx.fillRect(fx + fs, fy, 1, fs)
      ctx.fillRect(fx, fy + fs, fs + 1, 1)
    }

    function drawGround() {
      if (!ctx) return
      ctx.fillStyle = '#6BBF5A'; ctx.fillRect(0, SKY_H, W, H - SKY_H)
      ctx.fillStyle = '#58A848'
      ctx.fillRect(ZONE_LIVE_X1 - 4, ZONE_Y1 - 4, ZONE_LIVE_X2 - ZONE_LIVE_X1 + 8, ZONE_Y2 - ZONE_Y1 + 8)
      ctx.fillStyle = '#4D3B2D' 
      ctx.fillRect(ZONE_FARM_X1, ZONE_Y1, ZONE_FARM_X2 - ZONE_FARM_X1, ZONE_Y2 - ZONE_Y1)
      ctx.strokeStyle = '#3D2B1D'; ctx.lineWidth = 1
      for (let fx = ZONE_FARM_X1 + 10; fx < ZONE_FARM_X2; fx += 15) {
        ctx.beginPath(); ctx.moveTo(fx, ZONE_Y1); ctx.lineTo(fx, ZONE_Y2); ctx.stroke()
      }
      ctx.fillStyle = '#8FB185'
      ctx.fillRect(ZONE_BUILD_X1, ZONE_Y1, ZONE_BUILD_X2 - ZONE_BUILD_X1, ZONE_Y2 - ZONE_Y1)
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      for (let bx = ZONE_BUILD_X1 + 10; bx < ZONE_BUILD_X2; bx += 20) {
        for (let by = ZONE_Y1 + 10; by < ZONE_Y2; by += 20) ctx.fillRect(bx, by, 2, 2)
      }
      ctx.fillStyle = '#2A7020'; ctx.fillRect(0, SKY_H, W, 4)
    }

    function drawCloud({ x, y, scale }: Cloud) {
      if (!ctx) return
      ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale)
      ctx.globalAlpha = 0.9
      ctx.fillStyle = '#C8E8F8'; ctx.fillRect(4, 22, 56, 5)
      ctx.fillStyle = '#FFFFFF'
      const blocks = [[8,12,18,10],[0,16,34,12],[24,10,16,10],[12,8,14,8]]
      for (const [bx, by, bw, bh] of blocks) ctx.fillRect(bx, by, bw, bh)
      ctx.globalAlpha = 1; ctx.restore()
    }

    function drawSun(tick: number) {
      if (!ctx) return
      const p = 1 + 0.06 * Math.sin(tick * 0.035)
      ctx.save(); ctx.translate(W - 44, 32); ctx.scale(p, p)
      const g = ctx.createRadialGradient(0, 0, 6, 0, 0, 24)
      g.addColorStop(0, 'rgba(255,230,80,0.55)'); g.addColorStop(1, 'rgba(255,230,80,0)')
      ctx.fillStyle = g; ctx.fillRect(-24, -24, 48, 48)
      ctx.fillStyle = '#FFE020'; ctx.fillRect(-9, -9, 18, 18)
      ctx.fillStyle = '#FFEA60'; ctx.fillRect(-6, -6, 12, 12)
      ctx.fillStyle = '#FFD000'
      const rays = [[-14,0],[14,0],[0,-14],[0,14],[-10,-10],[10,-10],[-10,10],[10,10]]
      for (const [rx, ry] of rays) ctx.fillRect(rx - 2, ry - 2, 4, 4)
      ctx.restore()
    }

    function drawFence() {
      if (!ctx) return
      const x1 = ZONE_LIVE_X1 - 4, y1 = ZONE_Y1 - 4
      const x2 = ZONE_LIVE_X2 + 4, y2 = ZONE_Y2 + 4
      const postH = 12  // posts protrude this many px above/below each rail
      const rails = [y1 + postH, y1 + Math.round((y2 - y1) * 0.42), y2 - postH]

      // Horizontal rails
      ctx.fillStyle = FENCE_C
      for (const ry of rails) {
        ctx.fillRect(x1, ry - 2, x2 - x1, 4)
        ctx.fillStyle = FENCE_SH
        ctx.fillRect(x1, ry + 1, x2 - x1, 1)
        ctx.fillStyle = FENCE_C
      }
      // Short fence posts (only at corners and every 25px)
      for (let px = x1; px <= x2; px += 25) {
        ctx.fillStyle = FENCE_C;  ctx.fillRect(px - 2, y1, 4, y2 - y1)
        ctx.fillStyle = FENCE_SH; ctx.fillRect(px + 1, y1, 1, y2 - y1)
      }
      // Re-draw rails on top of posts so posts don't bleed through
      ctx.fillStyle = FENCE_C
      for (const ry of rails) {
        ctx.fillRect(x1, ry - 2, x2 - x1, 4)
        ctx.fillStyle = FENCE_SH
        ctx.fillRect(x1, ry + 1, x2 - x1, 1)
        ctx.fillStyle = FENCE_C
      }
    }

    function drawHouse() {
      if (!ctx) return
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
      ctx.fillStyle = '#A8D8F8'; ctx.fillRect(hx + 6, hy + 26, 10, 8); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(hx + 10, hy + 26, 1, 8); ctx.fillRect(hx + 6, hy + 30, 10, 1)
      ctx.fillStyle = '#883020'; ctx.fillRect(hx + 34, hy + 2, 8, 18); ctx.fillStyle = '#AA4030'; ctx.fillRect(hx + 34, hy + 2, 8, 4)
      ctx.fillStyle = '#FAF4E8'; ctx.font = '8px "Lora", serif'
      ctx.fillText('BUILD ZONE', ZONE_BUILD_X1 + 10, ZONE_Y2 + 5)
    }

    function drawTree(tx: number, ty: number) {
      if (!ctx) return
      ctx.fillStyle = '#7B4518'; ctx.fillRect(tx - 3, ty + 14, 6, 16)
      ctx.fillStyle = '#2A9A30'
      const l = [[tx, ty + 10, 16],[tx, ty + 4, 12],[tx, ty, 8]]
      for (const [lx, ly, lw] of l) ctx.fillRect(lx - lw / 2, ly, lw, 10)
      ctx.fillStyle = '#48C848'
      for (const [lx, ly, lw] of l) ctx.fillRect(lx - lw / 2 + 2, ly, lw - 4, 4)
    }

    function drawCritter(c: Critter, bob: number) {
      if (!ctx) return
      const sz = SPRITE_SZ, dx = Math.round(c.x), dy = Math.round(c.y + bob)
      if (PIXEL_SPRITES[c.name]) {
        const img = getSvgImg(c.name, sz, c.flip)
        if (img.complete && img.naturalWidth > 0) {
          ctx.imageSmoothingEnabled = false; ctx.drawImage(img, dx, dy, sz, sz)
          return
        }
      }
      const pixUrl = pixelImageMap[c.category]
      if (pixUrl) {
        const img = getUrlImg(pixUrl)
        if (img.complete && img.naturalWidth > 0) {
          ctx.save()
          ctx.imageSmoothingEnabled = false
          ctx.beginPath(); ctx.rect(dx, dy, sz, sz); ctx.clip()
          if (c.flip) {
            ctx.translate(dx + sz / 2, dy)
            ctx.scale(-1, 1)
            ctx.translate(-sz / 2, 0)
            ctx.drawImage(img, 0, 0, sz, sz)
          } else {
            ctx.drawImage(img, dx, dy, sz, sz)
          }
          ctx.restore()
          return
        }
      }
      const pUrl = imageMap[c.name]
      if (pUrl) {
        const img = getUrlImg(pUrl)
        if (img.complete && img.naturalWidth > 0) {
          ctx.save(); ctx.beginPath(); const r = 6
          ctx.moveTo(dx + r, dy); ctx.arcTo(dx + sz, dy, dx + sz, dy + sz, r)
          ctx.arcTo(dx + sz, dy + sz, dx, dy + sz, r); ctx.arcTo(dx, dy + sz, dx, dy, r); ctx.arcTo(dx, dy, dx + sz, dy, r)
          ctx.clip(); ctx.drawImage(img, dx, dy, sz, sz)
          ctx.strokeStyle = 'rgba(44,24,16,0.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore()
          return
        }
      }
      ctx.fillStyle = '#B8A090'; ctx.fillRect(dx, dy, sz, sz)
    }

    function frame() {
      if (!ctx) return
      const s = stateRef.current; s.tick++
      drawSky(); drawAlpsMountain(); drawGround()
      for (const cloud of s.clouds) {
        drawCloud(cloud); cloud.x += cloud.speed; if (cloud.x > W + 80) cloud.x = -80
      }
      drawSun(s.tick); drawTree(24, SKY_H - 10); drawTree(22, SKY_H + 28); drawFence(); drawSwissFlag(s.tick)
      // Static critters (plants / buildings) drawn without clipping
      for (const c of s.critters) {
        if (isPlant(c.category) || isBuilding(c.category)) drawCritter(c, 0)
      }

      // Moving livestock drawn inside a hard clip matching the pen walls
      ctx.save()
      ctx.beginPath()
      ctx.rect(ZONE_LIVE_X1, ZONE_Y1, ZONE_LIVE_X2 - ZONE_LIVE_X1, ZONE_Y2 - ZONE_Y1)
      ctx.clip()
      for (const c of s.critters) {
        if (isPlant(c.category) || isBuilding(c.category)) continue
        // 1. Advance position
        c.x += c.vx
        c.y += c.vy
        // 2. Bounce – clamp and reverse velocity before drawing so the sprite
        //    is never rendered outside the pen, not even for a single frame.
        if (c.x < ZONE_LIVE_X1) { c.x = ZONE_LIVE_X1; c.vx = Math.abs(c.vx) }
        if (c.x > ZONE_LIVE_X2 - SPRITE_SZ) { c.x = ZONE_LIVE_X2 - SPRITE_SZ; c.vx = -Math.abs(c.vx) }
        if (c.y < ZONE_Y1) { c.y = ZONE_Y1; c.vy = Math.abs(c.vy) }
        if (c.y > ZONE_Y2 - SPRITE_SZ) { c.y = ZONE_Y2 - SPRITE_SZ; c.vy = -Math.abs(c.vy) }
        // 3. Update facing direction based on post-bounce velocity
        if (c.vx < 0) c.flip = true
        if (c.vx > 0) c.flip = false
        // 4. Draw at the now-verified, clamped position
        const bob = Math.sin(s.tick * 0.10 + c.bobOff) * 1.8
        drawCritter(c, bob)
        c.frame++
      }
      ctx.restore()
      drawHouse()
      if (s.critters.length === 0) {
        ctx.fillStyle = 'rgba(44,24,16,0.55)'; ctx.beginPath()
        ;(ctx as any).roundRect?.(W / 2 - 128, H / 2 - 30, 256, 60, 6); ctx.fill()
        ctx.textAlign = 'center'; ctx.fillStyle = '#FAF4E8'; ctx.font = 'bold 14px "Playfair Display", serif'
        ctx.fillText('Your farm is empty.', W / 2, H / 2 - 6)
        ctx.font = 'italic 12px "Lora", serif'; ctx.fillText('Add livestock to bring it to life.', W / 2, H / 2 + 14)
        ctx.textAlign = 'left'
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [buildList, imageMap, pixelImageMap])

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
