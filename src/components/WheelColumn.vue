<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const ITEM = 40

const props = defineProps({
  values: { type: Array, required: true },
  modelValue: { type: Number, required: true },
  suffix: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const el = ref(null)
const lastEmitted = ref(null)

const selIndex = computed(() => props.values.indexOf(props.modelValue))

function onScroll() {
  if (!el.value) return
  const raw = Math.round(el.value.scrollTop / ITEM)
  const i = Math.max(0, Math.min(props.values.length - 1, raw))
  const v = props.values[i]
  if (v !== undefined && v !== props.modelValue) {
    lastEmitted.value = v
    emit('update:modelValue', v)
  }
}

function scrollToValue() {
  if (!el.value || selIndex.value < 0) return
  el.value.scrollTop = selIndex.value * ITEM
}

watch(
  () => props.modelValue,
  (nv) => {
    if (nv !== lastEmitted.value) requestAnimationFrame(scrollToValue)
  }
)

onMounted(scrollToValue)
</script>

<template>
  <div ref="el" class="wheel-col" @scroll="onScroll">
    <div class="wheel-pad"></div>
    <div v-for="v in values" :key="v" class="wheel-item" :class="{ sel: v === modelValue }">
      {{ v }}{{ suffix }}
    </div>
    <div class="wheel-pad"></div>
  </div>
</template>
