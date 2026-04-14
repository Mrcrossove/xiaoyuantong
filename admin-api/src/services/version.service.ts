import { readFileSync } from "fs";
import path from "path";
import { env } from "../config/env";

type PackageJson = {
  version?: string;
};

function getPackageVersion() {
  try {
    const filePath = path.resolve(process.cwd(), "package.json");
    const content = readFileSync(filePath, "utf-8");
    const pkg = JSON.parse(content) as PackageJson;
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export function getVersionInfo() {
  const version = getPackageVersion();
  const buildTime = new Date().toISOString().slice(0, 16).replace("T", " ");

  return {
    currentVersion: version,
    env: process.env.NODE_ENV || "development",
    buildTime,
    latestRelease: `v${version}`,
    changelog: [
      {
        version: `v${version}`,
        date: buildTime,
        content: "后台已接入真实登录鉴权、数据概览、高校、用户、认证、店铺、商品、消息、运营和系统配置接口。"
      },
      {
        version: "v0.1.0",
        date: buildTime,
        content: `当前服务地址 ${env.publicBaseUrl}，已具备 Express + Prisma + PostgreSQL 基础骨架。`
      }
    ]
  };
}
