# campus-admin-api

`admin-api` 是校院通当前的后台接口服务，技术栈为 `Express + TypeScript + Prisma + PostgreSQL`。

当前已实现：

- 内容管理接口：`/school/content`、`/user/publish`、`/product/spec`
- 后台登录接口：`/auth/admin/login`
- 小程序登录接口：`/auth/mini/login`
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

复制 `.env.example` 为 `.env`，然后按你的实际环境修改配置：

```bash
PORT=3001
APP_SECRET="replace-with-production-secret"
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

## 6. 初始账号说明

- 初始化管理员账号由 `prisma/seed.ts` 创建
- 种子密码仅用于本地初始化与联调
- 上线前必须立即替换所有初始化密码
- 生产环境不得保留任何默认账号口令

## 7. 注意事项

- 小程序登录、支付、短信、风控默认配置仍需按生产参数补齐
- `PUBLIC_BASE_URL` 在生产环境必须使用正式 `https` 域名
- `APP_SECRET` 在生产环境必须替换为高强度随机密钥
