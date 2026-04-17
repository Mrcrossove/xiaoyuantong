import type { Request, Response } from "express";
import { getMerchantAuth } from "../middlewares/auth";
import {
  getMerchantSession,
  merchantActivate,
  merchantCodeLogin,
  merchantPasswordLogin,
  merchantSendLoginCode
} from "../services/merchant-auth.service";
import { ok } from "../utils/response";

export async function merchantSendCodeAction(req: Request, res: Response) {
  const data = await merchantSendLoginCode(req.body);
  return ok(res, data, req.traceId, "验证码已发送");
}

export async function merchantCodeLoginAction(req: Request, res: Response) {
  const data = await merchantCodeLogin(req.body);
  return ok(res, data, req.traceId, "登录成功");
}

export async function merchantPasswordLoginAction(req: Request, res: Response) {
  const data = await merchantPasswordLogin(req.body);
  return ok(res, data, req.traceId, "登录成功");
}

export async function merchantActivateAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await merchantActivate(auth.accountId, req.body);
  return ok(res, data, req.traceId, "商家账号已激活");
}

export async function getMerchantSessionAction(req: Request, res: Response) {
  const auth = getMerchantAuth(req);
  const data = await getMerchantSession(auth.accountId);
  return ok(res, data, req.traceId);
}
