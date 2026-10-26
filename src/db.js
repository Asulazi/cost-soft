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

export function daysUsed(purchaseDate, status, soldDate = null) {
  const end = status === STATUS.SOLD && soldDate ? new Date(soldDate) : new Date()
  const start = new Date(purchaseDate)
  const diff = Math.floor((end - start) / 86400000)
  return Math.max(1, diff)
}

export function dailyCost(asset) {
  const days = daysUsed(asset.purchaseDate, asset.status, asset.soldDate)
  return Number(asset.price) / days
}
