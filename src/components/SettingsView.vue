<script setup>
import { ref } from 'vue'
import { Download, Upload, FileDown, FolderPlus, ShieldCheck, Trash2, ChevronRight, Plus, X, Settings2 } from 'lucide-vue-next'
import { db, saveCategories } from '../db.js'

const props = defineProps({
  categories: { type: Array, required: true }
})
const emit = defineEmits(['toast', 'reload'])

const newCat = ref('')
const showOps = ref(false)

function exportData() {
  emit('toast', '导出中...')
  db.assets.toArray().then(async (assets) => {
    if (!assets.length) return emit('toast', '还没有资产可导出')
    const { exportAssetsExcel } = await import('../excel.js')
    exportAssetsExcel(assets)
    emit('toast', '已导出 Excel 到下载目录')
  })
}

async function importData(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const { importAssetsExcel } = await import('../excel.js')
    const { assets, errors } = await importAssetsExcel(file)
    if (errors.length) return emit('toast', errors[0])
    if (!assets.length) return emit('toast', '没有读到有效数据行')
    const maxOrder = await db.assets.toArray().then((all) => all.reduce((m, a) => Math.max(m, Number(a.order ?? 0)), 0))
    const withOrder = assets.map((a, i) => ({ ...a, order: maxOrder + i + 1 }))
    await db.assets.bulkAdd(withOrder)
    emit('toast', `成功导入 ${assets.length} 项资产`)
    emit('reload')
  } catch {
    emit('toast', '文件读取失败，请用下载的模板填写')
  }
  e.target.value = ''
}

function getTemplate() {
  import('../excel.js').then(({ downloadTemplate }) => {
    downloadTemplate()
    emit('toast', '模板已下载')
  })
}

async function addCategory() {
  const name = newCat.value.trim()
  if (!name) return
  await saveCategories(JSON.parse(JSON.stringify([...props.categories, { id: Date.now(), name, order: props.categories.length }])))
  newCat.value = ''
  emit('toast', '已添加分类')
  emit('reload')
}

async function removeCategory(index) {
  const name = props.categories[index]?.name
  const next = props.categories.filter((_, i) => i !== index)
  const assets = await db.assets.toArray()
  const affected = assets
    .filter((a) => a.category === name)
    .map((a) => ({ ...JSON.parse(JSON.stringify(a)), category: '' }))
  if (affected.length) await db.assets.bulkPut(affected)
  await saveCategories(JSON.parse(JSON.stringify(next)))
  emit('toast', '已删除分类')
  emit('reload')
}

async function clearAll() {
  if (!confirm('确定要清空全部资产数据吗？此操作不可恢复，建议先导出备份。')) return
  const typed = prompt('此操作不可恢复！请输入「清空」两个字以确认：')
  if (typed !== '清空') {
    emit('toast', '输入不匹配，已取消清空')
    return
  }
  await db.assets.clear()
  emit('toast', '已清空资产')
  emit('reload')
}
</script>

<template>
  <div class="view">
    <div class="topbar"><h1>设置</h1></div>

    <div class="set-section">
      <button class="set-row" @click="exportData">
        <Download :size="18" /> 导出备份 (Excel)
        <ChevronRight class="chevron" :size="16" />
      </button>
      <label class="set-row">
        <Upload :size="18" /> 导入备份 (Excel)
        <ChevronRight class="chevron" :size="16" />
        <input type="file" accept=".xlsx,.xls" style="display: none" @change="importData" />
      </label>
      <button class="set-row" @click="getTemplate">
        <FileDown :size="18" /> 下载导入模板
        <ChevronRight class="chevron" :size="16" />
      </button>
    </div>

    <div class="set-section">
      <div class="set-row" style="cursor: default">
        <FolderPlus :size="18" /> 资产分类
      </div>
      <div class="cat-list" style="padding: 0 18px">
        <div v-for="(c, i) in categories" :key="c.id ?? c.name" class="custom-sort-row" style="padding: 10px 12px; margin-bottom: 6px">
          <span>{{ c.name }}</span>
          <button class="cat-del" @click="removeCategory(i)"><X :size="16" /></button>
        </div>
      </div>
      <div class="cat-add" style="padding: 0 18px 16px">
        <input v-model="newCat" placeholder="新分类名称" @keyup.enter="addCategory" />
        <button @click="addCategory"><Plus :size="16" /></button>
      </div>
    </div>

    <div class="set-section">
      <div class="set-row" style="cursor: default">
        <ShieldCheck :size="18" /> 数据完全存储在本机
      </div>
      <div class="set-hint">所有资产记录只保存在此设备的浏览器数据库中，不联网上传，可随时导出 Excel 备份。</div>
    </div>

    <div class="set-section">
      <button class="set-row" @click="showOps = !showOps">
        <Settings2 :size="18" /> 操作
        <ChevronRight class="chevron ops-chevron" :class="{ open: showOps }" :size="16" />
      </button>
      <button v-if="showOps" class="set-row danger" @click="clearAll">
        <Trash2 :size="18" /> 清空全部资产
        <ChevronRight class="chevron" :size="16" />
      </button>
    </div>
  </div>
</template>
