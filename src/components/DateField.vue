<script setup>
import { ref, computed, watch } from 'vue'
import { ChevronRight, X, CalendarDays } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
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

function commit() {
  emit('update:modelValue', `${y.value}-${pad(m.value)}-${pad(d.value)}`)
}

function setToday() {
  const t = new Date()
  y.value = t.getFullYear()
  m.value = t.getMonth() + 1
  d.value = t.getDate()
  commit()
  open.value = false
}

function done() {
  commit()
  open.value = false
}

const display = computed(() =>
  props.modelValue ? `${y.value}年${m.value}月${d.value}日` : ''
)
</script>

<template>
  <div class="date-field">
    <button type="button" class="field-value date-trigger" @click="open = true">
      <span :class="{ ph: !modelValue }">{{ display || placeholder }}</span>
      <ChevronRight :size="16" />
    </button>

    <div v-if="open" class="sheet-mask" @click.self="open = false">
      <div class="sheet">
        <div class="sheet-head">
          <CalendarDays :size="18" />
          <span>选择日期</span>
          <button class="icon-btn" @click="open = false"><X :size="18" /></button>
        </div>
        <div class="date-selects">
          <select v-model.number="y"><option v-for="i in years" :key="i" :value="i">{{ i }}年</option></select>
          <select v-model.number="m"><option v-for="i in months" :key="i" :value="i">{{ i }}月</option></select>
          <select v-model.number="d"><option v-for="i in dayList" :key="i" :value="i">{{ i }}日</option></select>
        </div>
        <div class="sheet-actions">
          <button class="sheet-btn ghost" @click="setToday">今天</button>
          <button class="sheet-btn main" @click="done">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>
