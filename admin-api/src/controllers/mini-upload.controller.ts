import type { Request, Response } from "express";
import { createCosDirectUploadTicket } from "../services/cos-direct-upload.service";
import { uploadMiniImage } from "../services/mini-upload.service";
import { ok } from "../utils/response";
import type { MiniCosDirectUploadPayload, MiniUploadImagePayload } from "./schemas";

export async function uploadMiniImageAction(req: Request, res: Response) {
  const data = await uploadMiniImage(req.body as MiniUploadImagePayload);
  return ok(res, data, req.traceId, "upload success");
}

export async function createCosDirectUploadTicketAction(req: Request, res: Response) {
  const data = await createCosDirectUploadTicket(req.miniAuth!.userId, req.body as MiniCosDirectUploadPayload);
  return ok(res, data, req.traceId, "COS upload ticket generated");
}
