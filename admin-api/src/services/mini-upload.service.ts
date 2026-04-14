import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";
import type { MiniUploadImagePayload } from "../controllers/schemas";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";

const MIME_EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

function parseBase64(raw: string) {
  const matched = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (matched) {
    return {
      mimeType: matched[1],
      buffer: Buffer.from(matched[2], "base64")
    };
  }

  return {
    mimeType: "image/jpeg",
    buffer: Buffer.from(raw, "base64")
  };
}

function safeExt(fileName: string, mimeType: string) {
  const ext = path.extname(fileName || "").toLowerCase();
  if (ext && [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
    return ext;
  }
  return MIME_EXT_MAP[mimeType] || ".jpg";
}

export async function uploadMiniImage(payload: MiniUploadImagePayload) {
  const { buffer, mimeType } = parseBase64(payload.base64);

  if (!buffer.length) {
    throw new ApiError("图片内容不能为空", ERROR_CODES.BAD_REQUEST, 400);
  }
  if (buffer.length > 8 * 1024 * 1024) {
    throw new ApiError("单张图片不能超过 8MB", ERROR_CODES.BAD_REQUEST, 400);
  }

  const dateFolder = new Date().toISOString().slice(0, 10);
  const ext = safeExt(payload.fileName, mimeType);
  const fileName = `${Date.now()}_${Math.floor(Math.random() * 100000)}${ext}`;
  const relativePath = path.posix.join(payload.scene, dateFolder, fileName);
  const targetPath = path.resolve(env.uploadsDir, relativePath);

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, buffer);

  return {
    fileName,
    url: `${env.publicBaseUrl}/uploads/${relativePath.replace(/\\/g, "/")}`,
    size: buffer.length
  };
}
