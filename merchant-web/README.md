# campus-merchant-web

商家后台前端，技术栈为 `Vue 3 + Vite + Element Plus + Pinia`。

## 本地启动

```bash
npm install
npm run dev
```

推荐环境变量：

```bash
VITE_API_BASE_URL=http://127.0.0.1:3001/api
VITE_APP_BASE=/
```

这样前端请求 `/merchant/*` 时，最终会访问后端标准接口 `/api/merchant/*`。

## 构建发布

### 方案一：独立域名

适合部署到 `https://merchant.your-domain.com/`

```bash
VITE_API_BASE_URL=https://api.your-domain.com/api npm run build
```

此时 `VITE_APP_BASE=/`。

### 方案二：主站子路径

适合部署到 `https://your-domain.com/merchant/`

```bash
VITE_API_BASE_URL=https://your-domain.com/api VITE_APP_BASE=/merchant/ npm run build
```

或直接使用：

```bash
npm run build:subpath
```

## 接口前缀

当前商家后台标准接口前缀为：

```text
/api/merchant/*
/api/merchant/auth/*
```

为兼容旧版本，服务端仍保留了 `/merchant/*` 旧路由别名，但新部署统一建议使用 `/api/merchant/*`。
