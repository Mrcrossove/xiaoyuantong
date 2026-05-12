import { env } from "../config/env";
import { ERROR_CODES } from "../constants/error-codes";
import { ApiError } from "../utils/api-error";
import { buildCosObjectKey, buildCosPublicUrl, buildRelativePath, getCosClient } from "./file-storage.service";

const MAX_DIRECT_UPLOAD_SIZE = 8 * 1024 * 1024;
const DIRECT_UPLOAD_EXPIRES_SECONDS = 10 * 60;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function normalizeScene(scene: string) {
  return ["post", "merchant", "verify", "avatar"].includes(scene) ? scene : "post";
}

function assertCosReady() {
  if (
    !env.tencentCosBucket ||
    !env.tencentCosRegion ||
    !env.tencentCosSecretId ||
    !env.tencentCosSecretKey
  ) {
    throw new ApiError("腾讯云 COS 配置不完整", ERROR_CODES.BAD_REQUEST, 500);
  }
}

export async function createCosDirectUploadTicket(
  userId: number,
  payload: {
    fileName: string;
    mimeType: string;
    size: number;
    scene: string;
  }
) {
  assertCosReady();

  const mimeType = String(payload.mimeType || "image/jpeg").trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ApiError("仅支持 jpg/png/webp/gif 图片", ERROR_CODES.BAD_REQUEST, 400);
  }

  const size = Number(payload.size || 0);
  if (!Number.isFinite(size) || size <= 0) {
    throw new ApiError("图片大小不能为空", ERROR_CODES.BAD_REQUEST, 400);
  }
  if (size > MAX_DIRECT_UPLOAD_SIZE) {
    throw new ApiError("单张图片不能超过 8MB", ERROR_CODES.BAD_REQUEST, 400);
  }

  const scene = normalizeScene(payload.scene);
  const { fileName, relativePath } = buildRelativePath(
    `${scene}/${userId}`,
    payload.fileName,
    mimeType
  );
  const key = buildCosObjectKey(relativePath);
  const uploadUrl = await new Promise<string>((resolve, reject) => {
    getCosClient().getObjectUrl(
      {
        Bucket: env.tencentCosBucket,
        Region: env.tencentCosRegion,
        Key: key,
        Method: "PUT",
        Sign: true,
        Expires: DIRECT_UPLOAD_EXPIRES_SECONDS
      },
      (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(data.Url);
      }
    );
  });

  return {
    provider: "tencent_cos",
    bucket: env.tencentCosBucket,
    region: env.tencentCosRegion,
    key,
    fileName,
    uploadUrl,
    url: buildCosPublicUrl(key),
    method: "PUT",
    expiresIn: DIRECT_UPLOAD_EXPIRES_SECONDS,
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  };
}
