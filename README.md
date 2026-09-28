# Autional 管理控制台

**域名**：[admin.autional.cn](https://admin.autional.cn)
**技术栈**：Vite + React 19 + TypeScript + Tailwind CSS + Ant Design
**仓库**：[github.com/autional-cn/admin](https://github.com/autional-cn/admin)

租户、用户、应用与策略的集中管理后台。

## 开发

```bash
pnpm install
pnpm dev      # http://localhost:13102
pnpm build    # 构建产物：apps/admin-console/dist/
pnpm test     # Vitest 单元测试
```

## 部署

推送至 `main` 分支后由 Vercel 自动部署。
