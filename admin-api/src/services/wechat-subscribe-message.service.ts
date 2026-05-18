import { env } from "../config/env";
import { getWechatAccessToken } from "./wechat-mini-code.service";

type SubscribeMessageData = Record<string, { value: string }>;

type SendSubscribeMessageInput = {
  openid?: string | null;
  templateId?: string;
  page?: string;
  data: SubscribeMessageData;
};

export async function sendWechatSubscribeMessage(input: SendSubscribeMessageInput) {
  const templateId = String(input.templateId || "").trim();
  const openid = String(input.openid || "").trim();

  if (!templateId || !openid || env.wechatUseMock || !env.wechatAppId || !env.wechatAppSecret) {
    return { skipped: true };
  }

  const token = await getWechatAccessToken();
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      touser: openid,
      template_id: templateId,
      page: input.page || "pages/index/index",
      data: input.data
    })
  });

  const payload = (await response.json()) as { errcode?: number; errmsg?: string };
  if (!response.ok || payload.errcode) {
    return { skipped: false, ok: false, errmsg: payload.errmsg || "subscribe message failed" };
  }

  return { skipped: false, ok: true };
}

export async function sendTravelPaymentSubscribeMessage(input: {
  openid?: string | null;
  routeTitle: string;
  amount: number;
  deadline?: string;
}) {
  return sendWechatSubscribeMessage({
    openid: input.openid,
    templateId: env.wechatTravelPaymentSubscribeTemplateId,
    page: env.wechatTravelPaymentSubscribePage,
    data: {
      thing1: { value: input.routeTitle.slice(0, 20) },
      thing2: { value: "已成团，请尽快缴费" },
      amount3: { value: `${Number(input.amount || 0).toFixed(2)}元` },
      time4: { value: input.deadline || "请尽快完成" }
    }
  });
}
