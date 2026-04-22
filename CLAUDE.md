# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 项目概述

**校园通** 是一个双端校园生活平台，包含两个独立子项目：

1. **微信小程序**（根目录）：面向学生用户的校园服务小程序，原生微信小程序框架开发
2. **管理后台**（`admin-web/`）：面向运营人员的 Web 管理系统，Vue 3 + Vite + TypeScript + Element Plus

---

## 开发命令

### 微信小程序

使用微信开发者工具打开根目录（`D:\校园通`）进行开发和预览，无独立 CLI 构建命令。

### 管理后台（`admin-web/`）

```bash
cd admin-web

# 本地开发（使用 mock 数据）
npm run dev

# 本地开发（对接真实 API）
npm run dev:realapi

# 部署到子路径 /admin/
npm run dev:subpath

# 构建生产包
npm run build

# 构建到子路径
npm run build:subpath
```

---

## 任务记录规则（必须遵守）

每次开始新编码任务前，**必须先创建任务记录文件**，再写业务代码。

- 存放路径：`/tasks/`
- 命名格式：`tasks/YYYY-MM-DD-任务名称.md`
- 必填内容：任务目标、设计参考说明、页面模块拆解、技术方案、实现方案、涉及文件、自检清单、验收结果、风险与后续建议

每次编码完成后必须执行：语法检查、视觉还原检查、命名/重复代码检查、mock 数据合理性检查，并更新任务记录文件。

---

## 微信小程序架构

### 整体结构

- `app.json`：全局路由注册，所有页面均在此声明，使用自定义导航栏（`navigationStyle: custom`）
- `app.wxss`：全局公共样式，包含 `.card`、`.topbar`、`.tabbar`、`.avatar`、`.tag`、`.image-grid` 等核心复用类
- `pages/`：各页面目录，每页包含 `.js`、`.wxml`、`.wxss`、`.json` 四文件
- `utils/`：工具函数和 API 层

### 关键全局机制

**高校切换（全局联动）**：`utils/school-state.js` 管理当前选中高校，通过 `wx.setStorageSync` 持久化，首页 `onShow` 时读取并刷新数据。所有内容均按高校维度过滤。

**认证状态**：`utils/mini-auth.js` 管理小程序登录态，token 存于 `wx.Storage`（key: `miniToken`）。`authRequest()` 会自动调用 `wx.login` 获取 code，再换取后端 token。

**API 请求层**：
- `utils/api.js`：基础 `request()` 封装，读取 `utils/runtime-config.js` 中的 `BASE_URL`（当前指向 `http://118.24.104.69:3001`）
- `utils/runtime-config.js`：支持通过 `wx.getExtConfigSync`、`app.globalData.apiBaseUrl` 或 `wx.getStorageSync('apiBaseUrlOverride')` 动态覆盖 API 地址
- 各业务 API 文件（`posts-api.js`、`stores-api.js`、`messages-api.js` 等）：按业务拆分，公开接口调用 API 层

**Mock 数据**：`utils/mock.js` 包含店铺、帖子、分类等静态 mock 数据，`utils/home-config.js` 包含首页服务入口和 FAB 菜单配置。当前部分页面仍使用 mock，后续接入真实接口时替换对应 API 调用。

### 页面路由（`app.json` 中注册顺序即为首页）

主要页面：`index`（首页帖子流）、`storefront`（创业店铺）、`message`（消息）、`profile`（我的）

子页面：`post-detail`、`store-category`、`store-detail`、`search`、`campus-verify`（校园认证）、`publish`（发帖）、`category-select`、`my-posts`、`my-favorites`、`my-orders`、`order-detail`、`wallet`、`my-address`、`open-shop`、`customer-service`、`about`

### 样式规范

- 单位使用 `rpx`（750rpx 设计稿）
- 全局背景：`linear-gradient(180deg, #f8fbff 0%, #eef2f8 100%)`
- 主色：`#3f83ff` / `#2f68e3`，文字主色：`#202534`，辅助色：`#6e84bf`
- 卡片：白底 + `border-radius: 32rpx` + `box-shadow: 0 24rpx 60rpx rgba(53, 88, 163, 0.12)`
- 底部 tabbar 悬浮在页面内（非原生 tabbar），位置固定在 `bottom: 24rpx`

---

## 管理后台架构（`admin-web/`）

### 技术栈

Vue 3 (Composition API) + Vite 6 + TypeScript + Pinia + Vue Router 4 + Element Plus 2

### 权限系统（核心）

权限分三层，登录后从后端获取并存入 `localStorage`：

1. **菜单权限**（`menuPaths: string[]`）：控制左侧菜单可见性，路由守卫在 `router/index.ts` 中拦截无权限跳转
2. **按钮权限**（`permissions: string[]`）：通过 `v-permission` 指令（`directives/permission.ts`）控制操作按钮显示，用法：`v-permission="'post:review'"`
3. **数据权限**（`scopeType: 'all' | 'assigned'`）：`all` 可见全部高校，`assigned` 只能看 `profile.schools` 中的高校

超级管理员（`roleCode === 'super_admin'`）绕过所有权限检查。

**Auth Store**（`stores/auth.ts`）：统一管理登录态，提供 `hasPermission(code)`、`hasMenuAccess(path)` 方法。

### API 层

- `api/request.ts`：基于 `fetch` 的请求封装，自动附加 `Authorization: Bearer <token>`，读取 `VITE_API_BASE_URL` 环境变量
- `api/contracts.ts`：所有接口的 TypeScript 类型定义（请求参数、响应结构），统一维护
- `api/modules/`：按业务模块拆分的 API 函数文件

统一响应格式：`{ code: number, message: string, data: T, traceId?: string }`，`code === 0` 为成功。

### Mock 数据

`data/admin-mock.ts` 包含所有模块的静态 mock 数据，当前各 API 模块直接返回 mock 数据。接入真实后端时，替换 `api/modules/` 中各函数的实现即可，类型定义保持不变。

**Mock 登录账号**（`data/admin-mock.ts` 中 `adminPermissionProfiles`）：
- `admin` / `ChangeMe_Admin_123`：超级管理员（全部权限）
- `audit` / `ChangeMe_Audit_123`：审核管理员
- `operate` / `ChangeMe_Operate_123`：运营专员（仅限清华大学数据）
- `service` / `ChangeMe_Service_123`：客服主管

### 布局与路由

- `layouts/BasicLayout.vue`：主布局，左侧菜单（248px）+ 顶部 header + 内容区，菜单项根据 `menuPaths` 动态过滤
- `config/menu.ts`：菜单树配置，`adminMenus` 数组定义所有一级分组和子菜单
- `router/index.ts`：所有路由均挂载在 `BasicLayout` 下，路由 `meta.menuPath` 用于权限校验

### 新增页面/模块的标准流程

1. 在 `api/contracts.ts` 中定义数据类型
2. 在 `api/modules/` 中新建对应模块文件，实现 API 函数（先返回 mock 数据）
3. 在 `data/admin-mock.ts` 中补充 mock 数据
4. 在 `views/` 对应目录下新建 Vue 页面组件
5. 在 `router/index.ts` 中注册路由（含 `meta.title` 和 `meta.menuPath`）
6. 在 `config/menu.ts` 中添加菜单项

---

## 数据库设计（后端参考）

核心表及关键字段（详见 `管理后台开发需求文档.md`）：

- `schools`：高校基础信息，所有内容均按 `school_id` 隔离
- `users`：小程序用户，含 `school_id`、`verified` 字段
- `user_verifications`：校园认证申请，状态：`pending` / `approved` / `rejected`
- `posts`：帖子，状态：`pending` / `published` / `rejected` / `offline` / `deleted`
- `stores` + `store_applications`：店铺及入驻申请
- `products` + `product_specs` + `product_spec_values`：商品及规格
- `admin_users` + `admin_roles` + `admin_role_menus`：后台权限系统

后端 API 路径约定：小程序端 `/mini/`，管理后台端 `/admin/`（待确认）。
