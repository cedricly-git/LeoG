import Papa from 'papaparse'

export interface PricePoint {
  date: Date
  close: number
}

export type CsvDataMap = Map<string, PricePoint[]>

async function fetchCsv(url: string): Promise<Record<string, string>[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const text = await res.text()
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })
  return result.data
}

function addRows(
  map: CsvDataMap,
  rows: Record<string, string>[],
  nameKey: string,
  closeKey: string,
  dateKey: string,
) {
  for (const row of rows) {
    const name     = row[nameKey]?.trim()
    const closeStr = row[closeKey]?.trim()
    const dateStr  = row[dateKey]?.trim()
    if (!name || !closeStr || !dateStr) continue
    const close = parseFloat(closeStr)
    if (isNaN(close) || close <= 0) continue
    // Parse as noon UTC to avoid any DST / timezone edge cases
    const date = new Date(dateStr.slice(0, 10) + 'T12:00:00Z')
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push({ date, close })
  }
}

export async function loadAllCsvData(): Promise<CsvDataMap> {
  const map: CsvDataMap = new Map()

  const [stocks, etfs, bonds, goldSilver, crypto] = await Promise.all([
    fetchCsv('/Data/Stocks.csv'),
    fetchCsv('/Data/ETFs.csv'),
    fetchCsv('/Data/Bonds.csv'),
    fetchCsv('/Data/Gold&silver.csv'),
    fetchCsv('/Data/crypto_5y.csv'),
  ])

  // Stocks & ETFs: company → close
  addRows(map, stocks,     'company',       'close', 'date')
  addRows(map, etfs,       'company',       'close', 'date')
  // Bonds: request_label → close
  addRows(map, bonds,      'request_label', 'close', 'date')
  // Gold & Silver: company → close
  addRows(map, goldSilver, 'company',       'close', 'date')
  // Crypto: Name → Open (no Close column in source data)
  addRows(map, crypto,     'Name',          'Open',  'Date')

  // Sort each series chronologically
  for (const [, points] of map) {
    points.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  return map
}

/**
 * Returns the closing price for `assetName` on the last available trading day
 * on-or-before `targetDate`. Returns null if no data exists.
 */
export function getPriceAt(
  data: CsvDataMap,
  assetName: string,
  targetDate: Date,
): number | null {
  const points = data.get(assetName)
  if (!points || points.length === 0) return null

  const targetMs = targetDate.getTime()
  let lo = 0, hi = points.length - 1
  let result: number | null = null

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (points[mid].date.getTime() <= targetMs) {
      result = points[mid].close
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return result
}
