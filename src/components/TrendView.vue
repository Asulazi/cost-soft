<script setup>
import { computed, ref } from 'vue'
import { TrendingUp } from 'lucide-vue-next'
import { beijingDateKey, addDaysISO } from '../db.js'
import TrendChart from './TrendChart.vue'

const props = defineProps({
  assets: { type: Array, required: true }
})

const ranges = [
  { key: 0, label: '全部' },
  { key: 30, label: '近 30 天' },
  { key: 90, label: '近 90 天' },
  { key: 180, label: '近 180 天' },
  { key: 365, label: '近 1 年' }
]
const range = ref(0)

const today = computed(() => beijingDateKey())

const rangeDescriptions = {
  0: '当前全部资产的实际状态分布',
  30: '当前仍在有效期，或近 30 天内购入 / 售出的资产',
  90: '当前仍在有效期，或近 90 天内购入 / 售出的资产',
  180: '当前仍在有效期，或近 180 天内购入 / 售出的资产',
  365: '当前仍在有效期，或近 1 年内购入 / 售出的资产'
}

const totals = computed(() => {
  const scoped = props.assets.filter((a) => {
    if (range.value === 0) return true
    const cutoff = addDaysISO(today.value, -range.value + 1)
    if (a.purchaseDate >= cutoff) return true
    if (a.status === '已售出' && a.soldDate && a.soldDate >= cutoff) return true
    return false
  })
  const active = scoped.filter((a) => a.status === '使用中')
  return {
    value: active.reduce((s, a) => s + Number(a.price), 0),
    count: scoped.length
  }
})

const statusSplit = computed(() => {
  const scoped = props.assets.filter((a) => {
    if (range.value === 0) return true
    const cutoff = addDaysISO(today.value, -range.value + 1)
    if (a.purchaseDate >= cutoff) return true
    if (a.status === '已售出' && a.soldDate && a.soldDate >= cutoff) return true
    return false
  })
  const total = scoped.reduce((s, a) => s + Number(a.price), 0) || 1
  const groups = ['使用中', '未使用', '已售出'].map((s) => {
    const list = scoped.filter((a) => a.status === s)
    return {
      name: s,
      amount: list.reduce((sum, a) => sum + Number(a.price), 0),
      pct: (list.reduce((sum, a) => sum + Number(a.price), 0) / total) * 100
    }
  })
  return groups
})
</script>

<template>
  <div class="view">
    <div class="topbar">
      <h1>趋势</h1>
    </div>
    <div class="trend-filters">
      <button v-for="r in ranges" :key="r.key" class="chip" :class="{ active: range === r.key }" @click="range = r.key">
        {{ r.label }}
      </button>
    </div>

    <div class="card trend-card">
      <div class="trend-head">
        <span class="trend-title">资产总值</span>
        <TrendingUp :size="18" style="color: var(--ink-faint)" />
      </div>
      <div class="trend-sub">
        <div>
          <div class="stat-label">总价值</div>
          <div class="stat-value">¥{{ totals.value.toFixed(2) }}</div>
        </div>
        <div>
          <div class="stat-label">数量</div>
          <div class="stat-value">{{ totals.count }}</div>
        </div>
      </div>
      <TrendChart :assets="assets" :range="range" />
    </div>

    <div class="card trend-card">
      <div class="trend-head">
        <span class="trend-title">资产状态</span>
      </div>
      <div class="trend-note">{{ rangeDescriptions[range] }}</div>
      <div class="trend-legend">
        <div v-for="g in statusSplit" :key="g.name" class="legend-row">
          <span class="status-dot" :class="g.name"></span>
          <span>{{ g.name }}</span>
          <span class="pct">{{ g.pct.toFixed(2) }}%</span>
          <span class="amt">¥{{ g.amount.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
