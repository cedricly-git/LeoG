export interface GameEventTemplate {
  id: number
  title: string
  /** Short label naming the real-world asset categories affected, e.g. "Energy & Commodity Stocks" */
  impactLabel: string
  /** Rich context explaining what happened and WHY it affects these specific assets */
  description: string
  icon: string
  color: string
  /** Magnitude of the event — multiplied against the asset's CSV multiplier to produce the bonus % */
  eventNumber: number
  /** true = the event bonus is added to the asset's return; false = it is subtracted */
  isPositive: boolean
  /**
   * Animal names (exactly as they appear in ASSET_ANIMAL_MAP values) that are
   * impacted by this event. Assets not listed here are unaffected.
   */
  affectedAnimalNames: string[]
}

export const GAME_EVENTS: GameEventTemplate[] = [
  {
    id: 1,
    title: 'The Great Locust Swarm — Energy Stocks Collapse',
    impactLabel: 'Energy & Commodity Stocks',
    description:
      'A sudden collapse in global commodity demand devastates major energy and mining companies. ' +
      'BHP, ExxonMobil, TotalEnergies, and Glencore — whose entire business depends on selling oil, gas, and raw materials at market prices — ' +
      'see revenues plunge. When the world stops consuming resources, these stocks have nowhere to hide: ' +
      'their earnings are directly tied to commodity prices, and lower demand means lower prices, lower profits, and lower stock valuations.',
    icon: '🦗',
    color: '#C4622D',
    eventNumber: 2,
    isPositive: false,
    affectedAnimalNames: [
      'Australian White Wheat',
      'French Soft Winter Wheat',
      'Alpine Barley',
      'American Yellow Corn',
    ],
  },
  {
    id: 2,
    title: 'The High Harvest Season — Broad Markets & Tech ETFs Surge',
    impactLabel: 'S&P 500, Global Index & Tech Sector ETFs',
    description:
      'A wave of strong economic data — robust GDP growth, falling unemployment, and record corporate earnings — ' +
      'sends the S&P 500 (SPY), the global MSCI World index, and the Technology Select Sector ETF to new highs. ' +
      'When the overall economy is healthy, diversified market ETFs benefit the most: ' +
      'they hold hundreds of companies at once, so broad prosperity lifts all of them together. ' +
      'A rising tide really does lift all boats.',
    icon: '🌾',
    color: '#1D5FA0',
    eventNumber: 3,
    isPositive: true,
    affectedAnimalNames: [
      'The Grand American Mixed Herd',
      'The Global Livestock Cooperative',
      'The Draft Horse Syndicate',
    ],
  },
  {
    id: 3,
    title: 'The Swine Flu Outbreak — Banking Crisis Erupts',
    impactLabel: 'Finance Stocks & Banking ETFs',
    description:
      'A wave of credit defaults and liquidity fears sweeps through the global financial system. ' +
      'Banks and financial institutions — Berkshire Hathaway, UBS, and the ETFs tracking the entire Financial and Regional Banking sectors — ' +
      'crater as investors flee. Banks are uniquely vulnerable to credit crises: they lend money out and earn interest, ' +
      'but when borrowers default en masse, those assets turn toxic, capital requirements tighten, and confidence collapses overnight. ' +
      'Fear spreads faster than facts in a banking panic.',
    icon: '🐷',
    color: '#6D28D9',
    eventNumber: 4,
    isPositive: false,
    affectedAnimalNames: [
      "The Prize Pig Breeders' Association",
      'The Local Piglet Pen',
      'Berkshire Pig',
      'Swiss Landrace Pig',
    ],
  },
  {
    id: 4,
    title: 'The Great Timber Rush — Crypto Bull Run Ignites',
    impactLabel: 'Crypto Assets (Bitcoin, Solana, Dogecoin)',
    description:
      'Institutional adoption announcements and a surge of retail speculation send Bitcoin, Solana, and Dogecoin soaring. ' +
      'Unlike stocks, cryptocurrencies have no underlying earnings or dividends — their price is driven almost entirely by ' +
      'supply, demand, and market sentiment. When confidence surges (driven by ETF approvals, halvings, or media hype), ' +
      'gains can be enormous in a very short time. The flip side: that same sentiment can reverse just as violently.',
    icon: '🪓',
    color: '#2D6A4F',
    eventNumber: 3,
    isPositive: true,
    affectedAnimalNames: [
      'Hammer',
      'Axe',
      'Chainsaw',
    ],
  },
  {
    id: 5,
    title: 'The Midnight Wolf Attack — US Stocks & Semiconductors Crash',
    impactLabel: 'S&P 500 & Leveraged Semiconductor ETF',
    description:
      'A sudden risk-off shock — whether a recession warning, an unexpected Fed rate hike, or a geopolitical scare — ' +
      'sends investors scrambling for the exits. The S&P 500 (SPY) drops sharply as broad US equity exposure becomes toxic. ' +
      'The triple-leveraged Semiconductor ETF takes three times the hit: leveraged funds amplify every market move, ' +
      'so a 5% market decline becomes a 15% loss. These instruments are powerful in calm markets and devastating in crashes.',
    icon: '🐺',
    color: '#B8860B',
    eventNumber: 4,
    isPositive: false,
    affectedAnimalNames: [
      'The Grand American Mixed Herd',
      'The Triple-Crown Racehorse Stables',
    ],
  },
  {
    id: 6,
    title: 'The Border Skirmish — Defense & Aerospace Stocks Rally',
    impactLabel: 'Defense Stocks & Aerospace ETFs',
    description:
      'Escalating geopolitical tensions force governments to announce emergency increases in defense spending. ' +
      'Defense contractors like Rheinmetall AG (the German arms giant) and Airbus (aerospace & defense) ' +
      'receive new contracts almost immediately. The iShares US Aerospace & Defense ETF and the triple-leveraged ' +
      'Direxion Defense ETF both rally strongly. Defense companies are counter-cyclical: when peace deteriorates, ' +
      'their order books fill up — uncertainty is their business.',
    icon: '🛡️',
    color: '#8B4513',
    eventNumber: 2,
    isPositive: true,
    affectedAnimalNames: [
      'The Working Dog Kennel',
      'The Tactical K-9 Training Camp',
      'German Shepherd',
      'Dutch Shepherd',
    ],
  },
  {
    id: 7,
    title: 'The Concrete Shelter Flight — Gold ETF & Swiss Bonds Rise',
    impactLabel: 'Gold ETF & Swiss Government Bonds',
    description:
      'As market uncertainty and volatility spike, investors abandon risky equities and rush into traditional safe havens. ' +
      'Gold (via the SPDR Gold Shares ETF) surges as it always has in times of fear — it cannot go bankrupt, ' +
      'it holds its purchasing power, and it has been trusted for millennia. Swiss government bonds also gain: ' +
      'Switzerland\'s political neutrality and fiscal discipline make its debt one of the most secure instruments on earth. ' +
      'When everything else looks fragile, these assets become priceless.',
    icon: '🏛️',
    color: '#475569',
    eventNumber: 2,
    isPositive: true,
    affectedAnimalNames: [
      'The Concrete Grain Reserve',
      'Swiss Cow',
    ],
  },
  {
    id: 8,
    title: 'The Miracle Greenhouse Discovery — Pharma & Biotech Soar',
    impactLabel: 'Pharma Stocks & Biotech ETFs',
    description:
      'A landmark FDA drug approval — combined with breakthrough clinical trial results — sends the entire pharmaceutical ' +
      'and biotech sector soaring. Roche and Novartis, as leading Swiss drug developers with massive R&D pipelines, ' +
      'see immediate share price gains. The VanEck Pharmaceutical ETF and the SPDR S&P Biotech ETF both rally. ' +
      'Pharmaceutical companies make money by selling patented drugs; a single successful drug can generate ' +
      'billions in revenue for decades — one approval can change a company\'s entire valuation overnight.',
    icon: '🌿',
    color: '#C4622D',
    eventNumber: 3,
    isPositive: true,
    affectedAnimalNames: [
      'The Experimental Hybrid Seed Greenhouse',
      'The Alpine Herb Conservatory',
      'Valerian Root',
      'Arnica',
    ],
  },
  {
    id: 9,
    title: 'The Iron Hoof Upgrade — AI & Chip Revolution Lifts Tech',
    impactLabel: 'Tech Giants, Semiconductors & Tech ETFs',
    description:
      'A transformative AI breakthrough and next-generation chip architecture announcement sends the entire technology ' +
      'sector into overdrive. Google, Apple, and TSMC — the world\'s most critical chip manufacturer, producing ' +
      'semiconductors for nearly every major device on the planet — all rally strongly. ' +
      'The Technology Select Sector ETF follows, and the triple-leveraged Semiconductor ETF explodes upward. ' +
      'Tech companies grow when their products get more powerful: more compute demand means more chip sales, ' +
      'more software subscriptions, and higher valuations across the board.',
    icon: '🔧',
    color: '#1D5FA0',
    eventNumber: 3,
    isPositive: true,
    affectedAnimalNames: [
      'The Draft Horse Syndicate',
      'The Triple-Crown Racehorse Stables',
      'American Quarter Horse',
      'Mustang',
      'Taiwanese Pony',
    ],
  },
  {
    id: 10,
    title: 'The Strategic Silo Leak — Oil Fund & Global Markets Weaken',
    impactLabel: 'US Oil Fund & Global Market ETF',
    description:
      'A sudden crude oil oversupply — triggered by OPEC production increases and weaker global demand — ' +
      'sends the United States Oil Fund (USO) tumbling. Energy costs affect virtually every industry: ' +
      'lower oil prices squeeze energy company revenues, and the uncertainty ripples through global supply chains. ' +
      'The iShares MSCI World ETF also weakens, as energy-sector heavyweights drag down the index. ' +
      'Oil is still the backbone of the global economy — when its price cracks, confidence in growth does too.',
    icon: '💧',
    color: '#2D6A4F',
    eventNumber: 2,
    isPositive: false,
    affectedAnimalNames: [
      'The Strategic Winter-Wheat Silo',
      'The Global Livestock Cooperative',
    ],
  },
  {
    id: 11,
    title: 'The Scorched Earth Drought — Energy, Oil & Even Bonds Hit',
    impactLabel: 'Energy Stocks, Oil Fund & Swiss Government Bonds',
    description:
      'A severe simultaneous shock across energy and commodity markets hits multiple asset classes at once. ' +
      'BHP, TotalEnergies, and Glencore suffer as production costs spike and margins collapse. ' +
      'The US Oil Fund drops as supply disruptions create wild pricing swings. ' +
      'Even the normally calm Swiss government bond loses ground — a rare event caused by surging inflation expectations ' +
      'from higher commodity prices, which erode the real value of fixed-rate bond coupons. ' +
      'This is why diversification matters: sometimes multiple "safe" assets move against you simultaneously.',
    icon: '🔥',
    color: '#6D28D9',
    eventNumber: 3,
    isPositive: false,
    affectedAnimalNames: [
      'Australian White Wheat',
      'French Soft Winter Wheat',
      'Alpine Barley',
      'Swiss Cow',
      'The Strategic Winter-Wheat Silo',
    ],
  },
  {
    id: 12,
    title: 'The Great Spring Farrowing — Banks & Finance ETFs Rally',
    impactLabel: 'Finance Stocks & Banking ETFs',
    description:
      'Stronger-than-expected earnings reports from major banks — combined with a favorable interest rate environment ' +
      'and a steepening yield curve — lift the entire financial sector. UBS posts record quarterly profits, ' +
      'while the Financial Select Sector SPDR and the Regional Banking ETF both climb steadily. ' +
      'Banks are simple businesses at their core: they borrow money cheaply (deposits) and lend it out expensively (loans). ' +
      'When rates are favorable and the economy is healthy, that spread widens — and profits multiply accordingly.',
    icon: '🐣',
    color: '#B8860B',
    eventNumber: 2,
    isPositive: true,
    affectedAnimalNames: [
      "The Prize Pig Breeders' Association",
      'The Local Piglet Pen',
      'Swiss Landrace Pig',
    ],
  },
]

export function getEventById(id: number): GameEventTemplate {
  return GAME_EVENTS.find(e => e.id === id) ?? GAME_EVENTS[0]
}
