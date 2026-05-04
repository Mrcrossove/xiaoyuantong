import { z } from "zod";

const requiredText = (label: string) => z.string().trim().min(1, `${label}不能为空`);
const storeLatitudeSchema = z.number().min(-90).max(90).nullable().optional();
const storeLongitudeSchema = z.number().min(-180).max(180).nullable().optional();

const miniOrderItemSchema = z.object({
  productId: z.string().trim().min(1, "商品 ID 不能为空"),
  skuId: z.string().trim().optional().default(""),
  quantity: z.number().int().min(1).max(99).optional().default(1)
});

export const miniOrderCreateSchema = z.object({
  school: requiredText("学校"),
  storeDetailId: requiredText("店铺 ID"),
  productId: z.string().trim().optional().default(""),
  skuId: z.string().trim().optional().default(""),
  quantity: z.number().int().min(1).max(99).optional().default(1),
  items: z.array(miniOrderItemSchema).min(1).max(50).optional().default([]),
  addressId: z.number().int().positive().optional(),
  remark: z.string().trim().max(100, "备注最多 100 个字").optional().default("")
});

export const miniRefundApplySchema = z.object({
  reason: z.string().trim().min(2, "退款原因至少 2 个字").max(80, "退款原因最多 80 个字")
});

export const miniMessageReadAllSchema = z.object({
  type: z.enum(["system", "interactive"]).optional()
});

export const miniMerchantStoreUpdateSchema = z.object({
  name: z.string().trim().min(2, "店铺名称至少 2 个字").max(30, "店铺名称最多 30 个字"),
  subtitle: z.string().trim().min(2, "店铺副标题至少 2 个字").max(40, "店铺副标题最多 40 个字"),
  notice: z.string().trim().min(5, "店铺公告至少 5 个字").max(120, "店铺公告最多 120 个字"),
  phone: z.string().trim().min(6, "联系电话至少 6 位").max(20, "联系电话最多 20 位"),
  address: z.string().trim().min(5, "店铺地址至少 5 个字").max(100, "店铺地址最多 100 个字"),
  latitude: storeLatitudeSchema,
  longitude: storeLongitudeSchema,
  locationName: z.string().trim().max(60, "定位名称最多 60 个字").optional().default(""),
  locationAddress: z.string().trim().max(120, "定位地址最多 120 个字").optional().default(""),
  cover: z.string().trim().optional().default(""),
  tags: z.array(z.string().trim().min(1).max(8)).max(6).optional().default([]),
  banners: z.array(z.string().trim()).max(5, "店铺轮播图最多 5 张").optional().default([])
});

const detailItemSchema = z.object({
  label: z.string().trim().min(1, "详情项名称不能为空").max(20, "详情项名称最多 20 个字"),
  value: z.string().trim().min(1, "详情项内容不能为空").max(120, "详情项内容最多 120 个字")
});

const productSkuSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(1, "规格名称不能为空").max(30, "规格名称最多 30 个字"),
  price: z.string().trim().min(1, "请输入规格价格"),
  stock: z.number().int().min(0).max(99999).optional().default(0),
  dailyLimit: z.number().int().min(0).max(9999).optional().default(0),
  status: z.enum(["已上架", "已下架"]).optional().default("已上架"),
  isDefault: z.boolean().optional().default(false)
});

export const miniMerchantProductSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  name: z.string().trim().min(2, "商品名称至少 2 个字").max(30, "商品名称最多 30 个字"),
  desc: z.string().trim().min(2, "商品描述至少 2 个字").max(60, "商品描述最多 60 个字"),
  detailTitle: z.string().trim().max(30, "详情标题最多 30 个字").optional().default(""),
  detailText: z.string().trim().max(1200, "详情内容最多 1200 个字").optional().default(""),
  detailItems: z.array(detailItemSchema).max(20, "详情项最多 20 条").optional().default([]),
  specMode: z.enum(["single", "multi"]).optional().default("single"),
  price: z.string().trim().min(1, "请输入商品价格"),
  cover: z.string().trim().optional().default("poster"),
  stock: z.number().int().min(0).max(99999).optional().default(0),
  dailyLimit: z.number().int().min(0).max(9999).optional().default(0),
  recommended: z.boolean().optional().default(false),
  status: z.enum(["已上架", "已下架"]).optional().default("已上架"),
  skus: z.array(productSkuSchema).optional().default([])
});

export const adminProductMutationControlSchema = z.object({
  expectedUpdatedAt: z.string().trim().optional().default(""),
  conflictStrategy: z.enum(["reject", "force", "submit_for_approval"]).optional().default("reject"),
  conflictReason: z.string().trim().max(200, "审批原因最多 200 个字").optional().default("")
});

export const adminStoreProductMutationSchema = miniMerchantProductSchema.merge(adminProductMutationControlSchema);
export const adminStoreProductConflictSchema = adminProductMutationControlSchema;

export const storeProductApprovalReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().trim().max(200, "审核备注最多 200 个字").optional().default("")
});

export const miniMerchantMoveSchema = z.object({
  direction: z.enum(["up", "down"])
});

export const miniMerchantProductCategorySchema = z.object({
  name: z.string().trim().min(2, "分类至少 2 个字").max(10, "分类最多 10 个字")
});

export const miniMerchantBatchIdsSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, "至少选择一个商品")
});

export const miniUploadImageSchema = z.object({
  fileName: requiredText("文件名"),
  base64: requiredText("图片内容"),
  scene: z.enum(["post", "merchant", "verify"]).optional().default("post")
});

export const miniWithdrawCreateSchema = z.object({
  amount: z.number().positive("提现金额必须大于 0"),
  accountType: z.string().trim().optional().default("微信零钱"),
  accountNo: z.string().trim().min(4, "请输入提现账户").max(40, "提现账户最多 40 个字"),
  remark: z.string().trim().max(100, "备注最多 100 个字").optional().default("")
});

export const refundReviewSchema = z.object({
  status: z.enum(["已通过", "已驳回"]),
  reviewNote: z.string().trim().max(100, "审核备注最多 100 个字").optional().default("")
});

export type MiniOrderCreatePayload = z.infer<typeof miniOrderCreateSchema>;
export type MiniRefundApplyPayload = z.infer<typeof miniRefundApplySchema>;
export type MiniMessageReadAllPayload = z.infer<typeof miniMessageReadAllSchema>;
export type MiniMerchantStoreUpdatePayload = z.infer<typeof miniMerchantStoreUpdateSchema>;
export type MiniMerchantProductPayload = z.infer<typeof miniMerchantProductSchema>;
export type MiniMerchantProductCategoryPayload = z.infer<typeof miniMerchantProductCategorySchema>;
export type AdminStoreProductMutationPayload = z.infer<typeof adminStoreProductMutationSchema>;
export type AdminStoreProductConflictPayload = z.infer<typeof adminStoreProductConflictSchema>;
export type MiniMerchantMovePayload = z.infer<typeof miniMerchantMoveSchema>;
export type MiniMerchantBatchIdsPayload = z.infer<typeof miniMerchantBatchIdsSchema>;
export type MiniUploadImagePayload = z.infer<typeof miniUploadImageSchema>;
export type MiniWithdrawCreatePayload = z.infer<typeof miniWithdrawCreateSchema>;
export type RefundReviewPayload = z.infer<typeof refundReviewSchema>;
export type StoreProductApprovalReviewPayload = z.infer<typeof storeProductApprovalReviewSchema>;
