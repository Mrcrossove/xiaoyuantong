# campus-admin-api

`admin-api` 是校园通当前的后台接口服务，技术栈为 `Express + TypeScript + Prisma + PostgreSQL`。

当前已实现：

- 内容管理接口：`/school/content`、`/user/publish`、`/product/spec`
- 后台登录接口：`/auth/admin/login`
- 小程序匿名登录接口：`/auth/mini/login`
- 小程序帖子接口：
  - `GET /mini/post/list`
  - `GET /mini/post/detail/:id`
  - `GET /mini/post/my`
  - `POST /mini/post`
- 校园认证接口：
  - 小程序：`/verify/mini/current`、`/verify/mini/submit`
  - 后台：`/verify/admin/list`、`/verify/admin/:id/review`

## 1. 安装依赖

```bash
npm install
```

## 2. 配置环境变量

复制 `.env.example` 为 `.env`，然后按你的数据库配置修改：

```bash
PORT=3001
APP_SECRET="campus-admin-secret"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/campus_admin?schema=public"
```

## 3. 初始化 Prisma

首次启动前执行：

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

## 4. 启动服务

开发模式：

```bash
npm run dev
```

生产构建：

```bash
npm run build
npm run start
```

## 5. 统一响应结构

```json
{
  "code": 0,
  "message": "成功",
  "data": {},
  "traceId": "uuid"
}
```

## 6. 默认演示账号

- 超级管理员：`admin / JP@admin`
- 审核管理员：`audit / JP@audit`
- 运营专员：`operate / JP@operate`

## 7. 注意事项

- 当前小程序认证页已接入真实接口，但在后端未启动时会回退到本地演示数据。
- 你后续把 PostgreSQL 部署到云服务器后，只需要更新 `.env` 的 `DATABASE_URL`，不需要再改页面代码。
