<script setup>
import { computed } from 'vue'
import { X, SquarePen, Trash2 } from 'lucide-vue-next'
import CuteBox from './CuteBox.vue'
import { daysUsed, dailyCost, totalCost, targetInfo } from '../db.js'

const props = defineProps({
  asset: { type: Object, required: true }
})
defineEmits(['close', 'edit', 'delete'])

const target = computed(() => targetInfo(props.asset))

const days = computed(() => daysUsed(props.asset.purchaseDate, props.asset.status, props.asset.soldDate))

const costPoints = computed(() => {
  const total = Math.max(0.01, totalCost(props.asset))
  const totalDays = days.value
  const step = Math.max(1, Math.floor(totalDays / 90))
  const start = new Date(props.asset.purchaseDate)
  const points = []
  for (let day = 1; day <= totalDays; day += step) {
    const date = new Date(start)
    date.setDate(date.getDate() + day - 1)
    points.push({
      date: date.toISOString().slice(0, 10),
      value: total / day
    })
  }
  const lastDate = new Date(start)
  lastDate.setDate(lastDate.getDate() + totalDays - 1)
  points.push({ date: lastDate.toISOString().slice(0, 10), value: total / totalDays })
  return points
})

const costChart = computed(() => {
  const pts = costPoints.value
  if (pts.length < 2) return null
  const W = 320
  const H = 132
  const values = pts.map((p) => p.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  let low = Math.log10(Math.max(0.01, minV))
  let high = Math.log10(Math.max(0.02, maxV))
  if (high - low < 0.18) {
    const mid = (high + low) / 2
    low = mid - 0.09
    high = mid + 0.09
  }
  const stepX = W / (pts.length - 1)
  const xy = pts.map((p, i) => {
    const rate = (Math.log10(Math.max(0.01, p.value)) - low) / (high - low)
    return { ...p, x: Number((i * stepX).toFixed(1)), y: Number((H - rate * H).toFixed(1)) }
  })
  const line = xy.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  const labels = [...new Set([0, Math.floor((xy.length - 1) / 2), xy.length - 1])]
  return {
    line,
    area,
    xy,
    labels: labels.map((i) => xy[i].date.slice(5).replace('-', '.')),
    top: maxV >= 100 ? Math.round(maxV) : maxV.toFixed(2),
    bottom: minV >= 100 ? Math.round(minV) : minV.toFixed(2)
  }
})

function fmt(n) {
  return Number(n).toFixed(2)
}

function formatDate(value) {
  const d = new Date(value)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function formatDotDate(value) {
  return String(value).slice(0, 10).replaceAll('-', '.')
}
</script>

<template>
  <div class="view form-view">
    <div class="form-header">
      <button class="icon-btn" @click="$emit('close')"><X :size="22" /></button>
      <button class="save-btn" @click="$emit('edit')"><SquarePen :size="19" /></button>
    </div>

    <div class="card detail-summary">
      <div class="detail-summary-photo">
        <img v-if="asset.photo" :src="asset.photo" alt="" />
        <CuteBox v-else class="detail-placeholder" />
      </div>
      <div class="detail-summary-main">
        <span class="detail-summary-label">资产名称</span>
        <h1>{{ asset.name }}</h1>
      </div>
    </div>

    <div class="card detail-card">
      <div class="detail-cost-head">
        <div>
          <span class="mini-label">当前日均成本</span>
          <strong class="detail-cost-value">¥{{ fmt(dailyCost(asset)) }}</strong>
        </div>
        <div class="detail-days">
          <span class="mini-label">使用天数</span>
          <strong>{{ days }}天</strong>
        </div>
      </div>
      <div v-if="costChart" class="detail-chart">
        <div class="detail-chart-scale">
          <span>{{ costChart.top }}</span>
          <span>{{ costChart.bottom }}</span>
        </div>
        <svg viewBox="0 0 320 132" preserveAspectRatio="none">
          <defs>
            <linearGradient id="assetCostFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#a4e000" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#a4e000" stop-opacity="0.02" />
            </linearGradient>
          </defs>
          <path :d="costChart.area" fill="url(#assetCostFill)" />
          <path :d="costChart.line" fill="none" stroke="#a4e000" stroke-width="2.5" stroke-linecap="round" />
          <circle :cx="costChart.xy[costChart.xy.length - 1].x" :cy="costChart.xy[costChart.xy.length - 1].y" r="3.5" fill="#a4e000" stroke="#fff" stroke-width="2" />
        </svg>
        <div class="detail-chart-axis">
          <span v-for="label in costChart.labels" :key="label">{{ label }}</span>
        </div>
      </div>
    </div>

    <div class="card detail-card">
      <div class="detail-row"><span>资产类型</span><strong>{{ asset.type || '资产' }}</strong></div>
      <div class="detail-row"><span>资产分类</span><strong>{{ asset.category || '未分类' }}</strong></div>
      <div class="detail-row"><span>当前状态</span><strong>{{ asset.status }}</strong></div>
    </div>

    <div class="card detail-card">
      <div class="detail-row"><span>购买价格</span><strong>¥{{ fmt(asset.price) }}</strong></div>
      <div class="detail-row"><span>购买日期</span><strong>{{ formatDotDate(asset.purchaseDate) }}</strong></div>
      <div class="detail-row"><span>购买渠道</span><strong>{{ Array.isArray(asset.tags) && asset.tags.length ? asset.tags.join(' / ') : '未记录' }}</strong></div>
      <div v-if="asset.soldDate" class="detail-row"><span>售出日期</span><strong>{{ formatDotDate(asset.soldDate) }}</strong></div>
    </div>

    <div v-if="target" class="card detail-card">
      <div class="detail-card-title">目标成本</div>
      <div class="detail-stat-grid">
        <div>
          <span class="mini-label">当前成本</span>
          <strong>¥{{ fmt(target.current) }}<small>/天</small></strong>
        </div>
        <div>
          <span class="mini-label">进度</span>
          <strong>{{ target.progress.toFixed(2) }}%</strong>
        </div>
        <div>
          <span class="mini-label">目标成本</span>
          <strong>¥{{ fmt(target.target) }}<small>/天</small></strong>
        </div>
      </div>
      <div class="detail-progress">
        <span class="detail-fill" :style="{ width: target.progress + '%' }"></span>
      </div>
      <div class="detail-progress-meta">
        <span>预计达成：{{ formatDate(target.targetDate) }}</span>
        <span>还剩 {{ target.remainingDays }} 天</span>
      </div>
    </div>

    <div v-if="asset.note" class="card detail-card">
      <div class="detail-card-title">备注</div>
      <div class="detail-note">{{ asset.note }}</div>
    </div>

    <button class="set-row danger detail-delete" @click="$emit('delete')">
      <Trash2 :size="18" /> 删除该资产
    </button>
  </div>
</template>
