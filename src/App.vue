<script setup>
import { ref, computed, onMounted } from 'vue'
import { Heart, TrendingUp, Settings, Plus, ArrowUpDown, LayoutGrid, Grid2X2, Grid3X3 } from 'lucide-vue-next'
import { db, ensureSeed, getCategories, getSortConfig, saveSortConfig, getViewConfig, saveViewConfig, daysUsed, dailyCost } from './db.js'
import AssetCard from './components/AssetCard.vue'
import AssetListRow from './components/AssetListRow.vue'
import AssetForm from './components/AssetForm.vue'
import AssetDetail from './components/AssetDetail.vue'
import SortSheet from './components/SortSheet.vue'
import TrendView from './components/TrendView.vue'
import SettingsView from './components/SettingsView.vue'

const ready = ref(false)
const assets = ref([])
const categories = ref([])
const sortConfig = ref({ mode: 'custom', direction: 1 })
const viewConfig = ref({ mode: 'grid', cols: 2 })
const tab = ref('home')
const showForm = ref(false)
const detailAsset = ref(null)
const editing = ref(null)
const showSort = ref(false)
const filter = ref('全部')
const toast = ref('')

let toastTimer = null
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2000)
}

async function loadAll() {
  await ensureSeed()
  assets.value = await db.assets.toArray()
  categories.value = await getCategories()
  sortConfig.value = await getSortConfig()
  viewConfig.value = await getViewConfig()
  ready.value = true
}

onMounted(loadAll)

const filters = computed(() => ['全部', '使用中', '未使用', '已售出'])

const filtered = computed(() => {
  if (filter.value === '全部') return assets.value
  return assets.value.filter((a) => a.status === filter.value)
})

const sorted = computed(() => {
  const list = [...filtered.value]
  const cfg = sortConfig.value
  const pin = list.filter((a) => a.pinned)
  const rest = list.filter((a) => !a.pinned)
  if (cfg.mode === 'custom') {
    const order = cfg.order || []
    rest.sort((a, b) => {
      const ia = order.indexOf(a.id)
      const ib = order.indexOf(b.id)
      if (ia === -1 && ib === -1) return (b.id || 0) - (a.id || 0)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
  } else if (cfg.mode === 'dailyDesc') list.sort((a, b) => dailyCost(b) - dailyCost(a))
  else if (cfg.mode === 'dailyAsc') list.sort((a, b) => dailyCost(a) - dailyCost(b))
  else if (cfg.mode === 'priceDesc') list.sort((a, b) => b.price - a.price)
  else if (cfg.mode === 'priceAsc') list.sort((a, b) => a.price - b.price)
  else if (cfg.mode === 'daysDesc') list.sort((a, b) => daysUsed(b.purchaseDate, b.status, b.soldDate) - daysUsed(a.purchaseDate, a.status, a.soldDate))
  else if (cfg.mode === 'daysAsc') list.sort((a, b) => daysUsed(a.purchaseDate, a.status, a.soldDate) - daysUsed(b.purchaseDate, b.status, b.soldDate))
  else if (cfg.mode === 'dateDesc') list.sort((a, b) => (b.purchaseDate > a.purchaseDate ? 1 : -1))
  else if (cfg.mode === 'dateAsc') list.sort((a, b) => (a.purchaseDate > b.purchaseDate ? 1 : -1))
  if (pin.length) {
    rest.sort((a, b) => {
      const ia = list.indexOf(a)
      const ib = list.indexOf(b)
      return ia - ib
    })
  }
  if (pin.length) return [...pin, ...rest]
  return list
})

const totals = computed(() => {
  const active = assets.value.filter((a) => a.status === '使用中' && !a.excludeFromTotal)
  const totalValue = active.reduce((s, a) => s + Number(a.price), 0)
  const totalDaily = assets.value
    .filter((a) => a.status !== '已售出' && !a.excludeFromDaily)
    .reduce((s, a) => s + dailyCost(a), 0)
  return {
    value: totalValue,
    daily: totalDaily,
    counts: {
      active: active.length,
      retired: assets.value.filter((a) => a.status === '未使用').length,
      sold: assets.value.filter((a) => a.status === '已售出').length
    }
  }
})

function openNew() {
  editing.value = null
  showForm.value = true
}

function openDetail(asset) {
  detailAsset.value = asset
}

function openEdit(asset) {
  detailAsset.value = null
  editing.value = asset
  showForm.value = true
}

async function saveAsset(data) {
  try {
    const clean = JSON.parse(JSON.stringify(data))
    const maxOrder = assets.value.reduce((m, a) => Math.max(m, Number(a.order ?? 0)), 0)
    if (editing.value) {
      await db.assets.put({ ...JSON.parse(JSON.stringify(editing.value)), ...clean, order: editing.value.order ?? maxOrder + 1 })
      showToast('已保存')
    } else {
      const newId = await db.assets.add({ ...clean, order: maxOrder + 1 })
      if (sortConfig.value.mode === 'custom') {
        const cfg = {
          ...sortConfig.value,
          order: [newId, ...(Array.isArray(sortConfig.value.order) ? sortConfig.value.order : [])]
        }
        await saveSortConfig(JSON.parse(JSON.stringify(cfg)))
        sortConfig.value = cfg
      }
      showToast('已添加')
    }
    showForm.value = false
    editing.value = null
    detailAsset.value = null
    await loadAll()
  } catch (e) {
    console.error('保存失败:', e?.message || e)
    showToast('保存失败: ' + (e?.message || e))
  }
}

async function deleteAsset() {
  if (!editing.value || !confirm('确定删除该资产吗？')) return
  await db.assets.delete(editing.value.id)
  showToast('已删除')
  showForm.value = false
  editing.value = null
  detailAsset.value = null
  await loadAll()
}

async function applySort(cfg) {
  try {
    await saveSortConfig(JSON.parse(JSON.stringify(cfg)))
    sortConfig.value = cfg
    showSort.value = false
    showToast('排序已更新')
  } catch (e) {
    console.error('保存排序失败:', e?.message || e)
  }
}

async function setView(cfg) {
  try {
    viewConfig.value = cfg
    await saveViewConfig(JSON.parse(JSON.stringify(cfg)))
  } catch (e) {
    console.error('保存视图失败:', e?.message || e)
  }
}

const viewIcons = { 2: Grid2X2, 3: Grid3X3 }

const viewIcon = computed(() => (viewConfig.value.mode === 'list' ? LayoutGrid : viewIcons[viewConfig.value.cols] || Grid2X2))

function cycleView() {
  const seq = [
    { mode: 'grid', cols: 2 },
    { mode: 'grid', cols: 3 },
    { mode: 'list', cols: 2 }
  ]
  const i = seq.findIndex((v) => v.mode === viewConfig.value.mode && v.cols === viewConfig.value.cols)
  setView(seq[(i + 1) % seq.length])
}

const gridStyle = computed(() =>
  viewConfig.value.mode === 'grid' ? { gridTemplateColumns: `repeat(${viewConfig.value.cols}, 1fr)` } : {}
)

const tabs = [
  { key: 'home', label: 'asulazi', icon: Heart },
  { key: 'trend', label: '趋势', icon: TrendingUp },
  { key: 'settings', label: '设置', icon: Settings }
]
</script>

<template>
  <div v-if="ready">
    <template v-if="detailAsset">
      <AssetDetail
        :asset="detailAsset"
        @close="detailAsset = null"
        @edit="openEdit(detailAsset)"
      />
    </template>
    <template v-else-if="showForm">
      <AssetForm
        :asset="editing"
        :categories="categories"
        @close="showForm = false; editing = null"
        @save="saveAsset"
        @delete="deleteAsset"
        @toast="showToast"
      />
    </template>
    <template v-else-if="tab === 'home'">
      <div class="view">
        <div class="topbar">
          <h1>asulazi</h1>
          <div class="topbar-actions">
            <button class="icon-btn" @click="showSort = true"><ArrowUpDown :size="20" /></button>
            <button class="icon-btn" @click="cycleView"><component :is="viewIcon" :size="20" /></button>
          </div>
        </div>

        <div class="card stat-card">
          <div class="stat-head">
            <h2>资产总览</h2>
            <span class="badge">{{ assets.length }}/{{ assets.length }}</span>
          </div>
          <div class="stat-grid">
            <div>
              <div class="stat-label">总资产</div>
              <div class="stat-value">¥{{ totals.value.toFixed(2) }}</div>
            </div>
            <div>
              <div class="stat-label">日均成本</div>
              <div class="stat-value">¥{{ totals.daily.toFixed(2) }}</div>
            </div>
          </div>
          <div class="status-row">
            <div class="status-cell"><strong>{{ totals.counts.active }}</strong>使用中</div>
            <div class="status-cell"><strong>{{ totals.counts.retired }}</strong>未使用</div>
            <div class="status-cell"><strong>{{ totals.counts.sold }}</strong>已售出</div>
          </div>
          <div class="status-bars">
            <span class="bar" :class="{ dim: !totals.counts.active }"></span>
            <span class="bar" :class="{ dim: !totals.counts.retired }"></span>
            <span class="bar" :class="{ dim: !totals.counts.sold }"></span>
          </div>
        </div>

        <div class="filter-row">
          <button v-for="f in filters" :key="f" class="chip" :class="{ active: filter === f }" @click="filter = f">{{ f }}</button>
          <span class="filter-spacer"></span>
          <span class="view-badge" @click="cycleView"><component :is="viewIcon" :size="16" /></span>
        </div>

        <div v-if="viewConfig.mode === 'grid'" class="asset-grid" :style="gridStyle">
          <AssetCard v-for="a in sorted" :key="a.id" :asset="a" @open="openDetail" />
          <div v-if="!sorted.length" class="empty-hint">这里还空空的，点右下角 + 记录第一件宝贝吧</div>
        </div>
        <div v-else class="list-wrap">
          <AssetListRow v-for="a in sorted" :key="a.id" :asset="a" @open="openDetail" />
          <div v-if="!sorted.length" class="empty-hint">这里还空空的，点右下角 + 记录第一件宝贝吧</div>
        </div>
      </div>
    </template>
    <template v-else-if="tab === 'trend'">
      <TrendView :assets="assets" />
    </template>
    <template v-else>
      <SettingsView :categories="categories" @toast="showToast" @reload="loadAll" />
    </template>

    <div v-if="!showForm && !detailAsset" class="tabbar with-fab">
      <button v-for="t in tabs" :key="t.key" class="tab-item" :class="{ active: tab === t.key && !showForm && !detailAsset }" @click="tab = t.key; showForm = false; detailAsset = null">
        <component :is="t.icon" :size="21" :stroke-width="1.8" />
        {{ t.label }}
      </button>
      <button class="fab" @click="openNew"><Plus :size="24" /></button>
    </div>

    <SortSheet v-if="showSort" :assets="sorted" :config="sortConfig" @close="showSort = false" @save="applySort" />
    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>
