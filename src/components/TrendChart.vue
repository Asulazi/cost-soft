<script setup>
import { computed } from 'vue'

const props = defineProps({
  assets: { type: Array, required: true },
  range: { type: Number, default: 0 }
})

function iso(d) {
  return d.toISOString().slice(0, 10)
}

const points = computed(() => {
  const list = props.assets
  if (!list.length) return []

  const dateSet = new Set()
  for (const a of list) {
    if (a.purchaseDate) dateSet.add(String(a.purchaseDate).slice(0, 10))
    if (a.status === '已售出' && a.soldDate) dateSet.add(String(a.soldDate).slice(0, 10))
  }
  const today = iso(new Date())
  dateSet.add(today)
  const dates = [...dateSet].sort()

  const valueAt = (d) =>
    list.reduce((sum, a) => {
      if (!a.purchaseDate || a.purchaseDate > d) return sum
      if (a.status === '已售出' && a.soldDate && a.soldDate <= d) return sum
      return sum + Number(a.price)
    }, 0)

  let series = dates.map((d) => ({ date: d, value: valueAt(d) }))

  if (props.range > 0) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - props.range)
    const cut = iso(cutoff)
    const before = series.filter((p) => p.date < cut)
    const base = before.length ? before[before.length - 1].value : 0
    series = series.filter((p) => p.date >= cut)
    if (series.length && (!before.length || series[0].date > cut)) {
      series.unshift({ date: cut > series[0].date ? cut : series[0].date, value: base })
    }
  }
  if (series.length === 1) {
    const first = series[0]
    if (first.date === today && first.value > 0) {
      series = [{ date: '1999-01-01', value: 0 }, first]
    } else {
      series = [first, { ...first }]
    }
  }
  return series
})

const W = 320
const H = 120

const geometry = computed(() => {
  const pts = points.value
  if (pts.length < 2) return null
  const maxV = Math.max(...pts.map((p) => p.value), 1) * 1.12
  const step = W / (pts.length - 1)
  const xy = pts.map((p, i) => ({
    x: Number((i * step).toFixed(1)),
    y: Number((H - (p.value / maxV) * H).toFixed(1)),
    ...p
  }))
  const line = xy.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  return { xy, line, area, maxV }
})

const labels = computed(() => {
  const pts = points.value
  if (pts.length < 2) return []
  const pick = [0, Math.floor((pts.length - 1) / 2), pts.length - 1]
  return [...new Set(pick)].map((i) => pts[i].date.slice(5).replace('-', '.'))
})
</script>

<template>
  <div class="chart-wrap">
    <svg viewBox="0 0 320 130" preserveAspectRatio="none" style="width: 100%; height: 130px; display: block">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#a4e000" stop-opacity="0.32" />
          <stop offset="100%" stop-color="#a4e000" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      <template v-if="geometry">
        <path :d="geometry.area" fill="url(#trendFill)" />
        <path :d="geometry.line" fill="none" stroke="#a4e000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <circle :cx="geometry.xy[geometry.xy.length - 1].x" :cy="geometry.xy[geometry.xy.length - 1].y" r="4" fill="#a4e000" stroke="#fff" stroke-width="2" />
      </template>
    </svg>
    <div v-if="labels.length" class="chart-axis">
      <span v-for="l in labels" :key="l">{{ l }}</span>
    </div>
  </div>
</template>
