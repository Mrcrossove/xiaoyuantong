import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";

const hitCache = new Map<string, number[]>();

type RiskScene = "post_create" | "post_comment" | "shop_apply" | "merchant_store" | "merchant_product" | "verify_submit";

type RiskCheckOptions = {
  userId?: number;
  scene: RiskScene;
  texts: Array<string | null | undefined>;
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function buildRateKey(userId: number, scene: RiskScene) {
  return `${scene}:${userId}`;
}

function checkRateLimit(userId: number | undefined, scene: RiskScene) {
  if (!userId) return [];

  const limit =
    scene === "post_comment" ? env.riskCommentLimitPerMinute : scene === "post_create" ? env.riskPostLimitPerMinute : 30;
  const now = Date.now();
  const threshold = now - 60 * 1000;
  const key = buildRateKey(userId, scene);
  const history = (hitCache.get(key) || []).filter((time) => time >= threshold);
  history.push(now);
  hitCache.set(key, history);

  if (history.length > limit) {
    return [`频率限制:${limit}/分钟`];
  }

  return [];
}

function checkKeywordRisk(texts: string[]) {
  const hits: string[] = [];
  const merged = normalizeText(texts.join(" "));

  for (const keyword of env.riskKeywords) {
    if (merged.includes(normalizeText(keyword))) {
      hits.push(`敏感词:${keyword}`);
    }
  }

  if (/((vx|v信|微信|wx)[\s:：]?[a-z0-9_-]{4,})/i.test(merged)) {
    hits.push("疑似微信导流");
  }
  if (/(q[q群号号码:：]?\d{5,})/i.test(merged)) {
    hits.push("疑似 QQ 导流");
  }
  if (/((返利|刷单|代考|裸聊|赌博|私彩))/i.test(merged)) {
    hits.push("疑似高风险内容");
  }

  return hits;
}

async function saveRiskEvent(options: {
  userId?: number;
  scene: RiskScene;
  action: string;
  level: string;
  content: string;
  hitRules: string[];
  decision: string;
}) {
  try {
    await prisma.miniRiskEvent.create({
      data: {
        userId: options.userId,
        scene: options.scene,
        action: options.action,
        level: options.level,
        content: options.content.slice(0, 500),
        hitRules: options.hitRules,
        decision: options.decision
      }
    });
  } catch {
    // risk logging should not break business flow
  }
}

export async function assertRiskPassed(options: RiskCheckOptions) {
  if (!env.riskUseMock) {
    return;
  }

  const texts = options.texts.map((item) => String(item || "").trim()).filter(Boolean);
  const hitRules = [...checkRateLimit(options.userId, options.scene), ...checkKeywordRisk(texts)];

  if (!hitRules.length) {
    return;
  }

  await saveRiskEvent({
    userId: options.userId,
    scene: options.scene,
    action: "block",
    level: "medium",
    content: texts.join(" | "),
    hitRules,
    decision: "reject"
  });

  throw new ApiError("内容包含敏感信息，请修改后重试", ERROR_CODES.BAD_REQUEST, 400);
}
