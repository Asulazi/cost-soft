import Dexie from 'dexie'

export const db = new Dexie('youshu-local')

db.version(1).stores({
  assets: '++id, name, price, purchaseDate, status, category, order',
  settings: 'key',
  backups: '++id, createdAt'
})

export const STATUS = {
  ACTIVE: '服役中',
  RETIRED: '已退役',
  SOLD: '已卖出'
}

export const DEFAULT_CATEGORIES = [
  { id: 1, name: '厨房', order: 0 },
  { id: 2, name: '电子', order: 1 },
  { id: 3, name: '摄影', order: 2 },
  { id: 4, name: '家居', order: 3 },
  { id: 5, name: '其他', order: 4 }
]

export async function ensureSeed() {
  const categories = await db.settings.get('categories')
  if (!categories) {
    await db.settings.put({ key: 'categories', value: DEFAULT_CATEGORIES })
  }
  const sort = await db.settings.get('assetSort')
  if (!sort) {
    await db.settings.put({
      key: 'assetSort',
      value: { mode: 'custom', direction: 1, updatedAt: Date.now() }
    })
  }
  const view = await db.settings.get('homeView')
  if (!view) {
    await db.settings.put({ key: 'homeView', value: { mode: 'grid', cols: 2 } })
  }
}

export async function getCategories() {
  const row = await db.settings.get('categories')
  return row ? row.value : DEFAULT_CATEGORIES
}

export async function saveCategories(list) {
  await db.settings.put({
    key: 'categories',
    value: list.map((item, index) => ({ ...item, order: index }))
  })
}

export async function getSortConfig() {
  const row = await db.settings.get('assetSort')
  return row ? row.value : { mode: 'custom', direction: 1, updatedAt: Date.now() }
}

export async function saveSortConfig(config) {
  await db.settings.put({ key: 'assetSort', value: { ...config, updatedAt: Date.now() } })
}

export async function getViewConfig() {
  const row = await db.settings.get('homeView')
  const cfg = row ? row.value : { mode: 'grid', cols: 2 }
  if (cfg.mode === 'grid' && cfg.cols === 5) return { mode: 'grid', cols: 2 }
  return cfg
}

export async function saveViewConfig(config) {
  await db.settings.put({ key: 'homeView', value: { ...config, updatedAt: Date.now() } })
}

export function daysUsed(purchaseDate, status, soldDate = null) {
  const end = status === STATUS.SOLD && soldDate ? new Date(soldDate) : new Date()
  const start = new Date(purchaseDate)
  const diff = Math.floor((end - start) / 86400000)
  return Math.max(1, diff)
}

export function extraCost(asset) {
  return Array.isArray(asset.extras)
    ? asset.extras.reduce((s, e) => s + Number(e.amount || 0), 0)
    : 0
}

export function totalCost(asset) {
  return Number(asset.price) + extraCost(asset)
}

export function dailyCost(asset) {
  const days = daysUsed(asset.purchaseDate, asset.status, asset.soldDate)
  return totalCost(asset) / days
}

export function incomeRate(asset) {
  if (!Array.isArray(asset.incomes) || !asset.incomes.length) return 0
  const total = asset.incomes.reduce((s, i) => s + Number(i.amount || 0), 0)
  return total / daysUsed(asset.purchaseDate, asset.status, asset.soldDate)
}

export function netDailyCost(asset) {
  return dailyCost(asset) - incomeRate(asset)
}

export function latestMarketPrice(asset) {
  if (!Array.isArray(asset.marketPrices) || !asset.marketPrices.length) return null
  return [...asset.marketPrices].sort((a, b) => (a.date > b.date ? -1 : 1))[0]
}
