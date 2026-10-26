<script setup>
import { computed, ref } from 'vue'
import { TrendingUp } from 'lucide-vue-next'
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

const totals = computed(() => {
  const active = props.assets.filter((a) => a.status === '服役中')
  return {
    value: active.reduce((s, a) => s + Number(a.price), 0),
    count: props.assets.length
  }
})

const statusSplit = computed(() => {
  const total = props.assets.reduce((s, a) => s + Number(a.price), 0) || 1
  const groups = ['服役中', '已退役', '已卖出'].map((s) => {
    const list = props.assets.filter((a) => a.status === s)
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
