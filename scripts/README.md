# 联调脚本

## 1. 一键启动前后端联调

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-admin-link.ps1
```

行为：

- 启动 `admin-api`：`npm run dev`
- 启动 `admin-web`：`npm run dev:realapi`

## 2. 检查 3 组接口是否联通

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-3-apis.ps1
```

可传自定义后端地址：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-3-apis.ps1 -BaseUrl "http://127.0.0.1:3001"
```

## 3. 腾讯云 Nginx 配置模板

商家后台和管理后台合并部署的 Nginx 示例见：

```text
scripts/nginx/xiaoyuantong-tencent.conf
```
