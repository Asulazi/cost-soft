<script setup>
import { computed } from 'vue'

const props = defineProps({
  assets: { type: Array, required: true },
  range: { type: Number, default: 0 }
})

const points = computed(() => {
  const events = []
  for (const a of props.assets) {
    events.push({ date: a.purchaseDate, delta: Number(a.price) })
    if (a.status === '已卖出' && a.soldDate) events.push({ date: a.soldDate, delta: 0 })
  }
  const dates = [...new Set(events.map((e) => e.date))].sort()
  if (!dates.length) return []

  const today = new Date().toISOString().slice(0, 10)
  if (dates[dates.length - 1] < today) dates.push(today)

  let running = 0
  const eventMap = {}
  for (const e of events) eventMap[e.date] = (eventMap[e.date] || 0) + e.delta

  let series = dates.map((d) => {
    running += eventMap[d] || 0
    return { date: d, value: running }
  })

  if (series.length === 1) {
    series = [series[0], { ...series[0] }]
  }

  if (props.range > 0) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - props.range)
    const cut = cutoff.toISOString().slice(0, 10)
    series = series.filter((p) => p.date >= cut)
  }
  return series
})

const path = computed(() => {
  if (points.value.length < 2) return ''
  const w = 320
  const h = 120
  const maxV = Math.max(...points.value.map((p) => p.value), 1) * 1.08
  const minV = 0
  const step = w / (points.value.length - 1)
  return points.value
    .map((p, i) => {
      const x = (i * step).toFixed(1)
      const y = (h - ((p.value - minV) / (maxV - minV)) * h).toFixed(1)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
})

const areaPath = computed(() => {
  if (!path.value) return ''
  const h = 120
  const w = 320
  return `${path.value} L${w},${h} L0,${h} Z`
})
</script>

<template>
  <div class="chart-wrap">
    <svg viewBox="0 0 320 130" preserveAspectRatio="none" style="width: 100%; height: 130px">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#a4e000" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#a4e000" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      <path v-if="areaPath" :d="areaPath" fill="url(#trendFill)" />
      <path v-if="path" :d="path" fill="none" stroke="#a4e000" stroke-width="2.5" stroke-linecap="round" />
    </svg>
  </div>
</template>
