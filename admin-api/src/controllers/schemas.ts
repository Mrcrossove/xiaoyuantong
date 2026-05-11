import { z } from "zod";

const requiredText = (label: string) => z.string().trim().min(1, `${label}不能为空`);

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("id 必须为正整数")
});

export const batchIdsSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, "ids 至少传 1 项")
});

export const batchStatusSchema = batchIdsSchema.extend({
  status: requiredText("状态")
});

export const adminLoginSchema = z.object({
  account: requiredText("账号"),
  password: requiredText("密码")
});

export const adminActivateSchema = z.object({
  password: z.string().trim().min(6, "新密码至少 6 个字符").max(30, "新密码最多 30 个字符")
});

export const adminPasswordUpdateSchema = z.object({
  oldPassword: z.string().trim().min(1, "请输入原密码").optional(),
  newPassword: z.string().trim().min(6, "新密码至少 6 个字符").max(30, "新密码最多 30 个字符")
});

export const miniLoginSchema = z.object({
  code: requiredText("微信登录 code"),
  referralScene: z.string().trim().max(64, "referralScene max length is 64").optional().default("")
});

export const miniProfileUpdateSchema = z.object({
  nickname: z.string().trim().min(1, "昵称不能为空").max(20, "昵称最多 20 个字"),
  avatarUrl: z.string().trim().max(500, "头像地址过长").optional().default("")
});

export const verifySubmitSchema = z.object({
  name: requiredText("姓名"),
  phone: z.string().trim().regex(/^1\d{10}$/, "请输入正确的手机号"),
  school: requiredText("学校")
});

export const verifyReviewSchema = z.object({
  status: z.enum(["已通过", "已驳回"]),
  reviewNote: z.string().trim().max(100, "审核备注最多 100 个字").optional().default("")
});

export const miniPostPayloadSchema = z.object({
  school: requiredText("学校"),
  primaryCategory: z.string().trim().max(20, "一级分类最多 20 个字").optional().default(""),
  category: requiredText("分类"),
  title: z.string().trim().min(2, "标题至少 2 个字").max(30, "标题最多 30 个字"),
  content: z.string().trim().min(5, "内容至少 5 个字").max(500, "内容最多 500 个字"),
  displayName: z.string().trim().max(16, "展示昵称最多 16 个字").optional().default(""),
  images: z.array(z.string().trim()).max(9, "最多 9 张图片").optional().default([]),
  contacts: z
    .array(
      z.object({
        label: requiredText("联系方式标题"),
        value: requiredText("联系方式内容")
      })
    )
    .max(3, "最多 3 条联系方式")
    .optional()
    .default([]),
  anonymous: z.boolean().optional().default(false),
  onlyCampus: z.boolean().optional().default(true)
});

export const miniShopApplySchema = z.object({
  school: requiredText("学校"),
  storeName: z.string().trim().min(2, "店铺名称至少 2 个字").max(30, "店铺名称最多 30 个字"),
  category: requiredText("经营分类"),
  contactName: requiredText("联系人"),
  contactPhone: z.string().trim().regex(/^1\d{10}$/, "请输入正确的手机号"),
  description: z.string().trim().min(5, "经营说明至少 5 个字").max(300, "经营说明最多 300 个字"),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  locationName: z.string().trim().max(60, "定位名称最多 60 个字").optional().default(""),
  locationAddress: z.string().trim().max(120, "定位地址最多 120 个字").optional().default("")
});

export const miniShopApplyReviewSchema = z.object({
  status: z.enum(["已通过", "已驳回"]),
  reviewNote: z.string().trim().max(100, "审核备注最多 100 个字").optional().default("")
});

export const schoolAdminApplicationSchema = z.object({
  school: requiredText("学校"),
  teamSize: z.number().int().min(1, "团队人数至少 1 人").max(500, "团队人数不能超过 500 人"),
  contact: z.string().trim().min(5, "联系方式至少 5 个字").max(50, "联系方式最多 50 个字")
});

export const schoolAdminApplicationReviewSchema = z.object({
  status: z.enum(["待处理", "已联系", "已拒绝", "已关闭"]),
  reviewNote: z.string().trim().max(100, "处理备注最多 100 个字").optional().default("")
});

export const schoolAdminApplicationAssignSchema = z.object({
  account: z
    .string()
    .trim()
    .min(4, "账号至少 4 个字符")
    .max(30, "账号最多 30 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "账号仅支持字母、数字和下划线"),
  name: z.string().trim().min(2, "姓名至少 2 个字符").max(20, "姓名最多 20 个字符"),
  reviewNote: z.string().trim().max(100, "分配备注最多 100 个字").optional().default("")
});

export const miniFavoriteToggleSchema = z.object({
  targetType: z.enum(["post", "store"]),
  targetId: requiredText("目标 id"),
  school: requiredText("学校")
});

export const miniAddressPayloadSchema = z.object({
  school: requiredText("学校"),
  receiverName: z.string().trim().min(2, "收货人至少 2 个字").max(20, "收货人最多 20 个字"),
  phone: z.string().trim().regex(/^1\d{10}$/, "请输入正确的手机号"),
  detail: z.string().trim().min(5, "详细地址至少 5 个字").max(100, "详细地址最多 100 个字"),
  tag: z.string().trim().min(2, "地址标签至少 2 个字").max(10, "地址标签最多 10 个字"),
  isDefault: z.boolean().optional().default(false)
});

export const miniOrderCreateSchema = z.object({
  school: requiredText("学校"),
  storeDetailId: requiredText("店铺 ID"),
  productId: requiredText("商品 ID"),
  quantity: z.number().int().min(1).max(99).optional().default(1),
  addressId: z.number().int().positive().optional(),
  remark: z.string().trim().max(100, "备注最多 100 个字").optional().default("")
});

export const miniWithdrawCreateSchema = z.object({
  amount: z.number().positive("提现金额必须大于 0"),
  accountType: z.string().trim().optional().default("微信零钱"),
  accountNo: z.string().trim().min(4, "请输入提现账户").max(40, "提现账户最多 40 个字"),
  remark: z.string().trim().max(100, "备注最多 100 个字").optional().default("")
});

export const miniWithdrawReviewSchema = z.object({
  status: z.enum(["已通过", "已驳回"]),
  reviewNote: z.string().trim().max(100, "审核备注最多 100 个字").optional().default("")
});

export const miniPostCommentCreateSchema = z.object({
  content: z.string().trim().min(1, "评论内容不能为空").max(200, "评论内容最多 200 个字")
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
  cover: z.string().trim().optional().default(""),
  banners: z.array(z.string().trim()).max(5, "店铺轮播图最多 5 张").optional().default([])
});

export const miniMerchantProductSchema = z.object({
  name: z.string().trim().min(2, "商品名称至少 2 个字").max(30, "商品名称最多 30 个字"),
  desc: z.string().trim().min(2, "商品描述至少 2 个字").max(60, "商品描述最多 60 个字"),
  price: z.string().trim().min(1, "请输入商品价格"),
  cover: z.string().trim().optional().default("poster"),
  stock: z.number().int().min(0).max(99999).optional().default(0),
  dailyLimit: z.number().int().min(0).max(9999).optional().default(0),
  recommended: z.boolean().optional().default(false),
  status: z.enum(["已上架", "已下架"]).optional().default("已上架")
});

export const miniMerchantMoveSchema = z.object({
  direction: z.enum(["up", "down"])
});

export const miniMerchantBatchIdsSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1, "至少选择一个商品")
});

export const miniUploadImageSchema = z.object({
  fileName: requiredText("文件名"),
  base64: requiredText("图片内容"),
  scene: z.enum(["post", "merchant", "verify", "avatar"]).optional().default("post")
});

export const schoolContentPayloadSchema = z.object({
  school: requiredText("高校"),
  userCount: z.number().int().min(0),
  postCount: z.number().int().min(0),
  storeCount: z.number().int().min(0),
  orderCount: z.number().int().min(0),
  gmv: z.number().min(0),
  verifyPassRate: z.string().regex(/^\d{1,3}(\.\d{1,2})?%$/, "认证通过率格式错误"),
  status: requiredText("状态")
});

export const userPublishPayloadSchema = z.object({
  school: requiredText("高校"),
  user: requiredText("用户"),
  type: requiredText("类型"),
  title: requiredText("标题"),
  status: requiredText("状态")
});

export const productSpecPayloadSchema = z.object({
  school: requiredText("高校"),
  storeName: requiredText("店铺"),
  productName: requiredText("商品"),
  specGroup: requiredText("规格组"),
  specValue: requiredText("规格值"),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  status: requiredText("状态")
});

export const adminCategoryPayloadSchema = z.object({
  school: requiredText("高校"),
  name: z.string().trim().min(2, "分类名称至少 2 个字符").max(20, "分类名称最多 20 个字符"),
  code: z
    .string()
    .trim()
    .min(2, "分类编码至少 2 个字符")
    .max(40, "分类编码最多 40 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "分类编码仅支持字母、数字和下划线"),
  sort: z.number().int().min(0, "排序不能小于 0"),
  status: z.enum(["启用", "停用"])
});

export const messageTemplatePayloadSchema = z.object({
  code: z.string().trim().min(2, "模板编码至少 2 个字符").max(50, "模板编码最多 50 个字符"),
  name: z.string().trim().min(2, "模板名称至少 2 个字符").max(30, "模板名称最多 30 个字符"),
  school: z.string().trim().min(1, "请选择适用高校").max(30, "适用高校最多 30 个字符"),
  channel: z.string().trim().min(1, "请选择发送渠道").max(30, "发送渠道最多 30 个字符"),
  status: z.enum(["启用", "停用"]),
  content: z.string().trim().min(5, "模板内容至少 5 个字符").max(500, "模板内容最多 500 个字符"),
  remark: z.string().trim().max(100, "备注最多 100 个字符").optional().default("")
});

export const searchWordPayloadSchema = z.object({
  school: z.string().trim().min(1, "请选择高校").max(30, "高校名称最多 30 个字符"),
  keyword: z.string().trim().min(2, "热词至少 2 个字符").max(20, "热词最多 20 个字符"),
  searchCount: z.number().int().min(0, "搜索量不能小于 0"),
  sort: z.number().int().min(0, "排序不能小于 0"),
  status: z.enum(["启用", "停用"])
});

export const helpCenterPayloadSchema = z.object({
  category: z.string().trim().min(2, "分类至少 2 个字符").max(20, "分类最多 20 个字符"),
  title: z.string().trim().min(2, "标题至少 2 个字符").max(50, "标题最多 50 个字符"),
  school: z.string().trim().min(1, "请选择适用范围").max(30, "适用范围最多 30 个字符"),
  status: z.enum(["发布中", "草稿"]),
  content: z.string().trim().min(5, "正文至少 5 个字符").max(2000, "正文最多 2000 个字符"),
  sort: z.number().int().min(0, "排序不能小于 0")
});

export const bannerConfigPayloadSchema = z.object({
  title: z.string().trim().min(2, "标题至少 2 个字符").max(50, "标题最多 50 个字符"),
  position: z.string().trim().min(2, "投放位置至少 2 个字符").max(30, "投放位置最多 30 个字符"),
  school: z.string().trim().min(1, "请选择所属高校").max(30, "所属高校最多 30 个字符"),
  imageUrl: z.string().trim().max(255, "图片地址最多 255 个字符").optional().default(""),
  linkUrl: z.string().trim().max(255, "跳转地址最多 255 个字符").optional().default(""),
  sort: z.number().int().min(0, "排序不能小于 0"),
  status: z.enum(["启用", "停用"]),
  remark: z.string().trim().max(100, "备注最多 100 个字符").optional().default("")
});

export const recommendConfigPayloadSchema = z.object({
  title: z.string().trim().min(2, "标题至少 2 个字符").max(50, "标题最多 50 个字符"),
  type: z.string().trim().min(2, "推荐类型至少 2 个字符").max(20, "推荐类型最多 20 个字符"),
  school: z.string().trim().min(1, "请选择所属高校").max(30, "所属高校最多 30 个字符"),
  targetName: z.string().trim().max(50, "关联对象最多 50 个字符").optional().default(""),
  targetId: z.string().trim().max(50, "关联 ID 最多 50 个字符").optional().default(""),
  sort: z.number().int().min(0, "排序不能小于 0"),
  status: z.enum(["启用", "停用"]),
  remark: z.string().trim().max(100, "备注最多 100 个字符").optional().default("")
});

export const basicConfigPayloadSchema = z.object({
  sectionKey: z.string().trim().min(2, "分组标识至少 2 个字符").max(30, "分组标识最多 30 个字符"),
  sectionTitle: z.string().trim().min(2, "分组标题至少 2 个字符").max(30, "分组标题最多 30 个字符"),
  configKey: z
    .string()
    .trim()
    .min(2, "配置项标识至少 2 个字符")
    .max(50, "配置项标识最多 50 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "配置项标识仅支持字母、数字和下划线"),
  label: z.string().trim().min(2, "配置项名称至少 2 个字符").max(30, "配置项名称最多 30 个字符"),
  value: z.union([z.string(), z.boolean()]),
  valueType: z.enum(["text", "switch"]),
  suffix: z.string().trim().max(10, "后缀最多 10 个字符").optional().default(""),
  sort: z.number().int().min(0, "排序不能小于 0"),
  status: z.enum(["启用", "停用"]),
  remark: z.string().trim().max(100, "备注最多 100 个字符").optional().default("")
});

export const dictTypePayloadSchema = z.object({
  name: z.string().trim().min(2, "字典名称至少 2 个字符").max(30, "字典名称最多 30 个字符"),
  code: z
    .string()
    .trim()
    .min(2, "字典编码至少 2 个字符")
    .max(50, "字典编码最多 50 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "字典编码仅支持字母、数字和下划线"),
  status: z.enum(["启用", "停用"]),
  remark: z.string().trim().max(100, "说明最多 100 个字符").optional().default(""),
  sort: z.number().int().min(0, "排序不能小于 0")
});

export const dictItemPayloadSchema = z.object({
  typeId: z.number().int().positive("请选择所属字典"),
  label: z.string().trim().min(1, "字典标签不能为空").max(30, "字典标签最多 30 个字符"),
  value: z
    .string()
    .trim()
    .min(1, "字典值不能为空")
    .max(50, "字典值最多 50 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "字典值仅支持字母、数字和下划线"),
  sort: z.number().int().min(0, "排序不能小于 0"),
  status: z.enum(["启用", "停用"]),
  remark: z.string().trim().max(100, "说明最多 100 个字符").optional().default("")
});

export const postReportReviewSchema = z.object({
  status: z.enum(["已处理", "已驳回"]),
  reviewNote: z.string().trim().max(100, "审核备注最多 100 个字").optional().default("")
});

export const postReviewSchema = z.object({
  status: z.enum(["已发布", "已驳回", "已下架"]),
  reviewNote: z.string().trim().max(100, "审核备注最多 100 个字").optional().default("")
});

export const refundReviewSchema = z.object({
  status: z.enum(["已通过", "已驳回"]),
  reviewNote: z.string().trim().max(100, "审核备注最多 100 个字").optional().default("")
});

export const storeSettlementConfigSchema = z.object({
  wechatSubMchId: z.string().trim().max(32, "特约商户号最多 32 个字符").optional().default(""),
  wechatSubMchStatus: z.enum(["not_invited", "pending", "active", "rejected", "disabled"]).optional().default("not_invited"),
  commissionRate: z.number().min(0, "分成比例不能小于 0").max(0.3, "平台分成比例不能超过 30%"),
  profitSharingEnabled: z.boolean().optional().default(true),
  settlementMode: z.enum(["auto", "manual", "disabled"]).optional().default("auto"),
  merchantContactName: z.string().trim().max(20, "联系人姓名最多 20 个字").optional().default(""),
  merchantContactPhone: z.string().trim().max(20, "联系人手机号最多 20 位").optional().default("")
});

export const adminManagerCreateSchema = z.object({
  account: z
    .string()
    .trim()
    .min(4, "账号至少 4 个字符")
    .max(30, "账号最多 30 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "账号仅支持字母、数字和下划线"),
  password: z.string().trim().min(6, "密码至少 6 个字符").max(30, "密码最多 30 个字符"),
  name: z.string().trim().min(2, "姓名至少 2 个字符").max(20, "姓名最多 20 个字符"),
  roleId: z.number().int().positive("请选择角色"),
  schools: z.array(z.string().trim().min(1, "高校不能为空")).optional().default([]),
  status: z.enum(["启用", "停用"]).optional().default("启用")
});

export const adminManagerUpdateSchema = z.object({
  account: z
    .string()
    .trim()
    .min(4, "账号至少 4 个字符")
    .max(30, "账号最多 30 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "账号仅支持字母、数字和下划线"),
  password: z.string().trim().min(6, "密码至少 6 个字符").max(30, "密码最多 30 个字符").optional(),
  name: z.string().trim().min(2, "姓名至少 2 个字符").max(20, "姓名最多 20 个字符"),
  roleId: z.number().int().positive("请选择角色"),
  schools: z.array(z.string().trim().min(1, "高校不能为空")).optional().default([])
});

export const adminManagerTransferSchema = z.object({
  mode: z.enum(["revoke", "transfer"]).optional().default("revoke"),
  school: z.string().trim().min(1, "school is required"),
  note: z.string().trim().max(100, "note max length is 100").optional().default(""),
  replacement: z
    .object({
      account: z
        .string()
        .trim()
        .min(4, "account min length is 4")
        .max(30, "account max length is 30")
        .regex(/^[a-zA-Z0-9_]+$/, "account only supports letters numbers and underscore"),
      name: z.string().trim().min(2, "name min length is 2").max(20, "name max length is 20")
    })
    .optional()
});

export const adminRolePayloadSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "角色编码至少 2 个字符")
    .max(30, "角色编码最多 30 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "角色编码仅支持字母、数字和下划线"),
  name: z.string().trim().min(2, "角色名称至少 2 个字符").max(20, "角色名称最多 20 个字符"),
  scopeType: z.enum(["all", "assigned"]),
  status: z.enum(["启用", "停用"]).optional().default("启用")
});

export const rolePermissionAssignSchema = z.object({
  menuPaths: z.array(z.string().trim().min(1, "菜单路径不能为空")).optional().default([]),
  permissionsList: z.array(z.string().trim().min(1, "权限编码不能为空")).optional().default([])
});

export type AdminLoginPayload = z.infer<typeof adminLoginSchema>;
export type AdminActivatePayload = z.infer<typeof adminActivateSchema>;
export type AdminPasswordUpdatePayload = z.infer<typeof adminPasswordUpdateSchema>;
export type MiniLoginPayload = z.infer<typeof miniLoginSchema>;
export type MiniProfileUpdatePayload = z.infer<typeof miniProfileUpdateSchema>;
export type VerifySubmitPayload = z.infer<typeof verifySubmitSchema>;
export type VerifyReviewPayload = z.infer<typeof verifyReviewSchema>;
export type PostReportReviewPayload = z.infer<typeof postReportReviewSchema>;
export type PostReviewPayload = z.infer<typeof postReviewSchema>;
export type MiniPostPayload = z.infer<typeof miniPostPayloadSchema>;
export type MiniShopApplyPayload = z.infer<typeof miniShopApplySchema>;
export type MiniShopApplyReviewPayload = z.infer<typeof miniShopApplyReviewSchema>;
export type SchoolAdminApplicationPayload = z.infer<typeof schoolAdminApplicationSchema>;
export type SchoolAdminApplicationReviewPayload = z.infer<typeof schoolAdminApplicationReviewSchema>;
export type SchoolAdminApplicationAssignPayload = z.infer<typeof schoolAdminApplicationAssignSchema>;
export type MiniFavoriteTogglePayload = z.infer<typeof miniFavoriteToggleSchema>;
export type MiniAddressPayload = z.infer<typeof miniAddressPayloadSchema>;
export type MiniOrderCreatePayload = z.infer<typeof miniOrderCreateSchema>;
export type MiniWithdrawCreatePayload = z.infer<typeof miniWithdrawCreateSchema>;
export type MiniWithdrawReviewPayload = z.infer<typeof miniWithdrawReviewSchema>;
export type RefundReviewPayload = z.infer<typeof refundReviewSchema>;
export type StoreSettlementConfigPayload = z.infer<typeof storeSettlementConfigSchema>;
export type MiniPostCommentCreatePayload = z.infer<typeof miniPostCommentCreateSchema>;
export type MiniMessageReadAllPayload = z.infer<typeof miniMessageReadAllSchema>;
export type MiniMerchantStoreUpdatePayload = z.infer<typeof miniMerchantStoreUpdateSchema>;
export type MiniMerchantProductPayload = z.infer<typeof miniMerchantProductSchema>;
export type MiniMerchantMovePayload = z.infer<typeof miniMerchantMoveSchema>;
export type MiniMerchantBatchIdsPayload = z.infer<typeof miniMerchantBatchIdsSchema>;
export type MiniUploadImagePayload = z.infer<typeof miniUploadImageSchema>;
export type SchoolContentPayload = z.infer<typeof schoolContentPayloadSchema>;
export type UserPublishPayload = z.infer<typeof userPublishPayloadSchema>;
export type ProductSpecPayload = z.infer<typeof productSpecPayloadSchema>;
export type AdminCategoryPayload = z.infer<typeof adminCategoryPayloadSchema>;
export type MessageTemplatePayload = z.infer<typeof messageTemplatePayloadSchema>;
export type SearchWordPayload = z.infer<typeof searchWordPayloadSchema>;
export type HelpCenterPayload = z.infer<typeof helpCenterPayloadSchema>;
export type BannerConfigPayload = z.infer<typeof bannerConfigPayloadSchema>;
export type RecommendConfigPayload = z.infer<typeof recommendConfigPayloadSchema>;
export type BasicConfigPayload = z.infer<typeof basicConfigPayloadSchema>;
export type DictTypePayload = z.infer<typeof dictTypePayloadSchema>;
export type DictItemPayload = z.infer<typeof dictItemPayloadSchema>;
export type AdminManagerCreatePayload = z.infer<typeof adminManagerCreateSchema>;
export type AdminManagerUpdatePayload = z.infer<typeof adminManagerUpdateSchema>;
export type AdminManagerTransferPayload = z.infer<typeof adminManagerTransferSchema>;
export type AdminRolePayload = z.infer<typeof adminRolePayloadSchema>;
export type RolePermissionAssignPayload = z.infer<typeof rolePermissionAssignSchema>;

export const fixedBannerConfigPayloadSchema = z.object({
  title: z.string().trim().min(2, "标题至少 2 个字符").max(50, "标题最多 50 个字符"),
  position: z.literal("mini_home_top"),
  school: z.string().trim().min(1, "请选择所属高校").max(30, "所属高校最多 30 个字符"),
  imageUrl: z.string().trim().min(1, "请先上传轮播图").max(255, "图片地址最多 255 个字符"),
  linkUrl: z.string().trim().max(255, "跳转地址最多 255 个字符").optional().default(""),
  sort: z.number().int().min(0, "排序不能小于 0"),
  status: z.enum(["启用", "停用"]),
  remark: z.string().trim().max(100, "备注最多 100 个字符").optional().default("")
});

export const adminBannerImageUploadSchema = z.object({
  fileName: requiredText("文件名"),
  base64: requiredText("图片内容"),
  scene: z.literal("banner").optional().default("banner")
});

export type FixedBannerConfigPayload = z.infer<typeof fixedBannerConfigPayloadSchema>;
export type AdminBannerImageUploadPayload = z.infer<typeof adminBannerImageUploadSchema>;
