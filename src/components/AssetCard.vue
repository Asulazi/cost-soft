<script setup>
import { Package } from 'lucide-vue-next'
import { daysUsed, dailyCost } from '../db.js'

const props = defineProps({
  asset: { type: Object, required: true }
})
defineEmits(['open'])

function fmt(n) {
  return Number(n).toFixed(2)
}
</script>

<template>
  <div class="asset-card" @click="$emit('open', asset)">
    <div class="asset-photo">
      <img v-if="asset.photo" :src="asset.photo" alt="" />
      <Package v-else :size="30" :stroke-width="1.5" />
    </div>
    <div class="asset-body">
      <div class="asset-title-row">
        <span class="asset-title">{{ asset.name }}</span>
        <span class="status-tag">
          <span class="status-dot" :class="asset.status"></span>{{ asset.status }}
        </span>
      </div>
      <div class="asset-meta">
        ¥{{ fmt(asset.price) }} · {{ daysUsed(asset.purchaseDate, asset.status, asset.soldDate) }}天
      </div>
      <div class="asset-cost">¥{{ fmt(dailyCost(asset)) }}/天</div>
    </div>
  </div>
</template>
