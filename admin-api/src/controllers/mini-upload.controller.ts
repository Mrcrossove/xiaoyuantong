import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { uploadMiniImage } from "../services/mini-upload.service";
import type { MiniUploadImagePayload } from "./schemas";

export async function uploadMiniImageAction(req: Request, res: Response) {
  const data = await uploadMiniImage(req.body as MiniUploadImagePayload);
  return ok(res, data, req.traceId, "上传成功");
}
