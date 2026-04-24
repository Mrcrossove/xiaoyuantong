import { Router } from "express";
import { wechatPayNotifyAction, wechatRefundNotifyAction, wechatTransferNotifyAction } from "../controllers/wechat-pay.controller";
import { asyncHandler } from "../middlewares/async-handler";

const router = Router();

router.post("/notify", asyncHandler(wechatPayNotifyAction));
router.post("/refund-notify", asyncHandler(wechatRefundNotifyAction));
router.post("/transfer-notify", asyncHandler(wechatTransferNotifyAction));

export default router;
