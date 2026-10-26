# 有数 - 本地资产管理

纯本地的资产管理 PWA。数据只存在设备浏览器数据库（IndexedDB）中，不上传任何服务器。

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:5173 预览。

## 构建生产版本

```bash
npm run build
```

产物在 `dist/` 目录，包含 Service Worker，可完全离线使用。

## 部署到 Cloudflare Pages

1. 注册/登录 Cloudflare 账号（免费）。
2. 在项目目录执行：

```bash
npx wrangler login
npx wrangler pages deploy dist --project-name youshu
```

首次部署后会得到类似 `https://youshu.pages.dev` 的地址。

## 安装到 iPhone

1. 用 Safari 打开部署地址。
2. 点击底部「分享」按钮。
3. 选择「添加到主屏幕」。
4. 确认后，主屏幕出现「有数」图标，点开即全屏运行。

装好后 App 完全离线可用，数据存在手机本地。

## 数据备份

进入「设置」页：

- 导出备份：生成 JSON 文件到下载目录。
- 导入备份：选择之前导出的 JSON 文件恢复。

建议重要数据定期导出一份存到「文件」App 或云盘。
