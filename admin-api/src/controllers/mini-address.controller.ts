import type { Request, Response } from "express";
import { ok } from "../utils/response";
import {
  createMiniAddress,
  deleteMiniAddress,
  queryMiniAddressList,
  setMiniAddressDefault,
  updateMiniAddress
} from "../services/mini-address.service";
import type { MiniAddressPayload } from "./schemas";

export async function listMiniAddressAction(req: Request, res: Response) {
  const data = await queryMiniAddressList(req.miniAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function createMiniAddressAction(req: Request, res: Response) {
  const data = await createMiniAddress(req.miniAuth!.userId, req.body as MiniAddressPayload);
  return ok(res, data, req.traceId);
}

export async function updateMiniAddressAction(req: Request, res: Response) {
  const data = await updateMiniAddress(req.miniAuth!.userId, Number(req.params.id), req.body as MiniAddressPayload);
  return ok(res, data, req.traceId);
}

export async function deleteMiniAddressAction(req: Request, res: Response) {
  const data = await deleteMiniAddress(req.miniAuth!.userId, Number(req.params.id));
  return ok(res, data, req.traceId);
}

export async function setMiniAddressDefaultAction(req: Request, res: Response) {
  const data = await setMiniAddressDefault(req.miniAuth!.userId, Number(req.params.id));
  return ok(res, data, req.traceId);
}
