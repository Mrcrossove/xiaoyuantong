import fs from "fs/promises";
import path from "path";
import COS from "cos-nodejs-sdk-v5";
import { env } from "../config/env";
import { ERROR_CODES } from "../constants/error-codes";
import { ApiError } from "../utils/api-error";

export type StorageProvider = "local" | "tencent_cos";

export type UploadImageInput = {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  scene: string;
};

const LONG_CACHE_CONTROL = "public, max-age=31536000, immutable";

let cosClient: COS | null = null;

function getCosClient() {
  if (cosClient) {
    return cosClient;
  }

  cosClient = new COS({
    SecretId: env.tencentCosSecretId,
    SecretKey: env.tencentCosSecretKey
  });
  return cosClient;
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function joinUrl(baseUrl: string, pathname: string) {
  return `${normalizeBaseUrl(baseUrl)}/${pathname.replace(/^\/+/, "")}`;
}

function safeExt(fileName: string, mimeType: string) {
  const ext = path.extname(fileName || "").toLowerCase();
  if (ext && [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
    return ext;
  }

  const mimeExtMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif"
  };
  return mimeExtMap[mimeType] || ".jpg";
}

function buildRelativePath(scene: string, fileName: string, mimeType: string) {
  const dateFolder = new Date().toISOString().slice(0, 10);
  const ext = safeExt(fileName, mimeType);
  const generatedName = `${Date.now()}_${Math.floor(Math.random() * 100000)}${ext}`;
  return {
    fileName: generatedName,
    relativePath: path.posix.join(scene, dateFolder, generatedName)
  };
}

function buildLocalPublicUrl(relativePath: string) {
  const baseUrl = env.uploadPublicBaseUrl || joinUrl(env.publicBaseUrl, "/uploads");
  return joinUrl(baseUrl, relativePath);
}

function buildCosObjectKey(relativePath: string) {
  const prefix = env.tencentCosPathPrefix.trim().replace(/^\/+|\/+$/g, "");
  return prefix ? path.posix.join(prefix, relativePath) : relativePath;
}

function buildCosPublicUrl(objectKey: string) {
  if (env.tencentCosPublicBaseUrl) {
    return joinUrl(env.tencentCosPublicBaseUrl, objectKey);
  }

  return `https://${env.tencentCosBucket}.cos.${env.tencentCosRegion}.myqcloud.com/${objectKey}`;
}

async function uploadToLocal(input: UploadImageInput) {
  const { fileName, relativePath } = buildRelativePath(input.scene, input.fileName, input.mimeType);
  const targetPath = path.resolve(env.uploadsDir, relativePath);

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, input.buffer);

  return {
    fileName,
    url: buildLocalPublicUrl(relativePath),
    size: input.buffer.length,
    storageKey: relativePath,
    provider: "local" as StorageProvider
  };
}

async function uploadToTencentCos(input: UploadImageInput) {
  const { fileName, relativePath } = buildRelativePath(input.scene, input.fileName, input.mimeType);
  const objectKey = buildCosObjectKey(relativePath);

  await getCosClient().putObject({
    Bucket: env.tencentCosBucket,
    Region: env.tencentCosRegion,
    Key: objectKey,
    Body: input.buffer,
    ContentType: input.mimeType,
    CacheControl: LONG_CACHE_CONTROL
  });

  return {
    fileName,
    url: buildCosPublicUrl(objectKey),
    size: input.buffer.length,
    storageKey: objectKey,
    provider: "tencent_cos" as StorageProvider
  };
}

export async function uploadImageAsset(input: UploadImageInput) {
  if (!input.buffer.length) {
    throw new ApiError("图片内容不能为空", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (input.buffer.length > 8 * 1024 * 1024) {
    throw new ApiError("单张图片不能超过 8MB", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (env.uploadStorageProvider === "tencent_cos") {
    if (!env.tencentCosBucket || !env.tencentCosRegion || !env.tencentCosSecretId || !env.tencentCosSecretKey) {
      throw new ApiError("腾讯云 COS 配置不完整", ERROR_CODES.BAD_REQUEST, 500);
    }
    return uploadToTencentCos(input);
  }

  return uploadToLocal(input);
}
