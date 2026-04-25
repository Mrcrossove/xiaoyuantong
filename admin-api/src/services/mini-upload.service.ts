import path from "path";
import { uploadImageAsset } from "./file-storage.service";

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

function normalizeScene(scene: string) {
  const normalized = path.posix.normalize(scene || "post").replace(/^\/+/, "");
  if (!normalized || normalized.startsWith("..")) {
    return "post";
  }
  return normalized;
}

export async function uploadMiniImage(payload: { fileName: string; base64: string; scene: string }) {
  const { buffer, mimeType } = parseBase64(payload.base64);
  return uploadImageAsset({
    fileName: payload.fileName,
    mimeType,
    buffer,
    scene: normalizeScene(payload.scene)
  });
}
