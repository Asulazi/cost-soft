<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { X, Check, CalendarDays } from 'lucide-vue-next'
import WheelColumn from './WheelColumn.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  title: { type: String, default: '选择日期' },
  placeholder: { type: String, default: '请选择日期' }
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const y = ref(new Date().getFullYear())
const m = ref(new Date().getMonth() + 1)
const d = ref(new Date().getDate())

function pad(n) {
  return String(n).padStart(2, '0')
}

watch(open, (v) => {
  if (!v) return
  const src = props.modelValue ? new Date(props.modelValue + 'T00:00:00') : new Date()
  y.value = src.getFullYear()
  m.value = src.getMonth() + 1
  d.value = src.getDate()
})

const years = computed(() => {
  const now = new Date().getFullYear()
  return Array.from({ length: now - 1999 }, (_, i) => now - i)
})
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const days = computed(() => new Date(y.value, m.value, 0).getDate())
const dayList = computed(() => Array.from({ length: days.value }, (_, i) => i + 1))

watch([y, m], () => {
  if (d.value > days.value) d.value = days.value
})

function confirm() {
  emit('update:modelValue', `${y.value}-${pad(m.value)}-${pad(d.value)}`)
  open.value = false
}

const display = computed(() => (props.modelValue ? `${props.modelValue.slice(0, 4)}年${Number(props.modelValue.slice(5, 7))}月${Number(props.modelValue.slice(8, 10))}日` : ''))
</script>

<template>
  <div class="date-field">
    <button type="button" class="field-value date-trigger" @click="open = true">
      <span :class="{ ph: !modelValue }">{{ display || placeholder }}</span>
    </button>

    <div v-if="open" class="sheet-mask" @click.self="open = false">
      <div class="sheet date-sheet">
        <div class="wheel-head">
          <button class="round-btn" @click="open = false"><X :size="18" /></button>
          <span class="wheel-title"><CalendarDays :size="16" style="margin-right: 6px" />{{ title }}</span>
          <button class="round-btn main" @click="confirm"><Check :size="18" /></button>
        </div>
        <div class="wheel-wrap">
          <div class="wheel-band"></div>
          <WheelColumn v-model="y" :values="years" suffix="年" class="wheel-col-wide" />
          <WheelColumn v-model="m" :values="months" suffix="月" />
          <WheelColumn v-model="d" :values="dayList" suffix="日" />
        </div>
      </div>
    </div>
  </div>
</template>
