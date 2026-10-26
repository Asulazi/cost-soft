<script setup>
import { ref } from 'vue'
import { Download, Upload, FolderPlus, ShieldCheck, Trash2, ChevronRight, Plus, X } from 'lucide-vue-next'
import { db, saveCategories } from '../db.js'

const props = defineProps({
  categories: { type: Array, required: true }
})
const emit = defineEmits(['toast', 'reload'])

const newCat = ref('')

function exportData() {
  emit('toast', '导出中...')
  Promise.all([db.assets.toArray(), db.settings.toArray()]).then(([assets, settings]) => {
    const payload = { app: 'youshu-local', version: 1, exportedAt: new Date().toISOString(), assets, settings }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `有数备份-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    emit('toast', '已导出到下载目录')
  })
}

function importData(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result)
      if (data.app !== 'youshu-local' || !Array.isArray(data.assets)) throw new Error('格式不对')
      await db.transaction('rw', db.assets, db.settings, async () => {
        await db.assets.clear()
        await db.settings.clear()
        await db.assets.bulkPut(data.assets)
        await db.settings.bulkPut(data.settings)
      })
      emit('toast', '导入成功')
      emit('reload')
    } catch {
      emit('toast', '文件格式有误，导入失败')
    }
  }
  reader.readAsText(file)
}

async function addCategory() {
  const name = newCat.value.trim()
  if (!name) return
  await saveCategories([...props.categories, { id: Date.now(), name, order: props.categories.length }])
  newCat.value = ''
  emit('toast', '已添加分类')
}

async function removeCategory(index) {
  const next = props.categories.filter((_, i) => i !== index)
  await saveCategories(next)
  emit('toast', '已删除分类')
}

async function clearAll() {
  if (!confirm('确定要清空全部资产数据吗？此操作不可恢复，建议先导出备份。')) return
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
        <Download :size="18" /> 导出备份 (JSON)
        <ChevronRight class="chevron" :size="16" />
      </button>
      <label class="set-row">
        <Upload :size="18" /> 导入备份
        <ChevronRight class="chevron" :size="16" />
        <input type="file" accept=".json,application/json" style="display: none" @change="importData" />
      </label>
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
      <div class="set-hint">所有资产记录只保存在此设备的浏览器数据库中，不联网上传，可随时导出 JSON 备份。</div>
    </div>

    <div class="set-section">
      <button class="set-row danger" @click="clearAll">
        <Trash2 :size="18" /> 清空全部资产
        <ChevronRight class="chevron" :size="16" />
      </button>
    </div>
  </div>
</template>
