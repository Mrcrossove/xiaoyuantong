import type { Request, Response } from "express";
import { ok } from "../utils/response";
import { idParamSchema } from "./schemas";
import {
  createMiniPost,
  createMiniPostComment,
  deleteMiniPost,
  getMiniPostDetail,
  queryMiniPostComments,
  queryMiniPosts,
  queryMyMiniPosts,
  toggleMiniPostLike
} from "../services/mini-post.service";

export async function listMiniPostAction(req: Request, res: Response) {
  const data = await queryMiniPosts(req.query as Record<string, unknown>);
  return ok(res, data, req.traceId);
}

export async function getMiniPostDetailAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await getMiniPostDetail(id, req.miniAuth?.userId);
  return ok(res, data, req.traceId);
}

export async function createMiniPostAction(req: Request, res: Response) {
  const data = await createMiniPost(req.miniAuth!.userId, req.body);
  return ok(res, data, req.traceId, "\u53d1\u5e03\u6210\u529f");
}

export async function listMyMiniPostAction(req: Request, res: Response) {
  const data = await queryMyMiniPosts(req.miniAuth!.userId);
  return ok(res, data, req.traceId);
}

export async function deleteMiniPostAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await deleteMiniPost(req.miniAuth!.userId, id);
  return ok(res, data, req.traceId, "\u5e16\u5b50\u5df2\u5220\u9664");
}

export async function toggleMiniPostLikeAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await toggleMiniPostLike(req.miniAuth!.userId, id);
  return ok(res, data, req.traceId);
}

export async function listMiniPostCommentAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await queryMiniPostComments(id);
  return ok(res, data, req.traceId);
}

export async function createMiniPostCommentAction(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = await createMiniPostComment(req.miniAuth!.userId, id, req.body);
  return ok(res, data, req.traceId, "\u8bc4\u8bba\u6210\u529f");
}
