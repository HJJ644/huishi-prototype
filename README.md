# 绘事工作台 · 单文件原型 (Huishi Workbench — Single-file Prototype)

画师约稿管理工作台的单文件交互原型。纯静态、零构建，访客数据存于浏览器 `localStorage`。

## 目录结构
- `publish/index.html` — 生产入口（Vercel 部署根）
- `publish/client.html` — 客户问卷页
- `build/index.html` / `build/client.html` — 可编辑源码（与 publish 保持一致）
- `designer-mp-prototype.html` / `designer-mp-design.html` — 设计稿副本
- `vercel.json` — 部署配置：`outputDirectory = publish`，纯静态、无需构建

## 本地预览
直接用浏览器打开 `publish/index.html` 即可；或起一个静态服务器后访问。

## 部署 (Vercel)
仓库已含 `vercel.json`，在 Vercel 导入本仓库即自动部署到 `publish/`。
如需绑定自定义域名（如 lambstar.top），在 Vercel 后台添加域名并按提示验证 DNS 即可。

> 注意：本仓库是设计原型，与 `HJJ644/huishi-workbench`（React + Vite 主项目）相互独立，请勿混淆。
