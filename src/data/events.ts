export interface GameEventTemplate {
  id: number
  title: string
  /** Short label naming the farm assets affected, e.g. "Grain Fields & Cereal Crops" */
  impactLabel: string
  /** Rich farm-world context explaining what happened and WHY it affects these specific animals/crops */
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
    title: 'The Great Locust Swarm — Grain Fields Stripped Bare',
    impactLabel: 'Grain Crops & Cereal Fields',
    description:
      'A biblical swarm of locusts descends on the valley and strips every grain field bare in a matter of hours. ' +
      'The Australian White Wheat, French Soft Winter Wheat, Alpine Barley, and American Yellow Corn — ' +
      'all carefully tended through months of growth — are reduced to bare earth overnight. ' +
      'Farmers who cultivated these crops lose their entire harvest: no grain to sell at market, ' +
      'no feed stored for winter, and no seed saved for next season. ' +
      'When the fields stand empty, their worth goes with them.',
    icon: '🦗',
    color: '#C4622D',
    eventNumber: 4,
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
    title: 'The High Harvest Season — All Herds Grow Fat',
    impactLabel: 'Mixed Herds & Draft Horse Syndicate',
    description:
      'Perfect conditions bless every corner of the ranch. Warm days, cool nights, and generous rain fill the pastures ' +
      'with lush grass from fence to fence. The Grand American Mixed Herd puts on weight at a record pace, ' +
      'the Global Livestock Cooperative reports its healthiest animals in years, ' +
      'and the Draft Horse Syndicate hauls record loads with tireless, effortless strength. ' +
      'When the land is abundant, every animal that grazes it flourishes — ' +
      'and a fat, healthy animal is worth far more at market than a thin, struggling one.',
    icon: '🌾',
    color: '#1D5FA0',
    eventNumber: 6,
    isPositive: true,
    affectedAnimalNames: [
      'The Grand American Mixed Herd',
      'The Global Livestock Cooperative',
      'The Draft Horse Syndicate',
    ],
  },
  {
    id: 3,
    title: 'The Swine Flu Outbreak — Pig Pens Under Quarantine',
    impactLabel: 'Pigs, Pig Breeders & Pig Pen Collectives',
    description:
      'A fast-spreading illness rips through the pig population before anyone can contain it. ' +
      'The Prize Pig Breeders\' Association scrambles to quarantine its prized boars, ' +
      'the Local Piglet Pen loses entire litters, and the celebrated Berkshire and Swiss Landrace pigs fall dangerously ill. ' +
      'Sick pigs lose weight quickly, cannot breed, and cannot be sold at full market value. ' +
      'The contagion leaps from pen to pen before the farmers can build proper barriers. ' +
      'A diseased animal is worth a fraction of a healthy one — and doubt spreads to every pig on the farm.',
    icon: '🐷',
    color: '#6D28D9',
    eventNumber: 8,
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
    title: 'The Great Timber Rush — Farm Tools Are Worth Their Weight in Gold',
    impactLabel: 'Farm Tools (Hammer, Axe & Chainsaw)',
    description:
      'A massive construction project sweeps through the region: new barns, fences, and grain silos are needed ' +
      'on every farm at once. Suddenly every rancher is desperate for hammers, axes, and chainsaws — ' +
      'the very tools that were gathering dust in the shed are now the most coveted items in the valley. ' +
      'When demand for a tool explodes and supply stays fixed, its value soars. ' +
      'The farmer who had the foresight to stock extra tools can now rent them out at a steep premium ' +
      'to every neighbor within riding distance.',
    icon: '🪓',
    color: '#2D6A4F',
    eventNumber: 6,
    isPositive: true,
    affectedAnimalNames: [
      'Hammer',
      'Axe',
      'Chainsaw',
    ],
  },
  {
    id: 5,
    title: 'The Midnight Wolf Attack — Herds Scatter in Panic',
    impactLabel: 'Grand Mixed Herd & Racehorse Stables',
    description:
      'A brazen wolf pack breaches the outer fence under cover of darkness, sending the Grand American Mixed Herd ' +
      'stampeding across the pasture in every direction. The chaos reaches the Triple-Crown Racehorse Stables, ' +
      'where the high-strung thoroughbreds — spooked by the noise and the smell of blood — ' +
      'injure themselves against the stable walls. Scattered animals lose condition fast, and some are never recovered. ' +
      'A panicked herd is worth far less than a calm one: fences are damaged, animals shed weight from stress, ' +
      'and it takes weeks before things settle enough to hold a proper count.',
    icon: '🐺',
    color: '#B8860B',
    eventNumber: 8,
    isPositive: false,
    affectedAnimalNames: [
      'The Grand American Mixed Herd',
      'The Triple-Crown Racehorse Stables',
    ],
  },
  {
    id: 6,
    title: 'The Border Skirmish — Guard Dogs Command a Premium',
    impactLabel: 'Guard Dogs, Kennels & K-9 Training Camps',
    description:
      'Tensions with the neighboring ranch boil over into a full territorial dispute over grazing rights. ' +
      'Suddenly every farmer needs reliable guard dogs patrolling the perimeter day and night. ' +
      'The Working Dog Kennel and the Tactical K-9 Training Camp are flooded with urgent requests, ' +
      'while the prized German Shepherd and Dutch Shepherd breeds command a steep premium at every livestock market. ' +
      'A well-trained guard dog in uncertain times is worth its weight in grain — ' +
      'the more dangerous the neighborhood, the more valuable the dog watching your fence.',
    icon: '🛡️',
    color: '#8B4513',
    eventNumber: 4,
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
    title: 'The Concrete Shelter Flight — Safe Havens Fill Quickly',
    impactLabel: 'Gold Grain Reserve & Swiss Cows',
    description:
      'As a violent storm rolls across the valley, panicked farmers abandon their exposed and volatile animals ' +
      'and rush to move their most dependable assets under solid cover. ' +
      'The Concrete Grain Reserve — indestructible, impervious to weather, and built to last centuries — fills first. ' +
      'The Swiss Cow, known across the entire valley for her docile temperament and steady milk yield ' +
      'regardless of season or stress, is the most sought-after animal to stable indoors. ' +
      'When everything outside is at risk, the assets that reliably hold their worth become the most precious of all.',
    icon: '🏛️',
    color: '#475569',
    eventNumber: 4,
    isPositive: true,
    affectedAnimalNames: [
      'The Concrete Grain Reserve',
      'Swiss Cow',
    ],
  },
  {
    id: 8,
    title: 'The Miracle Greenhouse Discovery — Healing Herbs in High Demand',
    impactLabel: 'Medicinal Herbs & Greenhouse Collections',
    description:
      'A local healer announces that the plants growing in the farm\'s greenhouses cure a widespread ailment ' +
      'that has plagued cattle and horses across the entire region for years. Word spreads like wildfire. ' +
      'The Experimental Hybrid Seed Greenhouse and the Alpine Herb Conservatory are immediately ' +
      'overwhelmed with orders from every farm in the valley. ' +
      'Valerian Root and Arnica — previously modest corner crops — are suddenly rationed like rare spice. ' +
      'When a plant heals what nothing else can, its grower holds all the power, ' +
      'and every acre of greenhouse space becomes priceless overnight.',
    icon: '🌿',
    color: '#C4622D',
    eventNumber: 6,
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
    title: 'The Iron Hoof Upgrade — Horses Run Faster & Work Harder',
    impactLabel: 'Horses, Racehorse Stables & Horse Syndicates',
    description:
      'A master blacksmith unveils a revolutionary new horseshoe design — lighter, stronger, ' +
      'and shaped to the natural contour of the hoof so it never pinches or tires the leg. ' +
      'Every horse fitted with the iron hooves shows immediate, dramatic improvement. ' +
      'The Draft Horse Syndicate hauls heavier loads with less fatigue, ' +
      'the Triple-Crown Racehorse Stables clock their fastest training times in history, ' +
      'and the American Quarter Horse, the Mustang, and the Taiwanese Pony are all revalued upward at auction. ' +
      'A better horse does more work, wins more races, and puts more meat on the table — ' +
      'and a horse that wins is worth many times more than one that merely trots.',
    icon: '🔧',
    color: '#1D5FA0',
    eventNumber: 6,
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
    title: 'The Strategic Silo Leak — Winter Stores Silently Rot',
    impactLabel: 'Winter-Wheat Silo & Global Livestock Cooperative',
    description:
      'A hairline crack in the foundation of the Strategic Winter-Wheat Silo goes unnoticed for weeks ' +
      'while moisture seeps in and quietly rots the stored grain from the bottom up. ' +
      'By the time the damage is discovered, months of carefully hoarded reserves are ruined. ' +
      'The shock ripples through the Global Livestock Cooperative, which had counted on those stored grain stocks ' +
      'to feed its animals throughout the cold months ahead. ' +
      'Without reserves, members must scramble to buy feed at whatever price the market demands. ' +
      'A silo that was supposed to be full of security turns out to be nearly empty.',
    icon: '💧',
    color: '#2D6A4F',
    eventNumber: 4,
    isPositive: false,
    affectedAnimalNames: [
      'The Strategic Winter-Wheat Silo',
      'The Global Livestock Cooperative',
    ],
  },
  {
    id: 11,
    title: 'The Scorched Earth Drought — Fields, Cows & Silos All Suffer',
    impactLabel: 'Grain Fields, Swiss Cows & Wheat Silos',
    description:
      'Three months pass without a drop of rain. The grain fields — Australian White Wheat, French Soft Winter Wheat, ' +
      'and Alpine Barley — shrivel and fail entirely, leaving cracked earth where crops once stood. ' +
      'The Swiss Cow, normally a model of steady, dependable milk production, ' +
      'sees her yield collapse as every patch of pasture grass turns brown and brittle. ' +
      'Even the Strategic Winter-Wheat Silo empties faster than expected ' +
      'as desperate farmers raid the reserves just to keep their remaining animals alive. ' +
      'A drought is the cruelest kind of disaster — it attacks the crops, exhausts the animals, ' +
      'and burns through every stored resource all at once.',
    icon: '🔥',
    color: '#6D28D9',
    eventNumber: 6,
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
    title: 'The Great Spring Farrowing — Piglet Season Overflows',
    impactLabel: 'Pigs, Pig Breeders & Pig Pen Collectives',
    description:
      'Spring arrives with the largest and healthiest wave of piglet births the valley has seen in a generation. ' +
      'The Prize Pig Breeders\' Association celebrates record litter sizes across its breeding stock, ' +
      'the Local Piglet Pen is bursting at the seams with squealing young animals, ' +
      'and the prized Swiss Landrace Pig delivers her biggest litter in five years. ' +
      'New piglets mean more animals ready to sell come autumn, more breeding stock for next season, ' +
      'and a surge of productive energy through every pig operation on the farm. ' +
      'A ranch that starts the season with more animals than expected holds a head start ' +
      'over every competitor in the valley.',
    icon: '🐣',
    color: '#B8860B',
    eventNumber: 4,
    isPositive: true,
    affectedAnimalNames: [
      "The Prize Pig Breeders' Association",
      'The Local Piglet Pen',
      'Swiss Landrace Pig',
    ],
  },

  // ── New events covering previously untouched assets ────────────────────────

  {
    id: 13,
    title: 'The Grand Cattle Rally — Bovines Find Rich Pasture',
    impactLabel: 'Cattle Herds (US, European & Asian Bovines)',
    description:
      'After a lean season on the outer fields, the valley\'s lowland pastures are replanted with dense, ' +
      'nutritious clover — the richest grazing the cattle have seen in years. ' +
      'The American Milking Devon\'s milk yield doubles overnight. The Bison\'s powerful frame fills out faster than expected. ' +
      'The Yak, the Charolais, and the Fleckvieh all put on weight steadily throughout the season, ' +
      'while the American Brahman thrives in the warmer southern paddocks. ' +
      'Steady cattle do not dazzle at the fair — but when their condition is right, ' +
      'serious buyers always know it.',
    icon: '🐄',
    color: '#6B7280',
    eventNumber: 4,
    isPositive: true,
    affectedAnimalNames: [
      'American Milking Devon Cow',
      'Bison',
      'Yak',
      'Charolais Cow',
      'Fleckvieh Cow',
      'American Brahman Cow',
    ],
  },
  {
    id: 14,
    title: 'The Cattle Blight — Bovine Herds Ravaged',
    impactLabel: 'Cattle Herds (US, European & Asian Bovines)',
    description:
      'A slow-moving but devastating blight creeps through the valley\'s bovine population. ' +
      'Unlike the quick drama of swine flu, this illness works quietly — reducing milk yields week by week, ' +
      'sapping the strength of the Bison and Yak, and leaving the Continental cattle breeds too weak to travel to market. ' +
      'The American Brahman holds out longest, but even she begins to decline by the third month. ' +
      'When steady animals start failing, no amount of careful husbandry can fully stop the bleeding — ' +
      'and buyers step back from any breed with a question mark over its health.',
    icon: '🤒',
    color: '#78716C',
    eventNumber: 6,
    isPositive: false,
    affectedAnimalNames: [
      'American Milking Devon Cow',
      'Bison',
      'Yak',
      'Charolais Cow',
      'Fleckvieh Cow',
      'American Brahman Cow',
    ],
  },
  {
    id: 15,
    title: 'The Precious Metal Rush — Gold & Silver Fever Grips the Valley',
    impactLabel: 'Precious Metals (Gold & Silver)',
    description:
      'Prospectors working the northern hills above the farm strike twin veins — one of gold, one of silver. ' +
      'Within days, every farmer who was storing value in grain or livestock rushes to convert their surplus into metal. ' +
      'Unlike animals, gold and silver never fall ill, never need feeding, and never lose weight over winter. ' +
      'They simply sit in the vault and hold their worth — and in a season of uncertainty, ' +
      'that kind of reliability is worth more than any prize bull at auction.',
    icon: '⛏️',
    color: '#D97706',
    eventNumber: 6,
    isPositive: true,
    affectedAnimalNames: [
      'Gold',
      'Silver',
    ],
  },
  {
    id: 16,
    title: 'The Tarnished Vault — Precious Metals Flooded with Supply',
    impactLabel: 'Precious Metals (Gold & Silver)',
    description:
      'Rumours begin to circulate that the valley\'s central vault has been quietly selling off its strategic reserves, ' +
      'releasing far more gold and silver into circulation than the market can absorb. ' +
      'When supply exceeds demand, even the most trusted store of value loses ground. ' +
      'Farmers who moved into metals find their holdings worth measurably less by month\'s end. ' +
      'The metals themselves haven\'t changed — but the confidence behind them has cracked, ' +
      'and on this farm, confidence is half the price.',
    icon: '🪙',
    color: '#92400E',
    eventNumber: 4,
    isPositive: false,
    affectedAnimalNames: [
      'Gold',
      'Silver',
    ],
  },
  {
    id: 17,
    title: 'The Pig Traders\' Jamboree — Rare Breeds Fetch Top Coin',
    impactLabel: 'Rare Pig Breeds (Meishan, Hampshire & Duroc)',
    description:
      'A traveling pig trader sets up a three-day jamboree at the crossroads market, ' +
      'drawing collectors and breeders from across four provinces who specifically seek the rarer, ' +
      'less common pig varieties. The Meishan\'s distinctive floppy ears and eastern pedigree spark a bidding war. ' +
      'The Hampshire\'s sharp black-and-white saddle pattern catches every eye in the ring. ' +
      'The American Duroc\'s deep brick-red coat and powerful frame make it the most photographed pig of the season. ' +
      'At the right auction, rarity is its own kind of value — and these three breeds are anything but common.',
    icon: '🎪',
    color: '#7C3AED',
    eventNumber: 6,
    isPositive: true,
    affectedAnimalNames: [
      'Meishan Pig',
      'Hampshire Pig',
      'American Duroc Pig',
    ],
  },
  {
    id: 18,
    title: 'The Sick Sow Season — Rare Pig Breeds Lose Condition',
    impactLabel: 'Rare Pig Breeds (Meishan, Hampshire & Duroc)',
    description:
      'A second wave of illness — slower than the swine flu but just as damaging over time — ' +
      'works its way through the pens holding the rarer pig breeds. ' +
      'The Meishan, Hampshire, and Duroc are hardy animals in good times, ' +
      'but their smaller population sizes make containment nearly impossible once the contagion spreads. ' +
      'Sick pigs lose sale weight every week. Treatment costs eat into margins. ' +
      'And buyers who were excited about rare breeds last season are suddenly in no rush to take on an animal with a vet bill.',
    icon: '🐽',
    color: '#BE185D',
    eventNumber: 6,
    isPositive: false,
    affectedAnimalNames: [
      'Meishan Pig',
      'Hampshire Pig',
      'American Duroc Pig',
    ],
  },
  {
    id: 19,
    title: 'The Watchtower Contracts — Elite Guard Dogs Hired Across the Valley',
    impactLabel: 'Elite Guard Dog Breeds (Dogue, Bulldog & Foxhound)',
    description:
      'A wave of livestock theft sweeps three neighbouring ranches in the same month, ' +
      'and the valley council responds by issuing formal watchtower contracts to the farms with the most imposing dogs. ' +
      'The Dogue de Bordeaux — massive, territorial, and nearly impossible to bluff — ' +
      'is placed at every main gate. The American Bulldog\'s ferocious tenacity earns it the night patrols. ' +
      'The American Foxhound\'s tireless nose tracks stolen animals across miles of dark pasture. ' +
      'When contracts are signed, demand is guaranteed — and guaranteed demand means guaranteed price.',
    icon: '🔐',
    color: '#1D4ED8',
    eventNumber: 6,
    isPositive: true,
    affectedAnimalNames: [
      'Dogue de Bordeaux',
      'American Bulldog',
      'American Foxhound',
    ],
  },
  {
    id: 20,
    title: 'The Valley Racing Circuit — Showhorses & Parade Breeds Take the Stage',
    impactLabel: 'Showring & Parade Horses (Saddlebred & Morgan)',
    description:
      'A new paved road through the valley opens a professional racing and parade circuit ' +
      'that draws paying spectators from every corner of the region. ' +
      'The American Saddlebred — bred over generations for elegance, high-stepping grace, and showring presence — ' +
      'becomes the parade horse of choice at every opening ceremony. ' +
      'The Morgan Horse\'s rare combination of strength, endurance, and natural charisma wins over circuit judges week after week. ' +
      'Horses that perform in public are horses that sell — ' +
      'and once a breed earns a reputation in the ring, buyers are willing to wait months for a foal.',
    icon: '🏇',
    color: '#B45309',
    eventNumber: 6,
    isPositive: true,
    affectedAnimalNames: [
      'American Saddlebred',
      'Morgan Horse',
    ],
  },
  {
    id: 21,
    title: 'The Valley Plague — Wild Herbs Are the Only Cure',
    impactLabel: 'Wild Medicinal Herbs (Gentian, Echinacea & Rosehip)',
    description:
      'A mysterious fever tears through the valley\'s cattle and horse population, ' +
      'and the ranch veterinarian exhausts every conventional treatment without success. ' +
      'The breakthrough comes from three humble wild plants: Gentian, Echinacea, and Rosehip — ' +
      'plants that every herb grower has been quietly tending for years without much fanfare. ' +
      'Overnight, the farmers who grow them cannot fill orders fast enough. ' +
      'A plant with no buyers one day can have a six-month waiting list the next, ' +
      'when it turns out to be the only thing standing between a sick herd and total loss.',
    icon: '🌱',
    color: '#065F46',
    eventNumber: 8,
    isPositive: true,
    affectedAnimalNames: [
      'Gentian',
      'Echinacea',
      'Rosehip',
    ],
  },
  {
    id: 22,
    title: 'The Eastern Harvest Boom — Sorghum Routes Open, Free Rangers Thrive',
    impactLabel: 'Eastern Grain Crops & Free-Range Flocks',
    description:
      'An exceptional growing season in the eastern fields yields the largest Chinese Sorghum crop in a generation. ' +
      'A newly cleared mountain pass finally connects the eastern grain stores to the valley\'s main trading routes, ' +
      'and Chinese Sorghum — previously cut off from the wider market — floods in at competitive prices. ' +
      'The American Free-Range Flock benefits doubly: their sprawling, loosely-managed grazing land ' +
      'sits directly along the new trade path, turning modest plots into valuable commercial thoroughfares overnight. ' +
      'The independent farms that nobody bet on are suddenly the ones that every merchant needs to cross.',
    icon: '🌾',
    color: '#4D7C0F',
    eventNumber: 4,
    isPositive: true,
    affectedAnimalNames: [
      'Chinese Sorghum',
      'The American Free-Range Flock',
    ],
  },
]

export function getEventById(id: number): GameEventTemplate {
  return GAME_EVENTS.find(e => e.id === id) ?? GAME_EVENTS[0]
}
