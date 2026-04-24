import type { Request, Response } from "express";
import { handleWechatPayNotify, handleWechatRefundNotify, handleWechatTransferNotify } from "../services/wechat-pay-notify.service";

function getNotifyHeaders(req: Request) {
  return {
    timestamp: String(req.headers["wechatpay-timestamp"] || ""),
    nonce: String(req.headers["wechatpay-nonce"] || ""),
    signature: String(req.headers["wechatpay-signature"] || "")
  };
}

function success(res: Response) {
  return res.status(200).json({
    code: "SUCCESS",
    message: "成功"
  });
}

export async function wechatPayNotifyAction(req: Request, res: Response) {
  await handleWechatPayNotify(req.rawBody || JSON.stringify(req.body || {}), getNotifyHeaders(req));
  return success(res);
}

export async function wechatRefundNotifyAction(req: Request, res: Response) {
  await handleWechatRefundNotify(req.rawBody || JSON.stringify(req.body || {}), getNotifyHeaders(req));
  return success(res);
}

export async function wechatTransferNotifyAction(req: Request, res: Response) {
  await handleWechatTransferNotify(req.rawBody || JSON.stringify(req.body || {}), getNotifyHeaders(req));
  return success(res);
}
