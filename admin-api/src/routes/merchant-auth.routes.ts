import { Router } from "express";
import {
  getMerchantSessionAction,
  merchantCodeLoginAction,
  merchantPasswordLoginAction,
  merchantSendCodeAction
} from "../controllers/merchant-auth.controller";
import {
  merchantCodeLoginSchema,
  merchantPasswordLoginSchema,
  merchantSendCodeSchema
} from "../controllers/merchant-schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireMerchantAuth } from "../middlewares/auth";
import { buildPhoneAndIpKey, createRateLimit } from "../middlewares/rate-limit";
import { validateBody } from "../middlewares/validate";
import { env } from "../config/env";

const router = Router();

router.post(
  "/send-code",
  validateBody(merchantSendCodeSchema),
  createRateLimit({
    namespace: "merchant-send-code-cooldown",
    windowMs: env.merchantSendCodeCooldownMs,
    max: 1,
    keyBuilder: buildPhoneAndIpKey,
    message: "验证码发送过于频繁，请稍后再试"
  }),
  createRateLimit({
    namespace: "merchant-send-code-window",
    windowMs: env.merchantSendCodeWindowMs,
    max: env.merchantSendCodeMaxAttempts,
    keyBuilder: buildPhoneAndIpKey,
    message: "验证码发送次数过多，请稍后再试"
  }),
  asyncHandler(merchantSendCodeAction)
);
router.post(
  "/code-login",
  validateBody(merchantCodeLoginSchema),
  createRateLimit({
    namespace: "merchant-code-login",
    windowMs: env.merchantLoginWindowMs,
    max: env.merchantLoginMaxAttempts,
    keyBuilder: buildPhoneAndIpKey,
    message: "验证码登录尝试过于频繁，请稍后再试"
  }),
  asyncHandler(merchantCodeLoginAction)
);
router.post(
  "/password-login",
  validateBody(merchantPasswordLoginSchema),
  createRateLimit({
    namespace: "merchant-password-login",
    windowMs: env.merchantLoginWindowMs,
    max: env.merchantLoginMaxAttempts,
    keyBuilder: buildPhoneAndIpKey,
    message: "登录尝试过于频繁，请稍后再试"
  }),
  asyncHandler(merchantPasswordLoginAction)
);
router.get("/session", requireMerchantAuth, asyncHandler(getMerchantSessionAction));

export default router;
