import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, locale: 'zh-CN' })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + (e.stack || e.message).slice(0, 400)))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text())
})

await page.goto('http://localhost:5173/cost-soft/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.screenshot({ path: 'shots/01-home.png', fullPage: false })

await page.click('.fab')
await page.screenshot({ path: 'shots/02-form.png' })
await page.click('.date-trigger')
await page.waitForTimeout(300)
await page.screenshot({ path: 'shots/02b-datepicker.png' })
await page.click('.round-btn.main')
await page.fill('input.field-input >> nth=0', '测试炒锅')
await page.fill('input.field-input[type="number"]', '98')
await page.click('.switch-row:has-text("置顶") .switch')
await page.click('button.add-inline >> nth=0')
await page.click('.save-btn')
await page.waitForTimeout(600)
await page.screenshot({ path: 'shots/03-after-add.png' })

await page.click('.fab')
await page.fill('input.field-input >> nth=0', '测试路由器')
await page.fill('input.field-input[type="number"]', '152.94')
await page.click('.save-btn')
await page.waitForTimeout(600)
await page.screenshot({ path: 'shots/04-two-assets.png' })

await page.click('button.chip:has-text("全部")')
await page.click('.topbar-actions .icon-btn:first-child')
await page.waitForTimeout(300)
await page.screenshot({ path: 'shots/05-sort-sheet.png' })
await page.click('button.sort-option:has-text("日均成本从高到低")')
await page.waitForTimeout(400)
await page.click('.topbar-actions .icon-btn:first-child')
await page.waitForTimeout(300)
await page.click('button.sort-option:has-text("自定义拖拽")')
await page.waitForTimeout(300)
await page.screenshot({ path: 'shots/05b-custom-sort.png' })
await page.click('.drag-head .round-btn.main')
await page.waitForTimeout(400)
await page.screenshot({ path: 'shots/06-sorted.png' })

// seed multi-year data directly through Dexie to verify the trend chart
await page.evaluate(async () => {
  const { db, STATUS } = await import('/cost-soft/src/db.js')
  await db.assets.bulkAdd([
    { name: '旧椅子', price: 400, purchaseDate: '2023-03-10', category: '家居', tags: [], status: STATUS.ACTIVE, rule: '按天', photo: null, order: 90 },
    { name: '旧相机', price: 1200, purchaseDate: '2023-11-20', category: '摄影', tags: [], status: STATUS.ACTIVE, rule: '按天', photo: null, order: 91 },
    { name: '旧耳机', price: 299, purchaseDate: '2024-07-01', category: '电子', tags: [], status: STATUS.SOLD, soldDate: '2025-02-15', rule: '按天', photo: null, order: 92 }
  ])
})
await page.reload({ waitUntil: 'networkidle' })

const tabs = page.locator('.tabbar .tab-item')
await tabs.nth(1).click()
await page.waitForTimeout(500)
await page.screenshot({ path: 'shots/07-trend.png' })

// settings: template download + excel import + double-confirm clear
await tabs.nth(2).click()
await page.waitForTimeout(400)
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('button.set-row:has-text("下载导入模板")')
])
await download.saveAs('shots/template.xlsx')

import * as XLSX from 'xlsx'
const wb = XLSX.read(new Uint8Array(await import('fs/promises').then((fs) => fs.readFile('shots/template.xlsx'))), { type: 'array' })
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
rows.push(['Excel导入测试', 66.5, '2025-01-05', '其他', '测试', '使用中', ''])
const out = XLSX.utils.aoa_to_sheet(rows)
const outWb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(outWb, out, '资产')
XLSX.writeFile(outWb, 'shots/import-test.xlsx')

await page.setInputFiles('input[type="file"]', 'shots/import-test.xlsx')
await page.waitForTimeout(600)
await page.screenshot({ path: 'shots/09-after-import.png' })

let dialogCount = 0
page.on('dialog', (d) => {
  dialogCount++
  d.accept(dialogCount === 2 ? '清空' : '')
})
await page.click('button.set-row.danger')
await page.waitForTimeout(600)
await page.screenshot({ path: 'shots/10-after-clear.png' })

await tabs.nth(2).click()
console.log(JSON.stringify({ errors }, null, 2))
await browser.close()
