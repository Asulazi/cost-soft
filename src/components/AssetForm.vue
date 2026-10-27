<script setup>
import { reactive, ref, computed } from 'vue'
import { X, Check, Package, Wallet, Tag, Shapes, CalendarDays, Trash2, Target, Coins, TrendingUp, Paperclip, Pin, PiggyBank, CalendarX2, PackageX, ArrowUpFromLine, StickyNote, ImagePlus, Plus } from 'lucide-vue-next'
import CuteBox from './CuteBox.vue'
import DateField from './DateField.vue'
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
  type: props.asset?.type || '资产',
  targetMode: props.asset?.targetMode || 'none',
  targetValue: props.asset?.targetValue ?? '',
  targetDays: props.asset?.targetValue && props.asset?.targetMode === 'price' ? Math.round(Number(props.asset.price) / Number(props.asset.targetValue)) : '',
  targetDate: '',
  incomes: Array.isArray(props.asset?.incomes) ? props.asset.incomes.map((i) => ({ ...i })) : [],
  marketPrices: Array.isArray(props.asset?.marketPrices) ? props.asset.marketPrices.map((i) => ({ ...i })) : [],
  extras: Array.isArray(props.asset?.extras) ? props.asset.extras.map((i) => ({ ...i })) : [],
  pinned: props.asset?.pinned || false,
  excludeFromTotal: props.asset?.excludeFromTotal || false,
  excludeFromDaily: props.asset?.excludeFromDaily || false,
  note: props.asset?.note || '',
  notePhotos: Array.isArray(props.asset?.notePhotos) ? [...props.asset.notePhotos] : [],
  photo: props.asset?.photo || null
})

function addTarget(mode) {
  form.targetMode = mode
}

function addIncome() {
  form.incomes.push({ date: new Date().toISOString().slice(0, 10), amount: '', note: '' })
}

function addMarketPrice() {
  form.marketPrices.push({ date: new Date().toISOString().slice(0, 10), price: '' })
}

function addExtra() {
  form.extras.push({ name: '', amount: '' })
}

function removeAt(list, i) {
  list.splice(i, 1)
}

const fileInput = ref(null)

async function pickPhoto(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const dataUrl = await compress(file)
  form.photo = dataUrl
}

async function pickNotePhotos(e) {
  const files = Array.from(e.target.files || [])
  for (const f of files) {
    const url = await compress(f)
    if (url) form.notePhotos.push(url)
  }
  e.target.value = ''
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

const rules = ['按天', '按次', '自定义']
const today = computed(() => new Date().toISOString().slice(0, 10))

function submit() {
  if (!form.name.trim()) return emit('toast', '请填写名称')
  if (!form.price || Number(form.price) <= 0) return emit('toast', '请填写有效价格')
  if (!form.purchaseDate) return emit('toast', '请选择购买日期')
  let tv = null
  if (form.targetMode === 'custom') tv = Number(form.targetValue) || null
  if (form.targetMode === 'price') tv = form.targetDays ? Number((Number(form.price) / Number(form.targetDays)).toFixed(4)) : null
  if (form.targetMode === 'date' && form.targetDate) {
    const days = Math.max(1, Math.round((new Date(form.targetDate) - new Date(form.purchaseDate)) / 86400000))
    tv = Number((Number(form.price) / days).toFixed(4))
  }
  emit('save', {
    ...form,
    name: form.name.trim(),
    price: Number(form.price),
    targetValue: tv,
    incomes: form.incomes.filter((i) => Number(i.amount) > 0),
    marketPrices: form.marketPrices.filter((i) => Number(i.price) > 0),
    extras: form.extras.filter((e) => Number(e.amount) > 0),
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
    <div class="photo-hint"><ImagePlus :size="14" style="vertical-align: -2px; margin-right: 4px" />给它拍张照吧</div>

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
        <DateField v-model="form.purchaseDate" />
      </div>
      <div class="field-row">
        <span class="field-icon"><Shapes :size="18" /></span>
        <span class="field-label">类别</span>
        <select v-model="form.category" class="field-input" style="appearance: auto; text-align: right">
          <option v-for="c in categories" :key="c.id ?? c.name" :value="c.name">{{ c.name }}</option>
          <option value="未分类">未分类</option>
        </select>
      </div>
      <div class="field-row">
        <span class="field-icon"><Tag :size="18" /></span>
        <span class="field-label">标签</span>
        <input v-model="form.tags" class="field-input" placeholder="空格分隔，可留空" />
      </div>
    </div>

    <div class="form-section">
      <div class="rule-title">
        <span class="field-icon"><Target :size="18" /></span>
        目标日均
      </div>
      <div class="segmented-block">
        <div class="segmented">
          <button :class="{ on: form.targetMode === 'none' }" @click="addTarget('none')">不设定</button>
          <button :class="{ on: form.targetMode === 'price' }" @click="addTarget('price')">按价格</button>
          <button :class="{ on: form.targetMode === 'date' }" @click="addTarget('date')">按日期</button>
          <button :class="{ on: form.targetMode === 'custom' }" @click="addTarget('custom')">自定义</button>
        </div>
      </div>
      <div v-if="form.targetMode === 'custom'" class="field-row" style="border-top: 1px solid var(--line)">
        <span class="field-label">目标值</span>
        <input v-model="form.targetValue" class="field-input" type="number" inputmode="decimal" placeholder="请输入目标日均成本" />
      </div>
      <div v-if="form.targetMode === 'price'" class="field-row" style="border-top: 1px solid var(--line)">
        <span class="field-label">目标使用天数</span>
        <input v-model="form.targetDays" class="field-input" type="number" inputmode="numeric" placeholder="希望用多少天，如 365" />
      </div>
      <div v-if="form.targetMode === 'date'" class="field-row" style="border-top: 1px solid var(--line)">
        <span class="field-label">目标日期</span>
        <DateField v-model="form.targetDate" title="目标日期" placeholder="选个日期" />
      </div>
    </div>

    <div class="form-section">
      <div class="rule-title">
        <span class="field-icon"><Coins :size="18" /></span>
        收益记录
        <button class="add-inline" @click="addIncome"><Plus :size="18" /></button>
      </div>
      <div v-for="(inc, i) in form.incomes" :key="i" class="mini-row">
        <DateField v-model="inc.date" title="收益日期" />
        <input v-model="inc.amount" type="number" inputmode="decimal" placeholder="金额" class="mini-input" />
        <button class="mini-del" @click="removeAt(form.incomes, i)"><X :size="14" /></button>
      </div>
    </div>

    <div class="form-section">
      <div class="rule-title">
        <span class="field-icon"><TrendingUp :size="18" /></span>
        市场价
        <button class="add-inline" @click="addMarketPrice"><Plus :size="18" /></button>
      </div>
      <div v-for="(mp, i) in form.marketPrices" :key="i" class="mini-row">
        <DateField v-model="mp.date" title="记录日期" />
        <input v-model="mp.price" type="number" inputmode="decimal" placeholder="市场价" class="mini-input" />
        <button class="mini-del" @click="removeAt(form.marketPrices, i)"><X :size="14" /></button>
      </div>
    </div>

    <div class="form-section">
      <div class="rule-title">
        <span class="field-icon"><Paperclip :size="18" /></span>
        附加项
        <button class="add-inline" @click="addExtra"><Plus :size="18" /></button>
      </div>
      <div v-for="(ex, i) in form.extras" :key="i" class="mini-row">
        <input v-model="ex.name" placeholder="名称" class="mini-input" />
        <input v-model="ex.amount" type="number" inputmode="decimal" placeholder="金额" class="mini-input" />
        <button class="mini-del" @click="removeAt(form.extras, i)"><X :size="14" /></button>
      </div>
    </div>

    <div class="form-section">
      <div class="switch-row">
        <span class="field-icon"><Pin :size="18" /></span>
        <span class="field-label">置顶</span>
        <button class="switch" :class="{ on: form.pinned }" @click="form.pinned = !form.pinned"><span class="knob"></span></button>
      </div>
      <div class="switch-row">
        <span class="field-icon"><PiggyBank :size="18" /></span>
        <span class="field-label">不计入总资产</span>
        <button class="switch" :class="{ on: form.excludeFromTotal }" @click="form.excludeFromTotal = !form.excludeFromTotal"><span class="knob"></span></button>
      </div>
      <div class="switch-row">
        <span class="field-icon"><CalendarX2 :size="18" /></span>
        <span class="field-label">不计入日均</span>
        <button class="switch" :class="{ on: form.excludeFromDaily }" @click="form.excludeFromDaily = !form.excludeFromDaily"><span class="knob"></span></button>
      </div>
    </div>

    <div class="form-section">
      <div class="switch-row">
        <span class="field-icon"><PackageX :size="18" /></span>
        <span class="field-label">未使用</span>
        <button class="switch" :class="{ on: form.status === '未使用' }" @click="form.status = form.status === '未使用' ? '使用中' : '未使用'"><span class="knob"></span></button>
      </div>
      <div class="switch-row">
        <span class="field-icon"><ArrowUpFromLine :size="18" /></span>
        <span class="field-label">卖出的</span>
        <button class="switch" :class="{ on: form.status === '已售出' }" @click="form.status = form.status === '已售出' ? '使用中' : '已售出'"><span class="knob"></span></button>
      </div>
      <div v-if="form.status === '已售出'" class="field-row" style="border-top: 1px solid var(--line)">
        <span class="field-label">卖出日期</span>
        <DateField v-model="form.soldDate" title="卖出日期" placeholder="请选择卖出日期" />
      </div>
    </div>

    <div class="form-section">
      <div class="rule-title">
        <span class="field-icon"><StickyNote :size="18" /></span>
        备注
      </div>
      <textarea v-model="form.note" class="note-input" placeholder="输入备注" rows="3"></textarea>
      <div class="note-photos">
        <div v-for="(p, i) in form.notePhotos" :key="i" class="note-thumb">
          <img :src="p" alt="" />
          <button class="thumb-del" @click="form.notePhotos.splice(i, 1)"><X :size="12" /></button>
        </div>
        <label class="note-add">
          <ImagePlus :size="18" />
          <input type="file" accept="image/*" multiple style="display: none" @change="pickNotePhotos" />
        </label>
      </div>
    </div>

    <button v-if="asset" class="set-row danger" style="border-radius: var(--radius); margin-top: 6px" @click="$emit('delete')">
      <Trash2 :size="18" /> 删除该资产
    </button>
  </div>
</template>
