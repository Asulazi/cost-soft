<script setup>
import { Package } from 'lucide-vue-next'
import { daysUsed, dailyCost } from '../db.js'

defineProps({
  asset: { type: Object, required: true }
})
defineEmits(['open'])

function fmt(n) {
  return Number(n).toFixed(2)
}
</script>

<template>
  <div class="list-row" @click="$emit('open', asset)">
    <div class="row-photo">
      <img v-if="asset.photo" :src="asset.photo" alt="" />
      <Package v-else :size="20" :stroke-width="1.5" />
    </div>
    <div class="row-main">
      <div class="row-title-row">
        <span class="row-title">{{ asset.name }}</span>
        <span class="status-tag" style="font-size: 10px">
          <span class="status-dot" :class="asset.status"></span>{{ asset.status }}
        </span>
      </div>
      <div class="row-meta">
        ¥{{ fmt(asset.price) }} · {{ daysUsed(asset.purchaseDate, asset.status, asset.soldDate) }}天
      </div>
    </div>
    <div class="row-cost">¥{{ fmt(dailyCost(asset)) }}/天</div>
  </div>
</template>
