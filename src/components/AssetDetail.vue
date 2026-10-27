<script setup>
import { X, SquarePen, TrendingDown } from 'lucide-vue-next'
import { daysUsed, dailyCost, totalCost, targetInfo } from '../db.js'

const props = defineProps({
  asset: { type: Object, required: true }
})
defineEmits(['close', 'edit'])

const target = targetInfo(props.asset)

function fmt(n) {
  return Number(n).toFixed(2)
}

function formatDate(value) {
  const d = new Date(value)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<template>
  <div class="view form-view">
    <div class="form-header">
      <button class="icon-btn" @click="$emit('close')"><X :size="22" /></button>
      <button class="save-btn" @click="$emit('edit')"><SquarePen :size="19" /></button>
    </div>

    <div class="detail-hero">
      <div class="detail-photo">
        <img v-if="asset.photo" :src="asset.photo" alt="" />
      </div>
      <h1>{{ asset.name }}</h1>
      <div class="detail-daily">¥{{ fmt(dailyCost(asset)) }}/天</div>
      <div class="detail-sub">总价：¥{{ fmt(totalCost(asset)) }} · 已使用 {{ daysUsed(asset.purchaseDate, asset.status, asset.soldDate) }}天</div>
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

    <div class="card detail-card">
      <div class="detail-card-title">基础信息</div>
      <div class="detail-row"><span>价格</span><strong>¥{{ fmt(asset.price) }}</strong></div>
      <div class="detail-row"><span>类别</span><strong>{{ asset.category || '未分类' }}</strong></div>
      <div class="detail-row"><span>购买日期</span><strong>{{ formatDate(asset.purchaseDate) }}</strong></div>
      <div v-if="asset.soldDate" class="detail-row"><span>售出日期</span><strong>{{ formatDate(asset.soldDate) }}</strong></div>
      <div v-if="asset.note" class="detail-note">{{ asset.note }}</div>
    </div>
  </div>
</template>
