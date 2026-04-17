import { Router } from "express";
import {
  getMerchantSessionAction,
  merchantActivateAction,
  merchantCodeLoginAction,
  merchantPasswordLoginAction,
  merchantSendCodeAction
} from "../controllers/merchant-auth.controller";
import {
  merchantActivateSchema,
  merchantCodeLoginSchema,
  merchantPasswordLoginSchema,
  merchantSendCodeSchema
} from "../controllers/merchant-schemas";
import { asyncHandler } from "../middlewares/async-handler";
import { requireMerchantAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";

const router = Router();

router.post("/send-code", validateBody(merchantSendCodeSchema), asyncHandler(merchantSendCodeAction));
router.post("/code-login", validateBody(merchantCodeLoginSchema), asyncHandler(merchantCodeLoginAction));
router.post("/password-login", validateBody(merchantPasswordLoginSchema), asyncHandler(merchantPasswordLoginAction));
router.post("/activate", requireMerchantAuth, validateBody(merchantActivateSchema), asyncHandler(merchantActivateAction));
router.get("/session", requireMerchantAuth, asyncHandler(getMerchantSessionAction));

export default router;
