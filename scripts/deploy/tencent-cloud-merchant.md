# 腾讯云商家系统部署说明

## 目录约定

```text
/data/www/xiaoyuantong/
  ├─ admin-api/
  ├─ admin-web/
  ├─ merchant-web/
  └─ scripts/
```

## 一次性准备

```bash
sudo apt update
sudo apt install -y nginx git
sudo npm install -g pm2
```

## 拉取代码

```bash
cd /data/www
git clone https://github.com/Mrcrossove/xiaoyuantong.git
cd /data/www/xiaoyuantong
```

## 后端安装与构建

```bash
cd /data/www/xiaoyuantong/admin-api
npm install
npm run prisma:generate
npm run build
```

## 后台前端构建

```bash
cd /data/www/xiaoyuantong/admin-web
npm install
npm run build
```

## 商家前端构建

```bash
cd /data/www/xiaoyuantong/merchant-web
npm install
VITE_API_BASE_URL=http://118.24.104.69/api VITE_APP_BASE=/merchant/ npm run build
```

## PM2 启动

```bash
cd /data/www/xiaoyuantong
pm2 start ./scripts/pm2/campus-admin-api.config.cjs
pm2 save
pm2 startup
```

## Nginx 配置

```bash
sudo cp /data/www/xiaoyuantong/scripts/nginx/xiaoyuantong-tencent.conf /etc/nginx/sites-available/xiaoyuantong.conf
sudo ln -sf /etc/nginx/sites-available/xiaoyuantong.conf /etc/nginx/sites-enabled/xiaoyuantong.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 更新发布

```bash
cd /data/www/xiaoyuantong
git pull origin main

cd /data/www/xiaoyuantong/admin-api
npm install
npm run prisma:generate
npm run build
pm2 restart campus-admin-api

cd /data/www/xiaoyuantong/admin-web
npm install
npm run build

cd /data/www/xiaoyuantong/merchant-web
npm install
VITE_API_BASE_URL=http://118.24.104.69/api VITE_APP_BASE=/merchant/ npm run build

sudo nginx -t
sudo systemctl reload nginx
```
