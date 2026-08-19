# 财务 ERP Web

同一产品的两个独立前端，合在本仓库中：

| 目录 | 端 | 本地开发 |
| --- | --- | --- |
| `platform/` | 管理端 | `cd platform && npm install && npm run dev` → http://localhost:5173 |
| `company/` | 公司端 | `cd company && npm install && npm run dev` → http://localhost:5174 |

两端互不共用登录与功能。后端接口见本地服务 `http://localhost:8088/swagger-ui.html`。

## CI/CD

仓库已接入 GitHub Actions（[Actions](https://github.com/Superljf/financial-erp-Web/actions)）。

| 阶段 | 触发 | 做什么 |
| --- | --- | --- |
| CI | `main` 的 push / Pull Request | Node 20，分别在 `platform/`、`company/` 执行 `npm ci` 与 `npm run build`（含 TypeScript 检查） |
| CD | `main` 推送且构建通过 | 上传静态产物 `platform-dist`、`company-dist`（保留 14 天） |

查看产物：仓库 **Actions** → 选中一次成功的 `ci-cd` → **Artifacts**。

生产环境用 Nginx 托管 `dist`，并把 `/api/` 反代到后端 `8088`（前端请求使用相对路径 `/api`，不要把接口地址写进构建产物）。当前没有配置云服务器 SSH，因此不会自动部署。
