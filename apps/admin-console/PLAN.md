# Autional Admin Console 详细功能规划

> 版本: v1.0 | 日期: 2026-05-07 | 状态: 规划阶段  
> 目标: 基于 Autional 14 个微服务、544 个 API，为 `apps/admin-console` 制定从 MVP 到完整版的功能演进路线图

---

## 1. 概述

### 1.1 项目背景
- **后端**: 14 个微服务，544 个 API，覆盖 IAM 全链路（身份认证、多租户、RBAC、MFA、审计、计费、合规、钱包、积分、存储等）
- **前端现状**: `apps/admin-console` 刚起步，仅有仪表盘 `/`、用户管理 `/users`、角色权限 `/roles` 三个基础页面
- **技术栈**: Next.js 15 (App Router) + React 19 + TypeScript + Ant Design 5 + Tailwind CSS + TanStack Query + Zustand

### 1.2 规划原则
1. **按角色隔离视图**: Super Admin / Tenant Admin / Auditor / Delegated Admin / Developer 看到不同的菜单和功能
2. **后端为权威**: 前端权限控制是 UX 优化，后端 API 做最终裁决
3. **渐进式交付**: P0（核心闭环）→ P1（日常管理）→ P2（高级功能）→ P3（生态完善）
4. **批量操作优先**: 所有列表页默认支持批量选择 + 批量操作
5. **向导式复杂配置**: OIDC 应用注册、IdP 配置使用 Step-by-Step Wizard

---

## 2. 模块清单与优先级

| # | 模块 | 路径 | 功能描述 | 优先级 | 目标角色 |
|---|------|------|----------|--------|----------|
| 1 | **平台概览** | `/` | 仪表盘：租户/用户/会话/登录统计 | P0 | Super Admin, Tenant Admin |
| 2 | **用户管理** | `/users` | 用户 CRUD、批量操作、状态管理、搜索筛选 | P0 | Super Admin, Tenant Admin, Delegated Admin |
| 3 | **用户详情** | `/users/{id}` | 用户信息、角色、权限、登录历史、设备、MFA、会话 | P0 | Super Admin, Tenant Admin |
| 4 | **角色管理** | `/roles` | 角色 CRUD、权限分配、角色继承关系 | P0 | Super Admin, Tenant Admin |
| 5 | **权限管理** | `/permissions` | 权限 CRUD、权限分类、使用热度 | P1 | Super Admin, Tenant Admin |
| 6 | **部门管理** | `/departments` | 部门树 CRUD、组织架构图可视化 | P1 | Super Admin, Tenant Admin, Delegated Admin |
| 7 | **成员管理** | `/members` | 邀请成员、批量导入、成员角色分配 | P1 | Super Admin, Tenant Admin, Delegated Admin |
| 8 | **应用管理** | `/applications` | OIDC/SAML 应用注册、Client 管理、回调 URL 配置 | P1 | Super Admin, Tenant Admin, Developer |
| 9 | **身份提供商** | `/identity-providers` | 外部 IdP 配置（OAuth/SAML/LDAP）、测试连接 | P1 | Super Admin, Tenant Admin |
| 10 | **MFA 策略** | `/security/mfa` | 全局 MFA 策略、支持方式开关、风险策略 | P1 | Super Admin, Tenant Admin |
| 11 | **密码策略** | `/security/password-policy` | 密码复杂度、过期策略、历史检查 | P1 | Super Admin, Tenant Admin |
| 12 | **安全策略** | `/security/policy` | 登录限制（IP/地域/时间）、设备信任、会话超时 | P1 | Super Admin, Tenant Admin |
| 13 | **会话管理** | `/sessions` | 会话列表、撤销会话、活跃统计、风险评分 | P1 | Super Admin, Tenant Admin |
| 14 | **品牌定制** | `/branding` | Logo/配色/域名/自定义 CSS、邮件模板 | P1 | Super Admin, Tenant Admin |
| 15 | **通知模板** | `/notifications/templates` | 站内通知模板 CRUD、测试发送 | P1 | Super Admin, Tenant Admin |
| 16 | **通信配置** | `/communication` | 邮件/SMS 模板编辑、渠道配置、发送日志 | P1 | Super Admin, Tenant Admin |
| 17 | **Webhook** | `/webhooks` | Webhook CRUD、事件类型选择、送达日志 | P2 | Super Admin, Tenant Admin, Developer |
| 18 | **审计日志** | `/audit-logs` | 审计日志查询/高级筛选/导出、哈希链验证 | P1 | Super Admin, Tenant Admin, Auditor |
| 19 | **计费与订阅** | `/billing` | 套餐选择/变更、使用量、发票、支付方式 | P2 | Super Admin, Tenant Admin |
| 20 | **合规中心** | `/compliance` | GDPR DSAR、同意管理、SoD 规则、ISO27001 | P2 | Super Admin, Tenant Admin, Auditor |
| 21 | **存储管理** | `/storage` | 文件管理、配额、数据保留策略、回收站 | P2 | Super Admin, Tenant Admin |
| 22 | **钱包管理** | `/wallets` | 租户钱包总览、手动调账、争议处理 | P2 | Super Admin, Tenant Admin |
| 23 | **积分管理** | `/points` | 积分规则配置、积分账户管理、批量操作 | P2 | Super Admin, Tenant Admin |
| 24 | **租户管理** | `/tenants` | 创建/暂停/删除租户、全局配额（仅 Super Admin） | P1 | Super Admin |
| 25 | **平台公告** | `/announcements` | 全局公告发布/定向推送 | P2 | Super Admin |
| 26 | **运维视图** | `/ops` | 服务健康、API 用量、MQ 监控、告警配置 | P3 | Super Admin, SRE |
| 27 | **系统设置** | `/settings` | 个人资料、语言/时区、功能开关 | P0 | 所有登录用户 |

---

## 3. 各模块详细功能点

### 3.1 平台概览 (Dashboard) — `/`
**布局**: 4 列统计卡片 + 2 列图表区 + 2 列列表区

**统计卡片 (StatsCard)**:
| 指标 | 数据来源 | 权限 |
|------|----------|------|
| 总用户数 | `GET /users` (count) | tenant:user:read |
| 今日新增用户 | `GET /users` (created_at filter) | tenant:user:read |
| 活跃会话数 | `GET /sessions/active-count` | tenant:session:read |
| 角色数量 | `GET /roles` (count) | tenant:role:read |
| MFA 启用率 | `GET /mfa/status/{user_id}` 聚合 | tenant:mfa:read |
| 待处理审计告警 | `GET /audit/stats` | tenant:audit:read |

**图表区**:
- **登录趋势图** (近 7/30 天): 折线图，展示每日登录成功/失败次数
- **用户增长图**: 柱状图，展示近 7/30 天新增用户数
- **会话分布图**: 饼图，按设备类型/浏览器分布

**列表区**:
- **最近登录** (Top 10): 用户名、IP、时间、结果
- **系统公告**: 最新 3 条公告摘要

**筛选与操作**:
- 时间范围选择器: 今日/近 7 天/近 30 天
- 数据自动刷新: 60 秒间隔 (TanStack Query `refetchInterval: 60000`)

---

### 3.2 用户管理 — `/users`
**布局**: 页面标题 + 操作栏 + 筛选栏 + 数据表格 + 批量操作浮层

**操作栏**:
- 创建用户按钮 (`can('tenant:user:create')`)
- 批量导入按钮 (`can('tenant:user:create')`)
- 导出 CSV 按钮 (`can('tenant:user:export')`)

**筛选栏**:
| 筛选条件 | 类型 | 对应 API Query |
|----------|------|----------------|
| 关键词搜索 | Input | `keyword` (用户名/邮箱) |
| 状态 | Select | `status` (active/locked/disabled/pending) |
| 角色 | Select | `role_id` |
| 部门 | TreeSelect | `department_id` |
| 注册时间 | DateRange | `created_from`, `created_to` |
| MFA 状态 | Select | `mfa_enabled` (true/false) |

**表格字段**:
| 字段 | 宽度 | 说明 |
|------|------|------|
| 复选框 | 48px | 批量选择 |
| ID | 120px | `id`，可点击跳转详情 |
| 用户名 | 150px | `username` |
| 邮箱 | 200px | `email` |
| 状态 | 100px | Tag 渲染 (active=green, locked=red, disabled=gray) |
| 角色 | 150px | 多角色以 Tag 列表展示 |
| 部门 | 150px | `department_name` |
| MFA | 80px | 启用/未启用 Icon |
| 最后登录 | 160px | `last_login_at` |
| 创建时间 | 160px | `created_at` |
| 操作 | 180px | 详情 / 编辑 / 禁用 / 删除 / 重置密码 / 解锁 |

**行操作 (需细粒度权限)**:
- 详情: `tenant:user:read`
- 编辑: `tenant:user:write`
- 禁用/启用: `tenant:user:write`
- 删除: `tenant:user:delete`
- 重置密码: `tenant:user:write`
- 解锁账户: `tenant:user:write`
- 重置 MFA: `tenant:mfa:write`

**批量操作 (选中 ≥2 行时浮现)**:
- 批量禁用/启用 → `POST /users/batch/status`
- 批量删除 → 循环单条 `DELETE /users/{id}`
- 批量重置密码 → 循环单条 `POST /users/{user_id}/password-resets`
- 批量分配角色 → 循环单条 `POST /users/{user_id}/roles`

**分页**: 前端分页 + 后端分页结合，默认 pageSize=20，支持 20/50/100

---

### 3.3 用户详情 — `/users/{id}`
**布局**: 顶部用户基本信息卡 + Tab 切换多面板

**基本信息卡**:
- 头像、用户名、邮箱、用户 ID、状态 Tag、创建时间
- 快捷操作: 编辑资料、重置密码、禁用账户、删除账户、导出数据

**Tab 面板**:
| Tab | 内容 | API |
|-----|------|-----|
| **基本信息** | 用户资料表单、自定义字段 | `GET /users/{user_id}`, `PUT /users/{user_id}` |
| **角色权限** | 当前角色列表、分配角色、权限明细 | `GET /users/{user_id}/roles`, `POST /users/{user_id}/roles`, `DELETE /users/{user_id}/roles`, `GET /users/{user_id}/permissions` |
| **登录历史** | 时间线形式的登录记录 | `GET /users/{user_id}/login-histories` |
| **活跃会话** | 会话列表、远程登出 | `GET /auth/me/sessions` |
| **设备列表** | 信任设备 / 未知设备 | `GET /auth/me/devices` |
| **MFA 状态** | TOTP/Passkey/备用码状态、重置 MFA | `GET /mfa/status/{user_id}`, `POST /users/{user_id}/mfa/reset` |
| **审计日志** | 该用户的操作审计 | `GET /audit/logs` (user_id 筛选) |

---

### 3.4 角色管理 — `/roles`
**布局**: 页面标题 + 创建按钮 + 表格 + 权限分配 Drawer

**表格字段**:
| 字段 | 说明 |
|------|------|
| 角色编码 | `code`，monospace 字体 |
| 角色名称 | `name` |
| 描述 | `description` |
| 权限数量 | 统计该角色关联的权限数 |
| 成员数量 | 统计拥有该角色的用户数 |
| 操作 | 编辑 / 权限分配 / 删除 |

**权限分配交互**:
- 点击"权限分配" → 右侧滑出 Drawer
- 权限按分类分组展示（身份认证 / 用户管理 / 安全策略 / 审计...）
- 每个权限: 权限标识 + 描述 + Allow/Deny 切换
- 支持一键全选/取消某分类
- 保存 → `POST /roles/{role_id}/permissions`

**角色继承 (P2)**:
- 可视化关系图: 当前角色继承自谁、被谁继承
- 编辑父角色 → 级联影响子角色权限

---

### 3.5 权限管理 — `/permissions`
**布局**: 表格 + 分类筛选 + 创建/编辑 Modal

**表格字段**:
| 字段 | 说明 |
|------|------|
| 权限标识 | `{scope}:{resource}:{action}`，如 `tenant:user:read` |
| 名称 | 可读名称 |
| 描述 | 详细说明 |
| 分类 | 身份认证 / 租户管理 / 安全 / 审计... |
| 使用热度 | 被多少个角色引用 |
| 操作 | 编辑 / 删除 |

---

### 3.6 部门管理 — `/departments`
**布局**: 左侧部门树 (Tree) + 右侧详情/编辑区

**功能点**:
- 部门树: 支持拖拽排序、折叠展开
- 创建子部门 / 编辑部门 / 删除部门 (转移成员确认)
- 组织架构图: 使用树形图或组织架构图组件可视化
- 部门成员列表: 快速查看该部门下所有成员

---

### 3.7 成员管理 — `/members`
**布局**: 表格 + 邀请按钮 + 批量导入

**表格字段**:
| 字段 | 说明 |
|------|------|
| 用户 | 用户名 + 头像 |
| 邮箱 | |
| 租户角色 | owner / admin / member Tag |
| 状态 | active / pending / disabled |
| 加入时间 | |
| 操作 | 编辑角色 / 移除成员 |

**操作**:
- 邀请成员: Modal 表单（邮箱 + 角色）
- 批量导入: 上传 CSV/Excel
- 接受邀请链接: 由被邀请人访问 `/invitations/{token}/accept`

---

### 3.8 应用管理 — `/applications`
**布局**: 卡片网格 / 表格双视图 + 创建向导

**列表视图**:
| 字段 | 说明 |
|------|------|
| 应用名称 | |
| 类型 | OIDC / SAML / 自建 |
| Client ID | monospace，可复制 |
| 状态 | active / suspended Tag |
| 回调 URL | 截断显示 |
| 操作 | 详情 / 编辑 / 暂停 / 删除 |

**创建向导 (Step-by-Step)**:
1. 选择应用类型 (OIDC / SAML / 自定义)
2. 填写基础信息 (名称、描述、Logo)
3. 配置认证参数:
   - OIDC: 回调 URL、允许的来源、Grant Types、Scope
   - SAML: ACS URL、Entity ID、证书上传
4. 获取 Client ID / Client Secret (仅展示一次)
5. 测试连接

**详情页 Tab**:
- 基本信息
- 认证配置 (Client ID / Secret 轮换)
- 应用成员 / 角色
- 登录统计
- 安全策略

---

### 3.9 身份提供商 (IdP) — `/identity-providers`
**布局**: 表格 + 配置向导

**功能点**:
- 外部 OAuth 提供商: 名称、Client ID、授权 URL、Scope 配置
- SAML IdP: 元数据 URL / 文件上传、ACS 配置
- LDAP 配置 (如后端支持)
- 测试连接按钮: 调用后端测试接口验证配置

---

### 3.10 安全策略

#### 3.10.1 MFA 策略 — `/security/mfa`
**布局**: 表单页面

**配置项**:
- 全局 MFA 开关: 强制 / 可选 / 禁用
- 支持方式多选: TOTP / SMS / Email / Passkey / 备用恢复码
- 风险策略: 高风险操作强制 MFA、新设备强制 MFA

#### 3.10.2 密码策略 — `/security/password-policy`
**布局**: 表单页面

**配置项**:
- 最小长度、复杂度要求（大小写、数字、特殊字符）
- 密码过期天数
- 历史密码检查（不可重复使用近 N 次）
- 泄露检测开关

#### 3.10.3 安全策略 — `/security/policy`
**布局**: 表单页面

**配置项**:
- 登录限制: IP 白名单/黑名单、地域限制、时间窗口
- 设备信任策略: 新设备验证方式
- 会话超时配置: 空闲超时、最大会话时长

---

### 3.11 会话管理 — `/sessions`
**布局**: 表格 + 统计面板

**表格字段**:
| 字段 | 说明 |
|------|------|
| 会话 ID | 截断显示 |
| 用户 | 用户名 |
| IP 地址 | |
| 设备 / 浏览器 | |
| 位置 | |
| 风险评分 | Tag (低/中/高) |
| 创建时间 | |
| 最后活跃 | |
| 操作 | 撤销会话 |

**统计面板**:
- 当前活跃会话数
- 会话风险分布
- 会话统计概览

---

### 3.12 品牌定制 — `/branding`
**布局**: 表单 + 实时预览

**配置项**:
- Logo 上传 / URL
- Favicon
- 主色调 (ColorPicker)
- 背景色 / 背景图
- 圆角风格
- 自定义 CSS (高级，CodeEditor)
- 登录页文案
- 邮件模板基础样式

**实时预览**:
- 右侧或下方 iframe 预览登录页效果

---

### 3.13 通知与通信

#### 3.13.1 通知模板 — `/notifications/templates`
**布局**: 表格 + 模板编辑器

**模板编辑器**:
- 变量插入: `{{username}}`, `{{tenant_name}}`, `{{reset_url}}`
- 支持 HTML / Markdown / 纯文本
- 多语言版本 (zh-CN / en-US)
- 测试发送

#### 3.13.2 通信配置 — `/communication`
**布局**: Tab 页 (邮件 / SMS / Push)

**功能**:
- 渠道连通性检查
- 发送日志查询
- 速率限制查看
- 消息模板管理

---

### 3.14 Webhook — `/webhooks`
**布局**: 表格 + 创建/编辑 Modal + 送达日志 Drawer

**表格字段**:
| 字段 | 说明 |
|------|------|
| 名称 | |
| URL | |
| 事件类型 | Tag 列表 |
| 状态 | active / disabled |
| 最近送达 | 成功/失败 Tag + 时间 |
| 操作 | 编辑 / 删除 / 测试推送 |

---

### 3.15 审计日志 — `/audit-logs`
**布局**: 查询构建器 + 时间线表格 + 导出面板

**高级筛选**:
| 条件 | 类型 |
|------|------|
| 时间范围 | DateTimeRange (精确到秒) |
| 操作类型 | Select |
| 资源类型 | Select |
| 操作人 | UserPicker |
| 目标用户 | UserPicker |
| 结果 | Select |
| 关键词 | Input |

**哈希链验证**:
- 按钮"验证哈希链完整性"
- 显示最近一次验证结果

**导出**:
- 导出当前筛选结果为 CSV/Excel/JSON
- 异步导出: 大文件后台生成 + 下载链接通知

---

### 3.16 计费与订阅 — `/billing`
**布局**: 概览卡片 + 套餐对比 + 用量图表 + 发票列表

**概览**:
- 当前套餐名称、到期时间、状态
- 本月使用量 vs 配额
- 账单总额

**套餐管理**:
- 套餐列表 (卡片式对比): 功能清单、价格、配额
- 变更套餐 / 回滚套餐

**用量仪表盘**:
- API 调用量趋势 (近 30 天)
- 活跃用户趋势
- 存储使用量

**发票管理**:
- 发票列表表格
- 查看发票 / 导出发票 PDF / 红字发票

---

### 3.17 合规中心 — `/compliance`
**布局**: 多 Tab 复杂页面

**Tab 1: 合规仪表盘**
- 合规评分卡片
- 待处理 DSAR 数量
- 过期策略告警

**Tab 2: GDPR DSAR**
- DSAR 列表、处理、执行删除

**Tab 3: 同意管理**
- 同意记录列表、按用户/应用/时间筛选

**Tab 4: 数据留存策略**
- 策略列表、创建/编辑/删除

**Tab 5: SoD 规则**
- 规则列表、冲突检查

**Tab 6: ISO27001 控制项**
- 控制项列表、合规状态追踪

---

### 3.18 存储管理 — `/storage`
**布局**: 文件浏览器 (树形+列表) + 配额面板

**文件浏览器**:
- 文件夹树 (左侧) + 文件列表 (右侧)
- 支持拖拽上传、分片上传
- 文件操作: 下载、分享、移动、复制、删除、版本管理、水印
- 回收站

**配额面板**:
- 总容量 / 已用 / 剩余
- 按应用/用户拆分

---

### 3.19 钱包管理 — `/wallets`
**布局**: 统计面板 + 交易流水表格 + 争议处理区

**统计面板 (管理员视角)**:
- 租户钱包总览
- 应用钱包总览

**交易流水**:
- 表格: 交易 ID、用户、类型、金额、状态、时间
- 筛选: 按用户、类型、状态、时间范围

**争议处理**:
- 争议列表、处理争议

**手动调账**:
- 表单: 选择用户、调整金额、原因说明

**反欺诈规则**:
- 查看/编辑规则

---

### 3.20 积分管理 — `/points`
**布局**: 规则列表 + 账户查询 + 批量操作

**积分规则**:
- 表格: 规则名称、触发条件、积分值、状态
- 创建/编辑/删除、规则试算

**积分账户**:
- 查询用户积分、积分历史、批量发放

---

### 3.21 租户管理 (仅 Super Admin) — `/tenants`
**布局**: 表格 + 创建 Modal + 详情 Drawer

**表格字段**:
| 字段 | 说明 |
|------|------|
| 租户 ID | |
| 租户名称 | |
| 域名 | |
| 状态 | active / suspended Tag |
| 套餐 | 当前订阅套餐 |
| 成员数 | |
| 创建时间 | |
| 操作 | 详情 / 暂停 / 删除 |

**详情 Drawer**:
- 租户基本信息
- 成员列表
- 应用列表
- 域名列表
- 统计数据

---

## 4. 权限体系设计

### 4.1 角色层级

| 层级 | 角色 | 作用域 | 说明 |
|------|------|--------|------|
| L0 | **Super Admin** | 全局（跨租户） | 平台运营人员，上帝视角 |
| L1 | **Tenant Admin** | 单个租户 | 企业 IT 管理员，全量管理 |
| L2 | **Tenant Auditor** | 单个租户（只读） | 安全审计员，仅查看日志/合规 |
| L3 | **Delegated Admin** | 部门/应用范围 | 受限的用户/应用管理 |
| L4 | **Developer** | 单个租户的应用 | 应用开发者，管理自己的 Client |
| L5 | **End User** | 自身 | 无 Admin Console 访问权限 |

### 4.2 菜单可见性矩阵

| 菜单模块 | Super Admin | Tenant Admin | Auditor | Delegated Admin | Developer |
|----------|:---:|:---:|:---:|:---:|:---:|
| 平台概览 (Dashboard) | ✅ 全平台 | ✅ 本租户 | ❌ | ✅ 本范围 | ❌ |
| 租户管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 用户管理 | ✅ | ✅ | ❌ | ✅ (限定) | ❌ |
| 角色管理 | ✅ | ✅ | ❌ | ✅ (限定) | ❌ |
| 权限管理 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 部门管理 | ✅ | ✅ | ❌ | ✅ (限定) | ❌ |
| 成员管理 | ✅ | ✅ | ❌ | ✅ (限定) | ❌ |
| 应用管理 | ✅ (全租户) | ✅ (本租户) | ❌ | ✅ (限定) | ✅ (自己的) |
| 身份提供商 | ✅ | ✅ | ❌ | ❌ | ❌ |
| MFA 策略 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 安全策略 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 品牌定制 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 通知/通信配置 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Webhook | ✅ | ✅ | ❌ | ❌ | ✅ (限定) |
| 审计日志 | ✅ 全平台 | ✅ 本租户 | ✅ 只读 | ❌ | ❌ |
| 计费与订阅 | ✅ 全平台 | ✅ 本租户 | ❌ | ❌ | ❌ |
| 合规中心 | ✅ 全平台 | ✅ 本租户 | ✅ 只读 | ❌ | ❌ |
| 存储管理 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 钱包/积分管理 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 运维视图 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 系统设置 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 4.3 前端权限实现 (三层守卫)

```
用户请求页面
    │
    ▼
┌─────────────────┐
│ 路由守卫         │  第一层：能否访问这个页面？
│ (Middleware)    │  → 无权限：重定向到 403 页面
└───────┬─────────┘
        │ 通过
        ▼
┌─────────────────┐
│ 菜单可见性       │  第二层：侧边栏显示哪些菜单？
│ (Menu Filter)   │  → 无权限的菜单项不渲染
└───────┬─────────┘
        │ 通过
        ▼
┌─────────────────┐
│ 组件权限         │  第三层：页面内哪些按钮/操作可见？
│ (usePermission) │  → 无权限：按钮 hidden 或 disabled
└─────────────────┘
```

**权限命名规范**: `{scope}:{resource}:{action}`
- Scope: `platform` | `tenant` | `self`
- Action: `read` | `write` | `delete` | `export` | `manage`

---

## 5. 后端 API 清单 (Admin Console 专用)

### 5.1 Identity Service (端口 11001)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/users` | 用户列表 |
| POST | `/users` | 创建用户 |
| POST | `/users/batch` | 批量创建用户 |
| POST | `/users/batch/status` | 批量更新状态 |
| GET | `/users/{user_id}` | 用户详情 |
| PUT | `/users/{user_id}` | 更新用户 |
| DELETE | `/users/{user_id}` | 删除用户 |
| PUT | `/users/{user_id}/status` | 更新用户状态 |
| POST | `/users/{user_id}/account-unlocks` | 解锁账户 |
| POST | `/users/{user_id}/mfa/reset` | 重置用户 MFA |
| POST | `/users/{user_id}/password-resets` | 重置密码 |
| GET | `/users/{user_id}/roles` | 获取用户角色 |
| POST | `/users/{user_id}/roles` | 分配角色 |
| DELETE | `/users/{user_id}/roles` | 移除角色 |
| GET | `/users/{user_id}/permissions` | 获取用户权限 |
| GET | `/users/{user_id}/login-histories` | 登录历史 |
| GET | `/users/{user_id}/security-status` | 安全状态 |
| GET | `/roles` | 角色列表 |
| POST | `/roles` | 创建角色 |
| PUT | `/roles/{role_id}` | 更新角色 |
| DELETE | `/roles/{role_id}` | 删除角色 |
| GET | `/roles/{role_id}/permissions` | 获取角色权限 |
| POST | `/roles/{role_id}/permissions` | 分配权限 |
| DELETE | `/roles/{role_id}/permissions` | 撤销权限 |
| GET | `/permissions` | 权限列表 |
| POST | `/permissions` | 创建权限 |
| PUT | `/permissions/{permission_id}` | 更新权限 |
| DELETE | `/permissions/{permission_id}` | 删除权限 |
| GET | `/security/password-policy` | 获取密码策略 |
| PUT | `/security/password-policy` | 更新密码策略 |
| GET | `/devices` | 设备列表 |
| DELETE | `/devices/{id}` | 移除设备 |

### 5.2 Tenant Service (端口 11003)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/tenants` | 租户列表 (Super Admin) |
| POST | `/tenants` | 创建租户 |
| GET | `/tenants/{id}` | 租户详情 |
| PUT | `/tenants/{id}` | 更新租户 |
| DELETE | `/tenants/{id}` | 删除租户 |
| POST | `/tenants/{id}/activate` | 激活租户 |
| POST | `/tenants/{id}/suspend` | 暂停租户 |
| GET | `/tenants/{id}/members` | 成员列表 |
| POST | `/tenants/{id}/members` | 添加成员 |
| POST | `/tenants/{id}/members/invite` | 邀请成员 |
| POST | `/tenants/{id}/members/bulk-import` | 批量导入 |
| PUT | `/tenants/{id}/members/{user_id}` | 更新成员 |
| DELETE | `/tenants/{id}/members/{user_id}` | 移除成员 |
| GET | `/tenants/{id}/departments` | 部门列表 |
| POST | `/tenants/{id}/departments` | 创建部门 |
| PUT | `/tenants/{id}/departments/{dept_id}` | 更新部门 |
| DELETE | `/tenants/{id}/departments/{dept_id}` | 删除部门 |
| GET | `/tenants/{id}/org-chart` | 组织架构图 |
| GET | `/tenants/{id}/applications` | 应用列表 |
| POST | `/tenants/{id}/applications` | 创建应用 |
| GET | `/tenants/{id}/applications/{appId}` | 应用详情 |
| PUT | `/tenants/{id}/applications/{appId}` | 更新应用 |
| DELETE | `/tenants/{id}/applications/{appId}` | 删除应用 |
| GET | `/tenants/{id}/applications/{appId}/members` | 应用成员 |
| POST | `/tenants/{id}/applications/{appId}/members` | 分配应用角色 |
| GET | `/tenants/{id}/applications/{appId}/roles` | 应用默认角色 |
| POST | `/tenants/{id}/applications/{appId}/roles` | 创建应用角色 |
| GET | `/tenants/{id}/branding` | 品牌配置 |
| PUT | `/tenants/{id}/branding` | 更新品牌 |
| GET | `/tenants/{id}/quota` | 资源配额 |
| PUT | `/tenants/{id}/quota` | 更新配额 |
| GET | `/tenants/{id}/security-policy` | 安全策略 |
| PUT | `/tenants/{id}/security-policy` | 更新安全策略 |
| GET | `/tenants/{id}/statistics` | 租户统计 |
| GET | `/tenants/{id}/webhooks` | Webhook 列表 |
| POST | `/tenants/{id}/webhooks` | 创建 Webhook |
| PUT | `/tenants/{id}/webhooks/{hookId}` | 更新 Webhook |
| DELETE | `/tenants/{id}/webhooks/{hookId}` | 删除 Webhook |
| GET | `/tenants/{id}/domains` | 域名列表 |
| POST | `/tenants/{id}/domains` | 添加域名 |

### 5.3 Session Service (端口 11004)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/sessions` | 会话列表 |
| GET | `/sessions/{session_id}` | 会话详情 |
| DELETE | `/sessions/{session_id}` | 撤销会话 |
| DELETE | `/sessions/user/{user_id}` | 撤销用户所有会话 |
| GET | `/sessions/active-count` | 活跃会话数 |
| GET | `/sessions/stats` | 会话统计 |
| GET | `/sessions/risk-score` | 风险评分 |
| GET | `/tokens` | 令牌列表 |
| POST | `/tokens/blacklist` | 黑名单 |
| GET | `/tokens/blacklist/check` | 检查黑名单 |

### 5.4 MFA Service (端口 11005)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/mfa/risk-policy` | 获取风险策略 |
| GET | `/mfa/status/{user_id}` | 用户 MFA 状态 |

### 5.5 OAuth Service (端口 11006)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/oauth/clients` | 客户端列表 |
| POST | `/oauth/clients` | 创建客户端 |
| GET | `/oauth/clients/{client_id}` | 客户端详情 |
| PUT | `/oauth/clients/{client_id}` | 更新客户端 |
| DELETE | `/oauth/clients/{client_id}` | 删除客户端 |
| POST | `/oauth/clients/{client_id}/rotate-secret` | 轮换密钥 |
| GET | `/oauth/clients/{client_id}/stats` | 客户端统计 |
| GET | `/oauth/providers` | 提供商列表 |

### 5.6 Audit Service (端口 11013)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/audit/logs` | 审计日志查询 |
| GET | `/audit/logs/{id}` | 单条日志 |
| GET | `/audit/stats` | 审计统计 |
| POST | `/audit/verifications` | 验证哈希链 |
| GET | `/audit/verifications` | 验证结果 |
| POST | `/audit/archive` | 归档日志 |

### 5.7 Billing Service (端口 11017)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/billing/subscription/{tenant_id}` | 获取订阅 |
| PUT | `/billing/subscription/{tenant_id}` | 更新订阅 |
| DELETE | `/billing/subscription/{tenant_id}` | 取消订阅 |
| POST | `/billing/subscribe` | 订阅服务 |
| POST | `/billing/plans` | 创建套餐 |
| PUT | `/billing/plans/{id}` | 更新套餐 |
| DELETE | `/billing/plans/{id}` | 删除套餐 |
| GET | `/billing/usage/{tenant_id}/current` | 当前用量 |
| GET | `/billing/statistics/{tenant_id}` | 租户统计 |
| GET | `/billing/records/{tenant_id}` | 计费记录 |
| GET | `/billing/invoice/{invoice_number}` | 获取发票 |
| GET | `/billing/invoice/{invoice_number}/export` | 导出发票 |
| POST | `/billing/subscription/{tenant_id}/change-plan` | 变更套餐 |
| POST | `/billing/subscription/{tenant_id}/rollback-plan` | 回滚套餐 |

### 5.8 Compliance Service (端口 11018)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/compliance/status` | 合规状态 |
| GET | `/compliance/gdpr/dsar` | DSAR 列表 |
| POST | `/compliance/gdpr/dsar` | 创建 DSAR |
| PUT | `/compliance/gdpr/dsar/{id}` | 更新 DSAR |
| POST | `/compliance/gdpr/right-to-erasure/{id}/execute` | 执行删除 |
| GET | `/compliance/retention-policies` | 留存策略 |
| GET | `/compliance/sod-rules` | SoD 规则 |
| GET | `/compliance/sod-checks` | 冲突检查 |
| GET | `/compliance/iso27001/controls` | ISO 控制项 |
| GET | `/compliance/audit-findings` | 审计发现 |

### 5.9 Wallet Service (端口 11011)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/admin/tenants/{tenant_id}/wallets/summary` | 租户钱包总览 |
| GET | `/admin/tenants/{tenant_id}/apps/{app_id}/wallets/summary` | 应用钱包总览 |
| GET | `/admin/tenants/{tenant_id}/transactions` | 租户交易流水 |
| GET | `/admin/tenants/{tenant_id}/disputes` | 争议列表 |
| POST | `/admin/tenants/{tenant_id}/disputes/{dispute_id}/resolve` | 争议处理 |
| POST | `/admin/wallets/{user_id}/adjust` | 手动调账 |
| GET | `/wallets/fraud-rules` | 反欺诈规则 |

### 5.10 Point Service (端口 11012)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/point-rules` | 积分规则 |
| POST | `/point-rules` | 创建规则 |
| PUT | `/point-rules/{id}` | 更新规则 |
| DELETE | `/point-rules/{id}` | 删除规则 |
| POST | `/point-rules/{id}/test` | 规则试算 |
| GET | `/points` | 账户列表 |
| POST | `/points/batch-earn` | 批量发放 |

### 5.11 Notification & Communication (端口 11014/11015)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/notifications/templates` | 通知模板 |
| POST | `/notifications/templates` | 创建模板 |
| PUT | `/notifications/templates/{id}` | 更新模板 |
| DELETE | `/notifications/templates/{id}` | 删除模板 |
| POST | `/notifications/test` | 测试发送 |
| GET | `/communication/templates` | 通信模板 |
| GET | `/communication/logs` | 发送日志 |
| GET | `/communication/health/{channel}` | 渠道健康 |

### 5.12 Storage Service (端口 11016)
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/files` | 文件列表 |
| POST | `/files/upload` | 上传 |
| GET | `/storage/quota` | 配额 |
| GET | `/storage/stats` | 统计 |
| GET | `/storage/trash` | 回收站 |

---

## 6. 状态管理设计

### 6.1 全局状态 (Zustand)

```typescript
interface AuthState {
  user: User | null;
  tenants: Tenant[];
  currentTenantId: string | null;
  permissions: string[];
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
  isAuditor: boolean;
  
  setUser: (user: User) => void;
  setTenants: (tenants: Tenant[]) => void;
  switchTenant: (tenantId: string) => void;
  setPermissions: (permissions: string[]) => void;
  logout: () => void;
}

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  locale: 'zh-CN' | 'en-US';
  pageTitle: string;
  breadcrumbs: BreadcrumbItem[];
}
```

### 6.2 服务端状态 (TanStack Query)

**Query Client 全局配置**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,      // 30 秒视为新鲜
      gcTime: 5 * 60 * 1000,     // 5 分钟缓存
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
```

**Query Key 命名规范**:
```typescript
['users']                      // 用户列表
['users', { page, pageSize, keyword, status }]  // 带筛选的用户列表
['users', userId]              // 单个用户
['users', userId, 'roles']     // 用户的角色
['users', userId, 'sessions']  // 用户的会话
['roles']                      // 角色列表
['permissions']                // 权限列表
['tenants', tenantId]          // 租户详情
['audit-logs', { filters }]    // 审计日志
```

### 6.3 API Client 增强

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // 自动注入当前租户 ID
  const { currentTenantId } = useAuthStore.getState();
  if (currentTenantId) {
    config.headers['X-Tenant-ID'] = currentTenantId;
  }
  
  return config;
});
```

---

## 7. 路由与菜单设计

### 7.1 路由表 (Next.js App Router)

| 路径 | 页面组件 | 所需权限 | 面包屑 |
|------|----------|----------|--------|
| `/` | DashboardPage | tenant:dashboard:read | 仪表盘 |
| `/users` | UsersPage | tenant:user:read | 用户管理 |
| `/users/[id]` | UserDetailPage | tenant:user:read | 用户管理 / 用户详情 |
| `/roles` | RolesPage | tenant:role:read | 角色权限 |
| `/roles/[id]` | RoleDetailPage | tenant:role:read | 角色权限 / 角色详情 |
| `/permissions` | PermissionsPage | tenant:permission:read | 权限管理 |
| `/departments` | DepartmentsPage | tenant:department:read | 部门管理 |
| `/members` | MembersPage | tenant:member:read | 成员管理 |
| `/applications` | ApplicationsPage | tenant:app:read | 应用管理 |
| `/applications/[id]` | AppDetailPage | tenant:app:read | 应用管理 / 应用详情 |
| `/identity-providers` | IdPsPage | tenant:idp:read | 身份提供商 |
| `/security/mfa` | MFAPolicyPage | tenant:mfa:read | 安全策略 / MFA 策略 |
| `/security/password-policy` | PasswordPolicyPage | tenant:security:read | 安全策略 / 密码策略 |
| `/security/policy` | SecurityPolicyPage | tenant:security:read | 安全策略 / 安全策略 |
| `/sessions` | SessionsPage | tenant:session:read | 会话管理 |
| `/branding` | BrandingPage | tenant:branding:read | 品牌定制 |
| `/notifications/templates` | NotificationTemplatesPage | tenant:notification:read | 通知模板 |
| `/communication` | CommunicationPage | tenant:communication:read | 通信配置 |
| `/webhooks` | WebhooksPage | tenant:webhook:read | Webhook |
| `/audit-logs` | AuditLogsPage | tenant:audit:read | 审计日志 |
| `/billing` | BillingPage | tenant:billing:read | 计费与订阅 |
| `/compliance` | CompliancePage | tenant:compliance:read | 合规中心 |
| `/storage` | StoragePage | tenant:storage:read | 存储管理 |
| `/wallets` | WalletsPage | tenant:wallet:read | 钱包管理 |
| `/points` | PointsPage | tenant:point:read | 积分管理 |
| `/tenants` | TenantsPage | platform:tenant:read | 租户管理 (Super Admin) |
| `/ops` | OpsDashboardPage | platform:ops:read | 运维视图 (Super Admin) |
| `/settings` | SettingsPage | self:profile:read | 系统设置 |

### 7.2 侧边栏菜单结构

```
仪表盘                        → /
用户与权限
  ├─ 用户管理                 → /users
  ├─ 角色权限                 → /roles
  ├─ 权限管理                 → /permissions
  └─ 会话管理                 → /sessions
组织架构
  ├─ 部门管理                 → /departments
  └─ 成员管理                 → /members
应用与集成
  ├─ 应用管理                 → /applications
  ├─ 身份提供商               → /identity-providers
  └─ Webhook                  → /webhooks
安全策略
  ├─ MFA 策略                 → /security/mfa
  ├─ 密码策略                 → /security/password-policy
  └─ 安全策略                 → /security/policy
配置中心
  ├─ 品牌定制                 → /branding
  ├─ 通知模板                 → /notifications/templates
  └─ 通信配置                 → /communication
审计与合规
  ├─ 审计日志                 → /audit-logs
  ├─ 计费与订阅               → /billing
  └─ 合规中心                 → /compliance
运营与财务
  ├─ 钱包管理                 → /wallets
  ├─ 积分管理                 → /points
  └─ 存储管理                 → /storage
平台管理 (Super Admin)
  ├─ 租户管理                 → /tenants
  ├─ 平台公告                 → /announcements
  └─ 运维视图                 → /ops
系统设置                      → /settings
```

---

## 8. 数据可视化需求

### 8.1 Dashboard 图表清单

| 图表 | 类型 | 数据源 | 刷新频率 |
|------|------|--------|----------|
| 登录成功/失败趋势 | 折线图 (双轴) | 聚合登录历史 | 60s |
| 用户增长趋势 | 柱状图 | 用户创建时间聚合 | 300s |
| 活跃会话分布 | 饼图/环形图 | 设备类型/浏览器 | 60s |
| MFA 启用率 | 仪表盘 (Gauge) | MFA 状态统计 | 300s |
| 审计事件类型分布 | 水平条形图 | 审计日志聚合 | 300s |
| API 调用量趋势 | 面积图 | Gateway 或 billing 用量 | 60s |
| 租户资源使用 Top5 | 横向条形图 | 租户配额使用率 | 300s |
| 会话风险评分分布 | 热力图/散点图 | 会话风险评分 | 60s |

### 8.2 图表技术方案
- **库**: Recharts (轻量、React 友好、Ant Design 生态兼容)
- **统一配色**: 使用 Design Token (`primary-500`, `success`, `warning`, `danger`, `info`)
- **空状态**: 无数据时显示 `EmptyState` 组件，引导用户
- **加载状态**: 图表区域骨架屏 (Skeleton)

---

## 9. 批量操作与导入导出

### 9.1 批量操作矩阵

| 模块 | 批量操作 | 后端支持 | 前端实现 |
|------|----------|----------|----------|
| 用户管理 | 批量禁用/启用 | `POST /users/batch/status` | 原生批量 |
| 用户管理 | 批量创建 | `POST /users/batch` | 原生批量 |
| 用户管理 | 批量删除 | ❌ 无专用端点 | 循环单条 + 进度条 |
| 用户管理 | 批量分配角色 | ❌ 无专用端点 | 循环单条 |
| 成员管理 | 批量导入 | `POST /tenants/{id}/members/bulk-import` | 上传 CSV |
| 应用管理 | 批量暂停/激活 | ❌ 无专用端点 | 循环单条 |
| 会话管理 | 批量撤销 | ❌ 无专用端点 | 循环单条 |
| 存储管理 | 批量删除/移动 | `POST /storage/batch-delete`, `POST /storage/batch-move` | 原生批量 |
| 积分管理 | 批量发放 | `POST /points/batch-earn` | 原生批量 |
| 审计日志 | 批量导出 | ❌ 无专用端点 | 前端 CSV 导出 |

### 9.2 导入导出规范

**导入**:
- 支持格式: CSV, Excel (.xlsx)
- 模板下载: 每个导入功能提供"下载模板"按钮
- 字段校验: 前端预校验 + 后端二次校验
- 导入结果: 成功数 / 失败数 / 失败原因列表
- 大文件处理: 异步导入，进度轮询或 WebSocket 通知

**导出**:
- 支持格式: CSV, Excel, JSON
- 导出范围: 当前筛选结果 / 全部数据
- 异步导出: 数据量 >1000 时触发后台任务，完成后通知下载
- 敏感数据: 导出操作记录审计日志 `tenant:audit:export`

---

## 10. 实施阶段建议

### Phase 1: 基础闭环 (当前 → 2 周)
- [ ] 完善 Dashboard 真实数据接入
- [ ] 用户管理: 筛选、分页、状态管理、批量操作
- [ ] 用户详情页 (Tab 面板)
- [ ] 角色管理: 权限分配 Drawer
- [ ] 权限管理 CRUD
- [ ] 系统设置 / 个人资料

### Phase 2: 核心管理 (2~4 周)
- [ ] 部门管理 + 组织架构图
- [ ] 成员管理 + 邀请/导入
- [ ] 应用管理 + 创建向导
- [ ] 安全策略 (MFA/密码/安全)
- [ ] 会话管理
- [ ] 品牌定制
- [ ] 审计日志 + 导出

### Phase 3: 高级功能 (4~6 周)
- [ ] 计费与订阅
- [ ] 合规中心
- [ ] Webhook 管理
- [ ] 通知/通信模板
- [ ] 存储管理
- [ ] 钱包/积分管理
- [ ] 租户管理 (Super Admin)

### Phase 4: 平台化 (6~8 周)
- [ ] 运维视图
- [ ] 数据可视化增强
- [ ] 批量导入导出全面覆盖
- [ ] i18n 完善
- [ ] 无障碍优化

---

## 附录: 现有代码结构调整建议

当前 `apps/admin-console/src/` 结构:

```
src/
├── app/
│   ├── page.tsx          (Dashboard)
│   ├── users/
│   │   └── page.tsx      (Users)
│   ├── roles/
│   │   └── page.tsx      (Roles)
│   ├── layout.tsx        (RootLayout + AntdRegistry)
│   └── globals.css
├── components/
│   └── AppLayout.tsx     (当前: 侧边栏 + 顶栏)
└── lib/
    └── api.ts            (Axios + 几个 API 函数)
```

**建议演进结构**:

```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # 路由组
│   │   ├── page.tsx
│   │   ├── layout.tsx            # Dashboard 布局
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── roles/
│   │   ├── sessions/
│   │   ├── audit-logs/
│   │   └── ...
│   ├── login/
│   │   └── page.tsx              # Admin Console 独立登录页 (可选)
│   ├── layout.tsx                # RootLayout (Auth Provider + QueryClient)
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx         # 当前 AppLayout 增强版
│   │   ├── Sidebar.tsx           # 菜单 (按角色过滤)
│   │   ├── Header.tsx            # 顶栏 + 租户选择器 + 用户下拉
│   │   └── Breadcrumb.tsx        # 面包屑
│   ├── common/
│   │   ├── DataTable.tsx         # 统一表格
│   │   ├── PageHeader.tsx        # 页面标题 + 操作按钮
│   │   ├── SearchInput.tsx       # 防抖搜索
│   │   ├── ConfirmDialog.tsx     # 危险操作确认
│   │   └── EmptyState.tsx        # 空状态
│   └── forms/
│       └── UserForm.tsx          # 用户表单 (复用)
├── hooks/
│   ├── use-permission.ts         # 权限检查
│   ├── use-tenant.ts             # 租户上下文
│   └── use-query-filters.ts      # URL Query 同步筛选状态
├── stores/
│   ├── auth-store.ts             # Zustand: 用户/租户/权限
│   └── ui-store.ts               # Zustand: 侧边栏/主题/语言
├── lib/
│   ├── api.ts                    # Axios 实例 + 拦截器
│   ├── api-client/               # 按服务分模块的 API 函数
│   │   ├── identity.ts
│   │   ├── tenant.ts
│   │   ├── audit.ts
│   │   └── ...
│   └── query-client.ts           # TanStack Query 配置
└── types/
    ├── user.ts
    ├── role.ts
    └── api.ts                    # 通用 API 响应类型
```

---

> **维护说明**: 本文档随产品迭代持续更新。每次新增模块或 API 变更后，需同步更新本规划。
