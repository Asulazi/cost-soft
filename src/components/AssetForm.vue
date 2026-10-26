<script setup>
import { reactive, ref, computed } from 'vue'
import { X, Check, Package, Wallet, CalendarDays, Tags, CircleDollarSign, Trash2 } from 'lucide-vue-next'
import CuteBox from './CuteBox.vue'
import { STATUS } from '../db.js'

const props = defineProps({
  asset: { type: Object, default: null },
  categories: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'save', 'delete', 'toast'])

const form = reactive({
  name: props.asset?.name || '',
  price: props.asset?.price ?? '',
  purchaseDate: props.asset?.purchaseDate || new Date().toISOString().slice(0, 10),
  soldDate: props.asset?.soldDate || '',
  category: props.asset?.category || props.categories[0]?.name || '未分类',
  tags: Array.isArray(props.asset?.tags) ? props.asset.tags.join(' ') : '',
  status: props.asset?.status || STATUS.ACTIVE,
  rule: props.asset?.rule || '按天',
  photo: props.asset?.photo || null
})

const fileInput = ref(null)

async function pickPhoto(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const dataUrl = await compress(file)
  form.photo = dataUrl
}

function compress(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const max = 720
      let w = img.width
      let h = img.height
      if (w > max || h > max) {
        const r = Math.min(max / w, max / h)
        w = Math.round(w * r)
        h = Math.round(h * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

const statusList = [STATUS.ACTIVE, STATUS.RETIRED, STATUS.SOLD]
const rules = ['按天', '按次', '自定义']
const today = computed(() => new Date().toISOString().slice(0, 10))

function submit() {
  if (!form.name.trim()) return emit('toast', '请填写名称')
  if (!form.price || Number(form.price) <= 0) return emit('toast', '请填写有效价格')
  if (!form.purchaseDate) return emit('toast', '请选择购买日期')
  emit('save', {
    ...form,
    name: form.name.trim(),
    price: Number(form.price),
    tags: form.tags.split(/[\s,，、]+/).filter(Boolean)
  })
}
</script>

<template>
  <div class="view form-view">
    <div class="form-header">
      <button class="icon-btn" @click="$emit('close')"><X :size="20" /></button>
      <span class="form-title">{{ asset ? '编辑资产' : '新增资产' }}</span>
      <button class="save-btn" @click="submit"><Check :size="20" /></button>
    </div>

    <div class="photo-pick" @click="fileInput.click()">
      <img v-if="form.photo" :src="form.photo" alt="" />
      <CuteBox v-else class="placeholder-box" />
      <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="pickPhoto" />
    </div>
    <div class="photo-hint">给它拍张照吧</div>

    <div class="form-section">
      <div class="field-row">
        <span class="field-icon"><Package :size="18" /></span>
        <span class="field-label">名称</span>
        <input v-model="form.name" class="field-input" placeholder="请输入资产名称" />
      </div>
      <div class="field-row">
        <span class="field-icon"><Wallet :size="18" /></span>
        <span class="field-label">价格</span>
        <input v-model="form.price" class="field-input" type="number" inputmode="decimal" min="0" placeholder="请输入物品价格" />
      </div>
    </div>

    <div class="form-section">
      <div class="field-row">
        <span class="field-icon"><CalendarDays :size="18" /></span>
        <span class="field-label">购买日期</span>
        <input v-model="form.purchaseDate" class="field-input" type="date" :max="today" />
      </div>
      <div class="field-row">
        <span class="field-icon"><Tags :size="18" /></span>
        <span class="field-label">类别</span>
        <select v-model="form.category" class="field-input" style="appearance: auto; text-align: right">
          <option v-for="c in categories" :key="c.id ?? c.name" :value="c.name">{{ c.name }}</option>
          <option value="未分类">未分类</option>
        </select>
      </div>
      <div class="field-row">
        <span class="field-icon"><Tags :size="18" /></span>
        <span class="field-label">标签</span>
        <input v-model="form.tags" class="field-input" placeholder="空格分隔，可留空" />
      </div>
    </div>

    <div class="form-section">
      <div class="rule-title">
        <span class="field-icon"><CircleDollarSign :size="18" /></span>
        成本计算规则
      </div>
      <div class="segmented-block">
        <div class="segmented">
          <button v-for="r in rules" :key="r" :class="{ on: form.rule === r }" @click="form.rule = r">{{ r }}</button>
        </div>
      </div>
      <div class="status-picker">
        <button v-for="s in statusList" :key="s" :class="{ on: form.status === s }" @click="form.status = s">{{ s }}</button>
      </div>
      <div v-if="form.status === STATUS.SOLD" class="field-row" style="border-top: 1px solid var(--line)">
        <span class="field-label">卖出日期</span>
        <input v-model="form.soldDate" class="field-input" type="date" :max="today" />
      </div>
    </div>

    <button v-if="asset" class="set-row danger" style="border-radius: var(--radius); margin-top: 6px" @click="$emit('delete')">
      <Trash2 :size="18" /> 删除该资产
    </button>
  </div>
</template>
