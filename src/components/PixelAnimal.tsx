/**
 * Hand-crafted 16×16 pixel-art animal sprites.
 *
 * Grid values reference the palette array by index:
 *   0 = transparent, 1-4 = breed-specific colours.
 *
 * Pigs:  1=face, 2=eye, 3=snout, 4=nostril
 * Dogs:  1=fur,  2=eye, 3=muzzle, 4=nose
 */

type Grid = number[][]
type Palette = readonly [string, string, string, string, string] // [transparent, c1, c2, c3, c4]

// ── Base pig face (upright ears, round head, wide snout) ─────────────────────
const PIG: Grid = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0],
  [0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,1,2,2,1,1,1,1,2,2,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
  [0,1,3,3,4,4,3,3,3,3,4,4,3,3,1,0],
  [0,1,3,3,4,4,3,3,3,3,4,4,3,3,1,0],
  [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]

// ── Base dog face (pointed ears, wider muzzle) ───────────────────────────────
const DOG: Grid = [
  [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0],
  [0,0,0,1,1,1,0,0,0,0,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,0,0,1,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,1,2,2,1,1,1,1,2,2,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0],
  [0,1,3,3,3,4,4,4,4,4,3,3,3,3,1,0],
  [0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
]

// ── Sprite definitions ───────────────────────────────────────────────────────
// Palette: [transparent, face/fur, eye, snout/muzzle, nostril/nose]
const SPRITES: Record<string, { grid: Grid; palette: Palette }> = {
  // Pigs ─────────────────────────────────────────────────────────────────────
  'Berkshire Pig': {
    grid: PIG,
    palette: ['', '#1C1C28', '#F0E8E0', '#E88A8A', '#B86868'],
    // jet-black face, pale eyes, pink snout
  },
  'Swiss Landrace Pig': {
    grid: PIG,
    palette: ['', '#FAE8E4', '#2C1810', '#F0A8A8', '#C07878'],
    // cream-pink face, dark eyes, rosy snout
  },
  'Meishan Pig': {
    grid: PIG,
    palette: ['', '#2D1818', '#FAEEE0', '#503030', '#302020'],
    // very dark brownish-black, pale eyes, near-black snout
  },
  'Hampshire Pig': {
    grid: PIG,
    palette: ['', '#1E1E2C', '#F0E8E0', '#F5F5EE', '#A898A0'],
    // dark face, white snout = the iconic Hampshire white belt
  },
  'American Duroc Pig': {
    grid: PIG,
    palette: ['', '#8B3A10', '#FAEEE0', '#D07050', '#904030'],
    // reddish-brown face, lighter brown snout
  },

  // Guard Dogs ───────────────────────────────────────────────────────────────
  'Dogue de Bordeaux': {
    grid: DOG,
    palette: ['', '#B8602E', '#2C1810', '#8A4820', '#1C1008'],
    // copper-bronze fur, dark muzzle
  },
  'American Bulldog': {
    grid: DOG,
    palette: ['', '#F5F0E8', '#2C1810', '#E0D8C8', '#1C1008'],
    // cream/white fur, off-white muzzle
  },
  'American Foxhound': {
    grid: DOG,
    palette: ['', '#C87A30', '#2C1810', '#F5F0E8', '#2C1810'],
    // tan fur, white muzzle = classic tricolor look
  },
  'German Shepherd': {
    grid: DOG,
    palette: ['', '#9A6830', '#2C1810', '#7A5020', '#1C1008'],
    // warm tan-brown fur, dark muzzle
  },
  'Dutch Shepherd': {
    grid: DOG,
    palette: ['', '#C89040', '#2C1810', '#A87030', '#1C1008'],
    // golden/brindle fur, amber muzzle
  },
}

// ── Renderer ─────────────────────────────────────────────────────────────────
export function PixelAnimal({
  name,
  size = 48,
  style = {},
}: {
  name: string
  size?: number
  style?: React.CSSProperties
}) {
  const sprite = SPRITES[name]
  if (!sprite) return null

  const { grid, palette } = sprite
  const rows = grid.length
  const cols = grid[0].length
  const px = size / cols

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ imageRendering: 'pixelated', display: 'block', ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {grid.flatMap((row, y) =>
        row.map((colorIdx, x) => {
          if (colorIdx === 0 || !palette[colorIdx]) return null
          return (
            <rect
              key={`${x}-${y}`}
              x={x * px}
              y={y * px}
              width={px + 0.5}   // tiny overlap prevents 1px seams
              height={px + 0.5}
              fill={palette[colorIdx]}
            />
          )
        })
      )}
    </svg>
  )
}

export { SPRITES as PIXEL_SPRITES }
