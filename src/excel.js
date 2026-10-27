import * as XLSX from 'xlsx'
import { STATUS } from './db.js'

const HEADERS = ['名称', '价格', '购买日期', '类别', '标签', '状态', '卖出日期']
const STATUS_LIST = [STATUS.ACTIVE, STATUS.RETIRED, STATUS.SOLD]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function dateStr(v) {
  if (!v) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

export function exportAssetsExcel(assets) {
  const rows = [HEADERS]
  for (const a of assets) {
    rows.push([
      a.name,
      Number(a.price),
      dateStr(a.purchaseDate),
      a.category || '未分类',
      Array.isArray(a.tags) ? a.tags.join(' ') : '',
      a.status || STATUS.ACTIVE,
      dateStr(a.soldDate)
    ])
  }
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 24 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 8 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '资产')
  XLSX.writeFile(wb, `asulazi资产-${today()}.xlsx`)
}

export function downloadTemplate() {
  const example = ['（示例）无线蓝牙耳机', 299, '2024-05-01', '电子', '耳机 蓝牙', STATUS.ACTIVE, '']
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, example])
  ws['!cols'] = [{ wch: 24 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 8 }, { wch: 12 }]

  const guide = [
    ['字段', '是否必填', '说明'],
    ['名称', '必填', '资产名称，例如：菲斯勒钢炒菜锅'],
    ['价格', '必填', '数字，不要带货币符号，例如 98 或 98.50'],
    ['购买日期', '必填', '格式 2024-05-01，也可以用 Excel 日期格式'],
    ['类别', '选填', '需要先在 App 设置里添加同名分类，否则按"未分类"处理'],
    ['标签', '选填', '多个标签用空格分开，例如：厨房 常用'],
    ['状态', '选填', `只能是：${STATUS_LIST.join(' / ')}，默认为${STATUS.ACTIVE}`],
    ['卖出日期', '选填', '只有状态为已售出时需要，格式 2024-08-01'],
    ['', '', ''],
    ['注意', '', '照片无法通过 Excel 导入，导入后可在 App 内逐个补传照片'],
    ['注意', '', '导入是追加方式，不会覆盖已有数据'],
    ['', '', ''],
    ['示例行', '', '下一行是示例，名称带（示例）标记，导入时会自动跳过，不需要删除']
  ]
  const wsGuide = XLSX.utils.aoa_to_sheet(guide)
  wsGuide['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 60 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '资产')
  XLSX.utils.book_append_sheet(wb, wsGuide, '填写说明')
  XLSX.writeFile(wb, 'asulazi导入模板.xlsx')
}

export async function importAssetsExcel(file) {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { cellDates: true })
  const sheetName = wb.SheetNames.find((n) => n.includes('资产')) || wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false })
  if (!rows.length) return { assets: [], errors: ['表格是空的'] }

  const assets = []
  const errors = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r[0] || !String(r[0]).trim()) continue
    if (String(r[0]).includes('示例')) continue
    const rowNo = i + 1
    const name = String(r[0]).trim()
    const price = Number(r[1])
    const purchaseDate = dateStr(r[2])
    if (!price || price <= 0) {
      errors.push(`第${rowNo}行「${name}」价格无效`)
      continue
    }
    if (!purchaseDate) {
      errors.push(`第${rowNo}行「${name}」缺少购买日期`)
      continue
    }
    const status = STATUS_LIST.includes(r[5]) ? r[5] : STATUS.ACTIVE
    const tags = String(r[4] || '')
      .split(/[\s,，、]+/)
      .filter(Boolean)
    assets.push({
      name,
      price,
      purchaseDate,
      category: String(r[3] || '').trim() || '未分类',
      tags,
      status,
      soldDate: status === STATUS.SOLD ? dateStr(r[6]) || today() : '',
      rule: '按天',
      photo: null
    })
  }
  return { assets, errors }
}
