const fs = require('fs');
const p = 'c:/dev/LeoG_Front/src/routes/index.tsx';
let s = fs.readFileSync(p, 'utf8');
const reps = [
  [
    '// Pixel art fallback map ? used in AnimatedFarm canvas for categories',
    '// Pixel art fallback map — used in AnimatedFarm canvas for categories',
  ],
  [
    "  // Round-active animation step: 'time-skip' ? 'event-1' ? 'event-2'",
    "  // Round-active animation step: 'time-skip' → 'event-1' → 'event-2'",
  ],
  [
    '  /** Convert the selection (id ? count) to PortfolioItem[] for the engine */',
    '  /** Convert the selection (id → count) to PortfolioItem[] for the engine */',
  ],
  [
    '  // Sequence the round-active animation steps: time-skip ? event-1',
    '  // Sequence the round-active animation steps: time-skip → event-1',
  ],
  [
    '          {/* Event reveal ? step 1 or step 2 */}',
    '          {/* Event reveal — step 1 or step 2 */}',
  ],
  [
    '              {/* Event chips ? one per event */}',
    '              {/* Event chips — one per event */}',
  ],
  [
    '            {/* LEFT: livestock selection ? collapses during locking */}',
    '            {/* LEFT: livestock selection — collapses during locking */}',
  ],
  [
    '              {/* Sticky header + tabs ? hidden when locking */}',
    '              {/* Sticky header + tabs — hidden when locking */}',
  ],
  [
    '              {/* Scrollable card list ? hidden when locking */}',
    '              {/* Scrollable card list — hidden when locking */}',
  ],
  ['                                      ?{Math.abs(unitDelta)} lost', '                                      −{Math.abs(unitDelta)} lost'],
  [
    "<span style={{ color: '#B89070' }} aria-hidden>?</span>",
    "<span style={{ color: '#B89070' }} aria-hidden>→</span>",
  ],
  [
    "{totalUnitDelta > 0 ? '+' : '?'}{Math.abs(totalUnitDelta)}",
    "{totalUnitDelta > 0 ? '+' : '−'}{Math.abs(totalUnitDelta)}",
  ],
  ["{ev.isPositive ? '+' : '?'}", "{ev.isPositive ? '+' : '−'}"],
  [
    "<span style={{ color: '#8B6B50', margin: '0 8px' }} aria-hidden>?</span>",
    "<span style={{ color: '#8B6B50', margin: '0 8px' }} aria-hidden>·</span>",
  ],
  [
    '`End Round ? Start Round ${currentRound + 1}`',
    '`End Round → Start Round ${currentRound + 1}`',
  ],
  [
    '      {/* Profile panel ? available on any phase once user is identified */}',
    '      {/* Profile panel — available on any phase once user is identified */}',
  ],
];
for (const [a, b] of reps) {
  if (!s.includes(a)) console.error('MISSING:', a.slice(0, 70));
  s = s.split(a).join(b);
}
fs.writeFileSync(p, s);
console.log('ok');
