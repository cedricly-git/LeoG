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
   * Sourced directly from the Multiplier column in the CSV files.
   * Higher values amplify both gains and losses.
   */
  multiplier: number
  /**
   * Actual average annual return (CAGR) computed from the historical CSV price data.
   * e.g. "+14.1% avg/yr" or "-5.1% avg/yr"
   */
  returnProfile: string
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
    multiplier: 2.5,
    returnProfile: '+11.8% avg/yr',
  },
  UBS: {
    animal: 'Swiss Landrace Pig',
    animalCategory: 'Pig',
    image: '/Images/Pigs/Swisspig.jpg',
    sector: 'Finance',
    multiplier: 2.5,
    returnProfile: '+18.3% avg/yr',
  },
  ICBC: {
    animal: 'Meishan Pig',
    animalCategory: 'Pig',
    image: '/Images/Pigs/Meishanpig.jpg',
    sector: 'Finance',
    multiplier: 2.5,
    returnProfile: '+6.4% avg/yr',
  },
  'Visa Inc': {
    animal: 'Hampshire Pig',
    animalCategory: 'Pig',
    image: '/Images/Pigs/Hampshirepig.jpg',
    sector: 'Finance',
    multiplier: 2.5,
    returnProfile: '+7.3% avg/yr',
  },
  JPMorgan: {
    animal: 'American Duroc Pig',
    animalCategory: 'Pig',
    image: '/Images/Pigs/Durocpig.jpg',
    sector: 'Finance',
    multiplier: 2.5,
    returnProfile: '+12.1% avg/yr',
  },

  // ── Defense → Guard Dogs ──────────────────────────────────────────────────
  Dassault: {
    animal: 'Dogue de Bordeaux',
    animalCategory: 'Guard Dog',
    image: '/Images/GuardDogs/Doguedebordeaux.jpg',
    sector: 'Defense',
    multiplier: 2.5,
    returnProfile: '-4.9% avg/yr',
  },
  Palantir: {
    animal: 'American Bulldog',
    animalCategory: 'Guard Dog',
    image: '/Images/GuardDogs/Americanbulldog.jpg',
    sector: 'Defense',
    multiplier: 2.5,
    returnProfile: '+93.6% avg/yr',
  },
  'Smith & Wesson': {
    animal: 'American Foxhound',
    animalCategory: 'Guard Dog',
    image: '/Images/GuardDogs/Americanfoxhound.jpg',
    sector: 'Defense',
    multiplier: 2.5,
    returnProfile: '+1.5% avg/yr',
  },
  'Rheinmetall AG': {
    animal: 'German Shepherd',
    animalCategory: 'Guard Dog',
    image: '/Images/GuardDogs/Germanshepherd.jpg',
    sector: 'Defense',
    multiplier: 2.5,
    returnProfile: '+71.2% avg/yr',
  },
  Airbus: {
    animal: 'Dutch Shepherd',
    animalCategory: 'Guard Dog',
    image: '/Images/GuardDogs/Dutchshepherd.jpg',
    sector: 'Defense',
    multiplier: 2.5,
    returnProfile: '+8.5% avg/yr',
  },

  // ── Tech → Horses ─────────────────────────────────────────────────────────
  Google: {
    animal: 'American Quarter Horse',
    animalCategory: 'Horse',
    image: null,
    sector: 'Tech',
    multiplier: 2.5,
    returnProfile: '+26.4% avg/yr',
  },
  Apple: {
    animal: 'Mustang',
    animalCategory: 'Horse',
    image: null,
    sector: 'Tech',
    multiplier: 2.5,
    returnProfile: '+18.7% avg/yr',
  },
  TSMC: {
    animal: 'Taiwanese Pony',
    animalCategory: 'Horse',
    image: null,
    sector: 'Tech',
    multiplier: 2.5,
    returnProfile: '+26.0% avg/yr',
  },
  Tesla: {
    animal: 'American Saddlebred',
    animalCategory: 'Horse',
    image: null,
    sector: 'Tech',
    multiplier: 2.5,
    returnProfile: '+32.1% avg/yr',
  },
  Netflix: {
    animal: 'Morgan Horse',
    animalCategory: 'Horse',
    image: null,
    sector: 'Tech',
    multiplier: 2.5,
    returnProfile: '+22.0% avg/yr',
  },

  // ── Pharma → Medicinal Plants ─────────────────────────────────────────────
  Roche: {
    animal: 'Arnica',
    animalCategory: 'Medicinal Plant',
    image: null,
    sector: 'Pharma',
    multiplier: 2.5,
    returnProfile: '+2.0% avg/yr',
  },
  Lonza: {
    animal: 'Gentian',
    animalCategory: 'Medicinal Plant',
    image: null,
    sector: 'Pharma',
    multiplier: 2.5,
    returnProfile: '+3.6% avg/yr',
  },
  Pfizer: {
    animal: 'Echinacea',
    animalCategory: 'Medicinal Plant',
    image: null,
    sector: 'Pharma',
    multiplier: 2.5,
    returnProfile: '+0.7% avg/yr',
  },
  'Novo Nordisk': {
    animal: 'Rosehip',
    animalCategory: 'Medicinal Plant',
    image: null,
    sector: 'Pharma',
    multiplier: 2.5,
    returnProfile: '+8.1% avg/yr',
  },
  Novartis: {
    animal: 'Valerian Root',
    animalCategory: 'Medicinal Plant',
    image: null,
    sector: 'Pharma',
    multiplier: 2.5,
    returnProfile: '+10.2% avg/yr',
  },

  // ── Commodities → Grain Crops ─────────────────────────────────────────────
  Glencore: {
    animal: 'Alpine Barley',
    animalCategory: 'Grain Crop',
    image: null,
    sector: 'Commodities',
    multiplier: 2.5,
    returnProfile: '+13.1% avg/yr',
  },
  'BHP Group': {
    animal: 'Australian White Wheat',
    animalCategory: 'Grain Crop',
    image: null,
    sector: 'Commodities',
    multiplier: 2.5,
    returnProfile: '+3.2% avg/yr',
  },
  TotalEnergies: {
    animal: 'French Soft Winter Wheat',
    animalCategory: 'Grain Crop',
    image: null,
    sector: 'Commodities',
    multiplier: 2.5,
    returnProfile: '+10.7% avg/yr',
  },
  ExxonMobil: {
    animal: 'American Yellow Corn',
    animalCategory: 'Grain Crop',
    image: null,
    sector: 'Commodities',
    multiplier: 2.5,
    returnProfile: '+20.3% avg/yr',
  },
  PetroChina: {
    animal: 'Rice',
    animalCategory: 'Grain Crop',
    image: '/Images/Cereals/Rice.jpg',
    sector: 'Commodities',
    multiplier: 2.5,
    returnProfile: '+24.6% avg/yr',
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
    returnProfile: '+28.3% avg/yr',
  },
  Solana: {
    animal: 'Axe',
    animalCategory: 'Tool',
    image: null,
    sector: 'Crypto',
    multiplier: 8,
    returnProfile: '+329.2% avg/yr',
  },
  Dogecoin: {
    animal: 'Chainsaw',
    animalCategory: 'Tool',
    image: null,
    sector: 'Crypto',
    multiplier: 10,
    returnProfile: '+56.2% avg/yr',
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
    multiplier: 0.25,
    returnProfile: '+20.2% avg/yr',
  },
  Silver: {
    animal: 'Silver',
    animalCategory: 'Hedge',
    image: null,
    sector: 'Hedge',
    multiplier: 0.25,
    returnProfile: '+26.6% avg/yr',
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
    multiplier: 0.5,
    returnProfile: '+10.6% avg/yr',
  },
  'iShares MSCI World ETF': {
    animal: 'The Global Livestock Cooperative',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 0.5,
    returnProfile: '+8.7% avg/yr',
  },
  'iShares Russell 2000 ETF': {
    animal: 'The American Free-Range Flock',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 0.5,
    returnProfile: '+2.1% avg/yr',
  },

  // ── Low Risk Sector ETFs (Targeted Asset Baskets) ─────────────────────────
  'Technology Select Sector SPDR': {
    animal: 'The Draft Horse Syndicate',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
    returnProfile: '+17.4% avg/yr',
  },
  'Financial Select Sector SPDR': {
    animal: "The Prize Pig Breeders' Association",
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
    returnProfile: '+6.6% avg/yr',
  },
  'SPDR Gold Shares': {
    animal: 'The Concrete Grain Reserve',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
    returnProfile: '+19.6% avg/yr',
  },
  'VanEck Pharmaceutical ETF': {
    animal: 'The Alpine Herb Conservatory',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
    returnProfile: '+6.5% avg/yr',
  },
  'iShares US Aerospace Defense ETF': {
    animal: 'The Working Dog Kennel',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 1,
    returnProfile: '+14.7% avg/yr',
  },

  // ── Higher Risk ETFs (Leveraged, Niche, or Volatile Baskets) ─────────────
  'Direxion Daily Semiconductor 3X': {
    animal: 'The Triple-Crown Racehorse Stables',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 4,
    returnProfile: '+52.4% avg/yr',
  },
  'SPDR S&P Regional Banking ETF': {
    animal: 'The Local Piglet Pen',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 4,
    returnProfile: '-1.4% avg/yr',
  },
  'United States Oil Fund': {
    animal: 'The Strategic Winter-Wheat Silo',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 4,
    returnProfile: '+23.7% avg/yr',
  },
  'SPDR S&P Biotech ETF': {
    animal: 'The Experimental Hybrid Seed Greenhouse',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 4,
    returnProfile: '-1.0% avg/yr',
  },
  'Direxion Daily Aerospace Defense 3X': {
    animal: 'The Tactical K-9 Training Camp',
    animalCategory: 'Collective',
    image: null,
    sector: 'ETF',
    multiplier: 4,
    returnProfile: '+29.0% avg/yr',
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
    multiplier: 0.5,
    returnProfile: '-1.5% avg/yr',
  },
  'US 2Y': {
    animal: 'American Milking Devon Cow',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 1,
    returnProfile: '-0.7% avg/yr',
  },
  'US 10Y': {
    animal: 'Bison',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 0.1,
    returnProfile: '+22.7% avg/yr',
  },
  JGBs: {
    animal: 'Yak',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 0.5,
    returnProfile: '-4.0% avg/yr',
  },
  'French OATS': {
    animal: 'Charolais Cow',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 0.5,
    returnProfile: '-3.6% avg/yr',
  },
  'German Bund 10Y': {
    animal: 'Fleckvieh Cow',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 0.1,
    returnProfile: '-3.0% avg/yr',
  },
  'Bank of America': {
    animal: 'American Brahman Cow',
    animalCategory: 'Bovine',
    image: null,
    sector: 'Bond',
    multiplier: 2,
    returnProfile: '-0.2% avg/yr',
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
