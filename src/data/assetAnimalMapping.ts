/**
 * Asset → Animal mapping.
 *
 * Each financial asset (identified by its exact company name in the CSV files)
 * maps to a specific animal breed. The `animalCategory` groups them by the
 * broader livestock family used in the game.
 *
 * Image paths are relative to the project root /Images/ folder.
 * `image: null` means the image hasn't been added yet.
 */

export type AnimalCategory =
  | 'Pig'
  | 'Guard Dog'
  | 'Horse'
  | 'Medicinal Plant'
  | 'Grain Crop'
  | 'Bovine'
  | 'Collective'
  | 'Tool'
  | 'Hedge'

export interface AnimalMapping {
  /** Display name of the specific breed / variety */
  animal: string
  /** Broader family grouping used in the game */
  animalCategory: AnimalCategory
  /** Path relative to project root, e.g. "/Images/Pigs/Berkshirepig.jpg" */
  image: string | null
  /** Originating sector in the CSV data */
  sector: string
  /**
   * Price multiplier applied to the asset in the game.
   * Crypto assets use this to amplify returns/losses.
   * Defaults to 1 for all other assets.
   */
  multiplier: number
}

// ---------------------------------------------------------------------------
// Stocks
// ---------------------------------------------------------------------------

const stockMappings: Record<string, AnimalMapping> = {
  // ── Finance → Pigs ────────────────────────────────────────────────────────
  'Berkshire Hathaway': {
    animal: 'Berkshire Pig',
    animalCategory: 'Pig',
    image: '/Images/Pigs/Berkshirepig.jpg',
    sector: 'Finance',
    multiplier: 1,
  },
  UBS: {
    animal: 'Swiss Landrace Pig',
    animalCategory: 'Pig',
    image: '/Images/Pigs/Swisspig.jpg',
    sector: 'Finance',
    multiplier: 1,
  },
  ICBC: {
    animal: 'Meishan Pig',
    animalCategory: 'Pig',
    image: '/Images/Pigs/Meishanpig.jpg',
    sector: 'Finance',
    multiplier: 1,
  },
  'Visa Inc': {
    animal: 'Hampshire Pig',
    animalCategory: 'Pig',
    image: '/Images/Pigs/Hampshirepig.jpg',
    sector: 'Finance',
    multiplier: 1,
  },
  JPMorgan: {
    animal: 'American Duroc Pig',
    animalCategory: 'Pig',
    image: '/Images/Pigs/Durocpig.jpg',
    sector: 'Finance',
    multiplier: 1,
  },

  // ── Defense → Guard Dogs ──────────────────────────────────────────────────
  Dassault: {
    animal: 'Dogue de Bordeaux',
    animalCategory: 'Guard Dog',
    image: '/Images/GuardDogs/Doguedebordeaux.jpg',
    sector: 'Defense',
    multiplier: 1,
  },
  Palantir: {
    animal: 'American Bulldog',
    animalCategory: 'Guard Dog',
    image: '/Images/GuardDogs/Americanbulldog.jpg',
    sector: 'Defense',
    multiplier: 1,
  },
  'Smith & Wesson': {
    animal: 'American Foxhound',
    animalCategory: 'Guard Dog',
    image: '/Images/GuardDogs/Americanfoxhound.jpg',
    sector: 'Defense',
    multiplier: 1,
  },
  'Rheinmetall AG': {
    animal: 'German Shepherd',
    animalCategory: 'Guard Dog',
    image: '/Images/GuardDogs/Germanshepherd.jpg',
    sector: 'Defense',
    multiplier: 1,
  },
  Airbus: {
    animal: 'Dutch Shepherd',
    animalCategory: 'Guard Dog',
    image: '/Images/GuardDogs/Dutchshepherd.jpg',
    sector: 'Defense',
    multiplier: 1,
  },

  // ── Tech → Horses ─────────────────────────────────────────────────────────
  Google: {
    animal: 'American Quarter Horse',
    animalCategory: 'Horse',
    image: null,
    sector: 'Tech',
    multiplier: 1,
  },
  Apple: {
    animal: 'Mustang',
    animalCategory: 'Horse',
    image: null,
    sector: 'Tech',
    multiplier: 1,
  },
  TSMC: {
    animal: 'Taiwanese Pony',
    animalCategory: 'Horse',
    image: null,
    sector: 'Tech',
    multiplier: 1,
  },
  Tesla: {
    animal: 'American Saddlebred',
    animalCategory: 'Horse',
    image: null,
    sector: 'Tech',
    multiplier: 1,
  },
  Netflix: {
    animal: 'Morgan Horse',
    animalCategory: 'Horse',
    image: null,
    sector: 'Tech',
    multiplier: 1,
  },

  // ── Pharma → Medicinal Plants ─────────────────────────────────────────────
  Roche: {
    animal: 'Arnica',
    animalCategory: 'Medicinal Plant',
    image: null,
    sector: 'Pharma',
    multiplier: 1,
  },
  Lonza: {
    animal: 'Gentian',
    animalCategory: 'Medicinal Plant',
    image: null,
    sector: 'Pharma',
    multiplier: 1,
  },
  Pfizer: {
    animal: 'Echinacea',
    animalCategory: 'Medicinal Plant',
    image: null,
    sector: 'Pharma',
    multiplier: 1,
  },
  'Novo Nordisk': {
    animal: 'Rosehip',
    animalCategory: 'Medicinal Plant',
    image: null,
    sector: 'Pharma',
    multiplier: 1,
  },
  Novartis: {
    animal: 'Valerian Root',
    animalCategory: 'Medicinal Plant',
    image: null,
    sector: 'Pharma',
    multiplier: 1,
  },

  // ── Commodities → Grain Crops ─────────────────────────────────────────────
  Glencore: {
    animal: 'Alpine Barley',
    animalCategory: 'Grain Crop',
    image: null,
    sector: 'Commodities',
    multiplier: 1,
  },
  'BHP Group': {
    animal: 'Australian White Wheat',
    animalCategory: 'Grain Crop',
    image: null,
    sector: 'Commodities',
    multiplier: 1,
  },
  TotalEnergies: {
    animal: 'French Soft Winter Wheat',
    animalCategory: 'Grain Crop',
    image: null,
    sector: 'Commodities',
    multiplier: 1,
  },
  ExxonMobil: {
    animal: 'American Yellow Corn',
    animalCategory: 'Grain Crop',
    image: null,
    sector: 'Commodities',
    multiplier: 1,
  },
  PetroChina: {
    animal: 'Chinese Sorghum',
    animalCategory: 'Grain Crop',
    image: null,
    sector: 'Commodities',
    multiplier: 1,
  },
}

// ---------------------------------------------------------------------------
// Crypto  → Tools  (volatile, leveraged feel — multiplier amplifies swings)
// ---------------------------------------------------------------------------

const cryptoMappings: Record<string, AnimalMapping> = {
  Bitcoin: {
    animal: 'Hammer',
    animalCategory: 'Tool',
    image: null,
    sector: 'Crypto',
    multiplier: 4,
  },
  Solana: {
    animal: 'Axe',
    animalCategory: 'Tool',
    image: null,
    sector: 'Crypto',
    multiplier: 8,
  },
  Dogecoin: {
    animal: 'Chainsaw',
    animalCategory: 'Tool',
    image: null,
    sector: 'Crypto',
    multiplier: 12,
  },
}

// ---------------------------------------------------------------------------
// Gold & Silver  (mapping TBD)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Gold & Silver  → Hedge (no animal mapping — displayed as themselves)
// ---------------------------------------------------------------------------

const goldSilverMappings: Record<string, AnimalMapping> = {
  Gold: {
    animal: 'Gold',
    animalCategory: 'Hedge',
    image: null,
    sector: 'Hedge',
    multiplier: 1,
  },
  Silver: {
    animal: 'Silver',
    animalCategory: 'Hedge',
    image: null,
    sector: 'Hedge',
    multiplier: 1,
  },
}

// ---------------------------------------------------------------------------
// ETFs  → Collectives (herds, flocks, syndicates, kennels, stables…)
// ---------------------------------------------------------------------------

const etfMappings: Record<string, AnimalMapping> = {
  // ── Broad Market ETFs (Mixed Herds & Flocks) ──────────────────────────────
  'SPDR S&P 500 ETF Trust': {
    animal: 'The Grand American Mixed Herd',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },
  'iShares MSCI World ETF': {
    animal: 'The Global Livestock Cooperative',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },
  'iShares Russell 2000 ETF': {
    animal: 'The American Free-Range Flock',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },

  // ── Low Risk Sector ETFs (Targeted Asset Baskets) ─────────────────────────
  'Technology Select Sector SPDR': {
    animal: 'The Draft Horse Syndicate',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },
  'Financial Select Sector SPDR': {
    animal: "The Prize Pig Breeders' Association",
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },
  'SPDR Gold Shares': {
    animal: 'The Concrete Grain Reserve',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },
  'VanEck Pharmaceutical ETF': {
    animal: 'The Alpine Herb Conservatory',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },
  'iShares US Aerospace Defense ETF': {
    animal: 'The Working Dog Kennel',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },

  // ── Higher Risk ETFs (Leveraged, Niche, or Volatile Baskets) ─────────────
  'Direxion Daily Semiconductor 3X': {
    animal: 'The Triple-Crown Racehorse Stables',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },
  'SPDR S&P Regional Banking ETF': {
    animal: 'The Local Piglet Pen',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },
  'United States Oil Fund': {
    animal: 'The Strategic Winter-Wheat Silo',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },
  'SPDR S&P Biotech ETF': {
    animal: 'The Experimental Hybrid Seed Greenhouse',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },
  'Direxion Daily Aerospace Defense 3X': {
    animal: 'The Tactical K-9 Training Camp',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
  },
}

// ---------------------------------------------------------------------------
// Bonds  → Bovines
// ---------------------------------------------------------------------------

const bondMappings: Record<string, AnimalMapping> = {
  'Swiss gov bond': {
    animal: 'Swiss Cow',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 1,
  },
  'US 2Y': {
    animal: 'American Milking Devon Cow',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 1,
  },
  'US 10Y': {
    animal: 'Bison',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 1,
  },
  JGBs: {
    animal: 'Yak',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 1,
  },
  'French OATS': {
    animal: 'Charolais Cow',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 1,
  },
  'German Bund 10Y': {
    animal: 'Fleckvieh Cow',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 1,
  },
  'Bank of America': {
    animal: 'American Brahman Cow',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 1,
  },
}

// ---------------------------------------------------------------------------
// Master lookup – merge all asset types into one map
// ---------------------------------------------------------------------------

export const ASSET_ANIMAL_MAP: Record<string, AnimalMapping> = {
  ...stockMappings,
  ...cryptoMappings,
  ...goldSilverMappings,
  ...etfMappings,
  ...bondMappings,
}

/**
 * Given a company/asset name as it appears in the CSV data, return
 * the corresponding animal mapping, or `undefined` if no mapping exists yet.
 */
export function getAnimalForAsset(assetName: string): AnimalMapping | undefined {
  return ASSET_ANIMAL_MAP[assetName]
}

/**
 * Convenience: return just the animal display name, e.g. "Mustang".
 * Falls back to the raw asset name if no mapping is found.
 */
export function getAnimalName(assetName: string): string {
  return ASSET_ANIMAL_MAP[assetName]?.animal ?? assetName
}
