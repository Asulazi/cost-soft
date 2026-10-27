<script setup>
import { computed } from 'vue'
import { daysUsed, dailyCost, targetInfo } from '../db.js'
import CuteBox from './CuteBox.vue'

const props = defineProps({
  asset: { type: Object, required: true }
})
defineEmits(['open'])

const target = computed(() => targetInfo(props.asset))

function fmt(n) {
  return Number(n).toFixed(2)
}
</script>

<template>
  <div class="asset-card" @click="$emit('open', asset)">
    <div class="asset-card-head">
      <div class="asset-photo">
        <img v-if="asset.photo" :src="asset.photo" alt="" />
        <CuteBox v-else class="placeholder-box" />
      </div>
      <span class="status-pill" :class="{ sold: asset.status === '已售出', retired: asset.status === '未使用' }">{{ asset.status }}</span>
    </div>
    <div class="asset-body">
      <div class="asset-title-row">
        <span class="asset-title">{{ asset.name }}</span>
      </div>
      <div class="asset-cost">¥{{ fmt(dailyCost(asset)) }}/天</div>
      <div class="asset-meta">
        ¥{{ fmt(asset.price) }}<span class="days-part"> · 已使用{{ daysUsed(asset.purchaseDate, asset.status, asset.soldDate) }}天</span>
      </div>
      <div v-if="target" class="asset-target">
        <div class="target-track"><span class="target-fill" :style="{ width: target.progress + '%' }"></span></div>
        <span class="target-text">还剩 {{ target.remainingDays }} 天</span>
      </div>
    </div>
  </div>
</template>
