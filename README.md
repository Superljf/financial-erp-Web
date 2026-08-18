# 财务 ERP Web

同一产品的两个独立前端，合在本仓库中：

| 目录 | 端 | 本地开发 |
| --- | --- | --- |
| `platform/` | 管理端 | `cd platform && npm install && npm run dev` → http://localhost:5173 |
| `company/` | 公司端 | `cd company && npm install && npm run dev` → http://localhost:5174 |

两端互不共用登录与功能。后端接口见本地服务 `http://localhost:8088/swagger-ui.html`。
