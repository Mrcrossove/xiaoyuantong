import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";
import { uploadMiniImage } from "../services/mini-upload.service";
import {
  createBannerConfig,
  createHelpCenter,
  createRecommendConfig,
  createSearchWord,
  deleteBannerConfig,
  deleteHelpCenter,
  deleteRecommendConfig,
  deleteSearchWord,
  queryBannerConfigList,
  queryHelpCenterList,
  queryRecommendConfigList,
  querySearchWordList,
  toggleBannerConfigStatus,
  toggleHelpCenterStatus,
  toggleRecommendConfigStatus,
  toggleSearchWordStatus,
  updateBannerConfig,
  updateHelpCenter,
  updateRecommendConfig,
  updateSearchWord
} from "../services/operation-config.service";

export async function listSearchWordAction(req: Request, res: Response) {
  const data = await querySearchWordList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createSearchWordAction(req: Request, res: Response) {
  const data = await createSearchWord(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "搜索热词创建成功");
}

export async function updateSearchWordAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateSearchWord(req.adminAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "搜索热词更新成功");
}

export async function toggleSearchWordStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleSearchWordStatus(req.adminAuth!.userId, id);
  return ok(res, data, req.traceId, "搜索热词状态已更新");
}

export async function deleteSearchWordAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteSearchWord(req.adminAuth!.userId, id);
  return ok(res, { success: true }, req.traceId, "搜索热词删除成功");
}

export async function listHelpCenterAction(req: Request, res: Response) {
  const data = await queryHelpCenterList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createHelpCenterAction(req: Request, res: Response) {
  const data = await createHelpCenter(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "帮助文章创建成功");
}

export async function updateHelpCenterAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateHelpCenter(req.adminAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "帮助文章更新成功");
}

export async function toggleHelpCenterStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleHelpCenterStatus(req.adminAuth!.userId, id);
  return ok(res, data, req.traceId, "帮助文章状态已更新");
}

export async function deleteHelpCenterAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteHelpCenter(req.adminAuth!.userId, id);
  return ok(res, { success: true }, req.traceId, "帮助文章删除成功");
}

export async function listBannerConfigAction(req: Request, res: Response) {
  const data = await queryBannerConfigList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createBannerConfigAction(req: Request, res: Response) {
  const data = await createBannerConfig(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "轮播图创建成功");
}

export async function uploadBannerImageAction(req: Request, res: Response) {
  const data = await uploadMiniImage(req.body);
  return ok(res, data, req.traceId, "轮播图上传成功");
}

export async function updateBannerConfigAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateBannerConfig(req.adminAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "轮播图更新成功");
}

export async function toggleBannerConfigStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleBannerConfigStatus(req.adminAuth!.userId, id);
  return ok(res, data, req.traceId, "轮播图状态已更新");
}

export async function deleteBannerConfigAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteBannerConfig(req.adminAuth!.userId, id);
  return ok(res, { success: true }, req.traceId, "轮播图删除成功");
}

export async function listRecommendConfigAction(req: Request, res: Response) {
  const data = await queryRecommendConfigList(req.adminAuth!.userId, req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function createRecommendConfigAction(req: Request, res: Response) {
  const data = await createRecommendConfig(req.adminAuth!.userId, req.body);
  return ok(res, data, req.traceId, "推荐位创建成功");
}

export async function updateRecommendConfigAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await updateRecommendConfig(req.adminAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "推荐位更新成功");
}

export async function toggleRecommendConfigStatusAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleRecommendConfigStatus(req.adminAuth!.userId, id);
  return ok(res, data, req.traceId, "推荐位状态已更新");
}

export async function deleteRecommendConfigAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await deleteRecommendConfig(req.adminAuth!.userId, id);
  return ok(res, { success: true }, req.traceId, "推荐位删除成功");
}
