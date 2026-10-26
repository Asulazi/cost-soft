<script setup>
import { ref, watch } from 'vue'
import { GripVertical, Check, ArrowUpDown } from 'lucide-vue-next'

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
const dragIndex = ref(null)
const list = ref(props.assets.map((a) => a.id))

watch(
  () => props.assets,
  (v) => {
    if (mode.value === 'custom') list.value = v.map((a) => a.id)
  },
  { deep: true }
)

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

function save() {
  emit('save', { mode: mode.value, order: mode.value === 'custom' ? list.value : null })
}
</script>

<template>
  <div class="sort-sheet-mask" @click.self="$emit('close')">
    <div class="sheet">
      <div class="sheet-title">排序方式</div>
      <button v-for="m in modes" :key="m.key" class="sort-option" :class="{ on: mode === m.key }" @click="mode = m.key">
        {{ m.label }}
        <Check v-if="mode === m.key" class="check-mark" :size="18" />
      </button>
      <template v-if="mode === 'custom'">
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
          >
            <GripVertical class="drag-handle" :size="18" />
            <span>{{ assets.find((a) => a.id === id)?.name || '未知' }}</span>
            <ArrowUpDown :size="16" style="color: var(--ink-faint)" />
          </div>
        </div>
        <button class="direction-toggle" @click="$emit('close')">长按名称行可上下拖动，完成后点保存</button>
      </template>
      <button class="direction-toggle" style="background: var(--ink); color: var(--surface); font-weight: 600" @click="save">保存排序</button>
    </div>
  </div>
</template>
