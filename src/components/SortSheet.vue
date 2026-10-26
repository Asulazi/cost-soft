<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { GripVertical, Check, ArrowUpDown, ChevronLeft } from 'lucide-vue-next'

const props = defineProps({
  assets: { type: Array, required: true },
  config: { type: Object, required: true }
})
const emit = defineEmits(['close', 'save'])

const modes = [
  { key: 'custom', label: '自定义拖拽' },
  { key: 'dailyDesc', label: '日均成本从高到低' },
  { key: 'dailyAsc', label: '日均成本从低到高' },
  { key: 'priceDesc', label: '价格从高到低' },
  { key: 'priceAsc', label: '价格从低到高' },
  { key: 'daysDesc', label: '使用天数最长' },
  { key: 'daysAsc', label: '使用天数最短' },
  { key: 'dateDesc', label: '最新购入' },
  { key: 'dateAsc', label: '最早购入' }
]

const mode = ref(props.config.mode)
const editing = ref(false)
const dragIndex = ref(null)
const list = ref(props.assets.map((a) => a.id))

watch(
  () => props.assets,
  (v) => {
    if (mode.value === 'custom') list.value = v.map((a) => a.id)
  },
  { deep: true }
)

function pick(key) {
  mode.value = key
  if (key === 'custom') {
    editing.value = true
  } else {
    save()
  }
}

function back() {
  editing.value = false
}

function save() {
  emit('save', { mode: mode.value, order: mode.value === 'custom' ? list.value : null })
}

function dragStart(i) {
  dragIndex.value = i
}

function dragEnter(i) {
  if (dragIndex.value === null || dragIndex.value === i) return
  const arr = [...list.value]
  const [moved] = arr.splice(dragIndex.value, 1)
  arr.splice(i, 0, moved)
  dragIndex.value = i
  list.value = arr
}

let startY = 0
const touchIndex = ref(null)

function ts(i, e) {
  dragIndex.value = i
  touchIndex.value = i
  startY = e.touches[0].clientY
}

function tm(e) {
  if (touchIndex.value === null) return
  const cur = e.touches[0].clientY
  const rowH = 50
  const diff = Math.round((cur - startY) / rowH)
  if (diff !== 0) {
    const ni = Math.max(0, Math.min(list.value.length - 1, touchIndex.value + diff))
    if (ni !== touchIndex.value) {
      const arr = [...list.value]
      const [moved] = arr.splice(touchIndex.value, 1)
      arr.splice(ni, 0, moved)
      touchIndex.value = ni
      dragIndex.value = ni
      startY = cur
      list.value = arr
    }
  }
}

function te() {
  touchIndex.value = null
  dragIndex.value = null
}

function preventScroll(e) {
  if (touchIndex.value !== null) e.preventDefault()
}

onMounted(() => document.addEventListener('touchmove', preventScroll, { passive: false }))
onBeforeUnmount(() => document.removeEventListener('touchmove', preventScroll))
</script>

<template>
  <div class="sort-sheet-mask" @click.self="$emit('close')">
    <div class="sheet">
      <template v-if="!editing">
        <div class="sheet-title">排序方式</div>
        <button v-for="m in modes" :key="m.key" class="sort-option" :class="{ on: mode === m.key }" @click="pick(m.key)">
          {{ m.label }}
          <Check v-if="mode === m.key" class="check-mark" :size="18" />
        </button>
      </template>

      <template v-else>
        <div class="drag-head">
          <button class="round-btn" @click="back"><ChevronLeft :size="18" /></button>
          <span class="drag-title">拖动调整顺序</span>
          <button class="round-btn main" @click="save"><Check :size="18" /></button>
        </div>
        <div class="cat-list">
          <div
            v-for="(id, i) in list"
            :key="id"
            class="custom-sort-row"
            :class="{ dragging: dragIndex === i }"
            draggable="true"
            @dragstart="dragStart(i)"
            @dragover.prevent
            @dragenter.prevent="dragEnter(i)"
            @drop.prevent="dragIndex = null"
            @touchstart="ts(i, $event)"
            @touchmove="tm"
            @touchend="te"
          >
            <GripVertical class="drag-handle" :size="18" />
            <span>{{ assets.find((a) => a.id === id)?.name || '未知' }}</span>
            <ArrowUpDown :size="16" style="color: var(--ink-faint)" />
          </div>
        </div>
        <div class="drag-hint">按住行上下拖动，完成后点右上角 ✓ 保存</div>
      </template>
    </div>
  </div>
</template>
