import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text())
})

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'shots/01-home.png', fullPage: false })

await page.click('.fab')
await page.screenshot({ path: 'shots/02-form.png' })
await page.fill('input[placeholder="请输入资产名称"]', '测试炒锅')
await page.fill('input[placeholder="请输入物品价格"]', '98')
await page.click('.save-btn')
await page.waitForTimeout(600)
await page.screenshot({ path: 'shots/03-after-add.png' })

await page.click('.fab')
await page.fill('input[placeholder="请输入资产名称"]', '测试路由器')
await page.fill('input[placeholder="请输入物品价格"]', '152.94')
await page.click('.save-btn')
await page.waitForTimeout(600)
await page.screenshot({ path: 'shots/04-two-assets.png' })

await page.click('button.chip:has-text("全部")')
await page.click('.topbar-actions .icon-btn:first-child')
await page.waitForTimeout(300)
await page.screenshot({ path: 'shots/05-sort-sheet.png' })
await page.click('button:has-text("日均成本从高到低")')
await page.click('button:has-text("保存排序")')
await page.waitForTimeout(400)
await page.screenshot({ path: 'shots/06-sorted.png' })

const tabs = page.locator('.tabbar .tab-item')
await tabs.nth(1).click()
await page.waitForTimeout(500)
await page.screenshot({ path: 'shots/07-trend.png' })
await tabs.nth(2).click()
await page.waitForTimeout(400)
await page.screenshot({ path: 'shots/08-settings.png', fullPage: true })

console.log(JSON.stringify({ errors }, null, 2))
await browser.close()
