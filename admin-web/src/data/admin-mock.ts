export const dashboardCards = [
  { label: "入驻高校", value: "28", trend: "较上周新增 2 所" },
  { label: "平台用户", value: "18,426", trend: "今日新增 136 人" },
  { label: "在营店铺", value: "486", trend: "本月新增 29 家" },
  { label: "有效订单", value: "7,328", trend: "今日成交 412 单" }
];

export const schoolList = [
  { id: 1, name: "清华大学", province: "北京", city: "北京", userCount: 2360, postCount: 1280, storeCount: 42, sort: 1, status: "已开通" },
  { id: 2, name: "北京大学", province: "北京", city: "北京", userCount: 2140, postCount: 1156, storeCount: 39, sort: 2, status: "已开通" },
  { id: 3, name: "复旦大学", province: "上海", city: "上海", userCount: 1985, postCount: 1046, storeCount: 37, sort: 3, status: "已开通" },
  { id: 4, name: "上海交通大学", province: "上海", city: "上海", userCount: 1876, postCount: 962, storeCount: 34, sort: 4, status: "已开通" },
  { id: 5, name: "浙江大学", province: "浙江", city: "杭州", userCount: 1688, postCount: 856, storeCount: 31, sort: 5, status: "已开通" },
  { id: 6, name: "武汉大学", province: "湖北", city: "武汉", userCount: 1492, postCount: 768, storeCount: 26, sort: 6, status: "未开通" }
];

export const userList = [
  { id: 1, nickname: "林知夏", phone: "13800010001", school: "清华大学", verified: "已认证", status: "正常", postCount: 18, registerTime: "2026-03-21 10:20" },
  { id: 2, nickname: "周以安", phone: "13800010002", school: "北京大学", verified: "已认证", status: "正常", postCount: 12, registerTime: "2026-03-18 08:12" },
  { id: 3, nickname: "陈鹿鸣", phone: "13800010003", school: "复旦大学", verified: "未认证", status: "正常", postCount: 6, registerTime: "2026-03-17 19:33" },
  { id: 4, nickname: "许言澈", phone: "13800010004", school: "上海交通大学", verified: "已认证", status: "已封禁", postCount: 24, registerTime: "2026-03-15 16:40" },
  { id: 5, nickname: "沈南枝", phone: "13800010005", school: "浙江大学", verified: "已认证", status: "正常", postCount: 9, registerTime: "2026-03-14 14:08" }
];

export const verifyList = [
  { id: 1, realName: "李星河", phone: "13900020001", school: "清华大学", status: "待审核", submitTime: "2026-04-07 09:20", reviewer: "-" },
  { id: 2, realName: "唐知意", phone: "13900020002", school: "北京大学", status: "已通过", submitTime: "2026-04-06 14:30", reviewer: "张敏" },
  { id: 3, realName: "宋嘉木", phone: "13900020003", school: "复旦大学", status: "待审核", submitTime: "2026-04-06 18:08", reviewer: "-" },
  { id: 4, realName: "韩若宁", phone: "13900020004", school: "上海交通大学", status: "已驳回", submitTime: "2026-04-05 21:12", reviewer: "王凯" }
];

export const postList = [
  { id: 1, title: "清华食堂晚餐拼饭", author: "林知夏", school: "清华大学", category: "校园互助", status: "已发布", favoriteCount: 45, createdAt: "2026-04-07 18:26" },
  { id: 2, title: "北大四月跳蚤市场招募摊主", author: "周以安", school: "北京大学", category: "二手交易", status: "待审核", favoriteCount: 28, createdAt: "2026-04-07 15:42" },
  { id: 3, title: "复旦南区跑步搭子集合", author: "陈鹿鸣", school: "复旦大学", category: "校园社交", status: "已发布", favoriteCount: 19, createdAt: "2026-04-06 20:18" },
  { id: 4, title: "交大宿舍打印代取服务", author: "许言澈", school: "上海交通大学", category: "创业服务", status: "已下架", favoriteCount: 31, createdAt: "2026-04-05 11:05" }
];

export const storeApplyList = [
  { id: 1, storeName: "清园鲜果铺", owner: "赵安宁", school: "清华大学", category: "学生商家", status: "待审核", submitTime: "2026-04-07 10:10" },
  { id: 2, storeName: "未名夜宵站", owner: "顾言", school: "北京大学", category: "宿舍超市", status: "已通过", submitTime: "2026-04-06 12:35" },
  { id: 3, storeName: "旦苑手作咖啡", owner: "乔可", school: "复旦大学", category: "校内商家", status: "待审核", submitTime: "2026-04-05 17:20" },
  { id: 4, storeName: "交大校园洗护", owner: "韩硕", school: "上海交通大学", category: "校外商家", status: "已驳回", submitTime: "2026-04-04 09:40" }
];

export const storeList = [
  { id: 1, storeName: "清园鲜果铺", owner: "赵安宁", school: "清华大学", category: "学生商家", status: "营业中", recommend: "推荐中", goodsCount: 18 },
  { id: 2, storeName: "未名夜宵站", owner: "顾言", school: "北京大学", category: "宿舍超市", status: "营业中", recommend: "未推荐", goodsCount: 26 },
  { id: 3, storeName: "旦苑手作咖啡", owner: "乔可", school: "复旦大学", category: "校内商家", status: "营业中", recommend: "推荐中", goodsCount: 14 },
  { id: 4, storeName: "交大校园洗护", owner: "韩硕", school: "上海交通大学", category: "校外商家", status: "暂停营业", recommend: "未推荐", goodsCount: 9 }
];

export const bannerList = [
  { id: 1, title: "新生认证季活动", position: "首页顶部", school: "清华大学", sort: 1, status: "启用" },
  { id: 2, title: "创业店铺招募令", position: "店铺频道", school: "北京大学", sort: 2, status: "启用" },
  { id: 3, title: "校园跑腿服务周", position: "消息页弹层", school: "复旦大学", sort: 3, status: "停用" }
];

export const recommendList = [
  { id: 1, title: "春季热销零食合集", type: "商品推荐", school: "清华大学", sort: 1, status: "启用" },
  { id: 2, title: "认证用户优选店铺", type: "店铺推荐", school: "北京大学", sort: 2, status: "启用" },
  { id: 3, title: "校园活动精选帖子", type: "帖子推荐", school: "复旦大学", sort: 3, status: "停用" }
];

export const productList = [
  { id: 1, name: "鲜切西瓜杯", school: "清华大学", storeName: "清园鲜果铺", category: "水果轻食", price: 12.8, stock: 68, status: "上架中", sales: 245 },
  { id: 2, name: "卤味夜宵套餐", school: "北京大学", storeName: "未名夜宵站", category: "夜宵速食", price: 26.0, stock: 34, status: "上架中", sales: 198 },
  { id: 3, name: "手冲咖啡体验券", school: "复旦大学", storeName: "旦苑手作咖啡", category: "咖啡饮品", price: 19.9, stock: 120, status: "待审核", sales: 72 },
  { id: 4, name: "宿舍洗衣月卡", school: "上海交通大学", storeName: "交大校园洗护", category: "生活服务", price: 59.0, stock: 20, status: "已下架", sales: 54 }
];

export const systemMessageList = [
  { id: 1, title: "校园认证通过通知", school: "全部高校", target: "认证用户", channel: "站内信", status: "启用", updatedAt: "2026-04-07 16:30" },
  { id: 2, title: "店铺入驻审核提醒", school: "全部高校", target: "店主", channel: "站内信+短信", status: "启用", updatedAt: "2026-04-06 11:15" },
  { id: 3, title: "订单超时取消提醒", school: "全部高校", target: "买家", channel: "站内信", status: "停用", updatedAt: "2026-04-04 09:50" },
  { id: 4, title: "平台活动推送模板", school: "按高校", target: "全体用户", channel: "站内信", status: "启用", updatedAt: "2026-04-03 18:20" }
];

export const messageSendRecordList = [
  { id: 1, title: "清华大学认证补充通知", school: "清华大学", channel: "站内信", targetCount: 326, status: "发送成功", operator: "运营专员", sendTime: "2026-04-07 19:20" },
  { id: 2, title: "北京大学店铺招募", school: "北京大学", channel: "站内信+短信", targetCount: 840, status: "发送成功", operator: "超级管理员", sendTime: "2026-04-07 14:05" },
  { id: 3, title: "复旦大学订单提醒", school: "复旦大学", channel: "站内信", targetCount: 126, status: "发送失败", operator: "客服主管", sendTime: "2026-04-06 21:12" },
  { id: 4, title: "交大平台活动预告", school: "上海交通大学", channel: "站内信", targetCount: 468, status: "发送中", operator: "运营专员", sendTime: "2026-04-06 10:30" }
];

export const orderList = [
  { id: "DD202604070001", school: "清华大学", buyer: "林知夏", storeName: "清园鲜果铺", amount: 25.6, payStatus: "已支付", orderStatus: "待配送", settlementStatus: "待结算", createdAt: "2026-04-07 18:20" },
  { id: "DD202604070002", school: "北京大学", buyer: "周以安", storeName: "未名夜宵站", amount: 52.0, payStatus: "已支付", orderStatus: "已完成", settlementStatus: "已结算", createdAt: "2026-04-07 20:08" },
  { id: "DD202604060015", school: "复旦大学", buyer: "陈鹿鸣", storeName: "旦苑手作咖啡", amount: 19.9, payStatus: "待支付", orderStatus: "待付款", settlementStatus: "未结算", createdAt: "2026-04-06 09:16" },
  { id: "DD202604050023", school: "上海交通大学", buyer: "韩若宁", storeName: "交大校园洗护", amount: 59.0, payStatus: "已退款", orderStatus: "已关闭", settlementStatus: "已关闭", createdAt: "2026-04-05 13:41" }
];

export const walletAccountList = [
  { id: 1, school: "清华大学", accountName: "清园鲜果铺", accountType: "店铺钱包", balance: 12680.5, frozenAmount: 320.0, withdrawableAmount: 12360.5, status: "正常" },
  { id: 2, school: "北京大学", accountName: "未名夜宵站", accountType: "店铺钱包", balance: 9680.0, frozenAmount: 260.0, withdrawableAmount: 9420.0, status: "正常" },
  { id: 3, school: "复旦大学", accountName: "平台营销账户", accountType: "平台钱包", balance: 20000.0, frozenAmount: 0, withdrawableAmount: 20000.0, status: "正常" },
  { id: 4, school: "上海交通大学", accountName: "交大校园洗护", accountType: "店铺钱包", balance: 3280.0, frozenAmount: 1200.0, withdrawableAmount: 2080.0, status: "冻结" }
];

export const basicConfigSections = [
  {
    title: "平台信息",
    items: [
      { key: "platformName", label: "平台名称", value: "校园通", type: "text" },
      { key: "servicePhone", label: "客服电话", value: "400-800-2026", type: "text" },
      { key: "serviceWechat", label: "客服微信", value: "xiaoyuantongkf", type: "text" }
    ]
  },
  {
    title: "业务开关",
    items: [
      { key: "postReview", label: "帖子发布审核", value: true, type: "switch" },
      { key: "storeReview", label: "店铺入驻审核", value: true, type: "switch" },
      { key: "productReview", label: "商品上架审核", value: true, type: "switch" },
      { key: "messageNotice", label: "站内消息通知", value: true, type: "switch" }
    ]
  },
  {
    title: "交易规则",
    items: [
      { key: "withdrawMin", label: "最低提现金额", value: "100", type: "text", suffix: "元" },
      { key: "serviceRate", label: "平台服务费率", value: "2", type: "text", suffix: "%" },
      { key: "autoCloseMinute", label: "订单自动关闭", value: "15", type: "text", suffix: "分钟" }
    ]
  }
];

export const dictTypeList = [
  { id: 1, name: "店铺分类", code: "store_category", status: "启用", remark: "创业店铺一级分类" },
  { id: 2, name: "帖子分类", code: "post_category", status: "启用", remark: "首页帖子业务分类" },
  { id: 3, name: "消息渠道", code: "message_channel", status: "启用", remark: "后台消息发送渠道" }
];

export const dictItemMap: Record<number, Array<{ label: string; value: string; sort: number; status: string }>> = {
  1: [
    { label: "学生商家", value: "student_store", sort: 1, status: "启用" },
    { label: "宿舍超市", value: "dorm_store", sort: 2, status: "启用" },
    { label: "校内商家", value: "campus_store", sort: 3, status: "启用" },
    { label: "校外商家", value: "offcampus_store", sort: 4, status: "启用" }
  ],
  2: [
    { label: "校园互助", value: "campus_help", sort: 1, status: "启用" },
    { label: "二手交易", value: "used_market", sort: 2, status: "启用" },
    { label: "校园社交", value: "campus_social", sort: 3, status: "启用" }
  ],
  3: [
    { label: "站内信", value: "site", sort: 1, status: "启用" },
    { label: "短信", value: "sms", sort: 2, status: "启用" },
    { label: "站内信+短信", value: "site_sms", sort: 3, status: "启用" }
  ]
};

export const adminUserList = [
  { id: 1, name: "张敏", account: "admin", role: "超级管理员", school: "全部高校", status: "启用", lastLoginTime: "2026-04-07 20:18" },
  { id: 2, name: "王凯", account: "audit", role: "审核管理员", school: "全部高校", status: "启用", lastLoginTime: "2026-04-07 18:36" },
  { id: 3, name: "李想", account: "operate", role: "运营专员", school: "清华大学", status: "启用", lastLoginTime: "2026-04-07 17:12" },
  { id: 4, name: "陈晨", account: "service", role: "客服主管", school: "北京大学", status: "停用", lastLoginTime: "2026-04-05 09:40" }
];

export const roleList = [
  { id: 1, name: "超级管理员", code: "super_admin", userCount: 1, status: "启用", permissions: "平台全部权限" },
  { id: 2, name: "审核管理员", code: "audit_admin", userCount: 2, status: "启用", permissions: "认证审核、帖子审核、店铺审核" },
  { id: 3, name: "运营专员", code: "operation_admin", userCount: 3, status: "启用", permissions: "轮播图、推荐位、消息发送、店铺运营" },
  { id: 4, name: "客服主管", code: "service_admin", userCount: 1, status: "停用", permissions: "订单处理、钱包核对、用户申诉" }
];

export const postCategoryList = [
  { id: 1, name: "校园互助", code: "campus_help", school: "清华大学", sort: 1, postCount: 132, status: "启用" },
  { id: 2, name: "二手交易", code: "used_market", school: "北京大学", sort: 2, postCount: 156, status: "启用" },
  { id: 3, name: "校园社交", code: "campus_social", school: "复旦大学", sort: 3, postCount: 121, status: "启用" },
  { id: 4, name: "创业服务", code: "startup_service", school: "上海交通大学", sort: 4, postCount: 88, status: "停用" }
];

export const storeCategoryList = [
  { id: 1, name: "学生商家", code: "student_store", school: "清华大学", sort: 1, storeCount: 28, status: "启用" },
  { id: 2, name: "宿舍超市", code: "dorm_store", school: "北京大学", sort: 2, storeCount: 19, status: "启用" },
  { id: 3, name: "校内商家", code: "campus_store", school: "复旦大学", sort: 3, storeCount: 23, status: "启用" },
  { id: 4, name: "校外商家", code: "offcampus_store", school: "上海交通大学", sort: 4, storeCount: 15, status: "启用" }
];

export const productCategoryList = [
  { id: 1, name: "水果轻食", code: "fruit_snack", school: "清华大学", sort: 1, productCount: 36, status: "启用" },
  { id: 2, name: "夜宵速食", code: "night_food", school: "北京大学", sort: 2, productCount: 41, status: "启用" },
  { id: 3, name: "咖啡饮品", code: "coffee_drink", school: "复旦大学", sort: 3, productCount: 26, status: "启用" },
  { id: 4, name: "生活服务", code: "life_service", school: "上海交通大学", sort: 4, productCount: 18, status: "停用" }
];

export const refundList = [
  { id: "TK202604080001", orderId: "DD202604070001", school: "清华大学", buyer: "林知夏", amount: 12.8, reason: "商品与描述不符", status: "待审核", applyTime: "2026-04-08 09:20" },
  { id: "TK202604080002", orderId: "DD202604070002", school: "北京大学", buyer: "周以安", amount: 26.0, reason: "配送超时", status: "已通过", applyTime: "2026-04-08 10:10" },
  { id: "TK202604070018", orderId: "DD202604060015", school: "复旦大学", buyer: "陈鹿鸣", amount: 19.9, reason: "重复下单", status: "已驳回", applyTime: "2026-04-07 21:15" }
];

export const withdrawList = [
  { id: "TX202604080001", school: "清华大学", accountName: "清园鲜果铺", amount: 1200, bankName: "中国银行", status: "待审核", applyTime: "2026-04-08 11:30" },
  { id: "TX202604080002", school: "北京大学", accountName: "未名夜宵站", amount: 860, bankName: "建设银行", status: "已通过", applyTime: "2026-04-08 10:20" },
  { id: "TX202604070011", school: "上海交通大学", accountName: "交大校园洗护", amount: 300, bankName: "工商银行", status: "已驳回", applyTime: "2026-04-07 16:10" }
];

export const operationLogList = [
  { id: 1, school: "清华大学", module: "帖子管理", action: "审核通过", operator: "王凯", ip: "10.10.1.12", createdAt: "2026-04-08 09:40", content: "帖子《清华食堂晚餐拼饭》审核通过" },
  { id: 2, school: "北京大学", module: "店铺管理", action: "入驻通过", operator: "王凯", ip: "10.10.1.12", createdAt: "2026-04-08 10:06", content: "店铺《未名夜宵站》入驻审核通过" },
  { id: 3, school: "复旦大学", module: "运营配置", action: "编辑轮播图", operator: "李想", ip: "10.10.2.18", createdAt: "2026-04-08 10:48", content: "更新轮播图《创业店铺招募令》排序为 2" },
  { id: 4, school: "上海交通大学", module: "订单与钱包", action: "驳回提现", operator: "陈晨", ip: "10.10.3.29", createdAt: "2026-04-08 11:20", content: "提现申请 TX202604070011 审核驳回" }
];

export const adminPermissionProfiles = [
  {
    id: 1,
    account: "admin",
    password: "JP@admin",
    name: "张敏",
    roleCode: "super_admin",
    roleName: "超级管理员",
    scopeType: "all" as const,
    schools: [] as string[],
    menuPaths: ["*"],
    permissions: ["*"]
  },
  {
    id: 2,
    account: "audit",
    password: "Audit@123",
    name: "王凯",
    roleCode: "audit_admin",
    roleName: "审核管理员",
    scopeType: "all" as const,
    schools: [] as string[],
    menuPaths: [
      "/dashboard/overview",
      "/verify/list",
      "/post/list",
      "/post/category",
      "/post/report",
      "/store/apply",
      "/store/list",
      "/product/list",
      "/trade/refund",
      "/trade/withdraw",
      "/system/log"
    ],
    permissions: [
      "verify:view",
      "verify:approve",
      "verify:reject",
      "post:review",
      "post:offline",
      "post:category:view",
      "store:apply:view",
      "store:apply:approve",
      "store:apply:reject",
      "refund:review",
      "withdraw:review",
      "log:view"
    ]
  },
  {
    id: 3,
    account: "operate",
    password: "Operate@123",
    name: "李想",
    roleCode: "operation_admin",
    roleName: "运营专员",
    scopeType: "assigned" as const,
    schools: ["清华大学"],
    menuPaths: [
      "/dashboard/overview",
      "/post/list",
      "/post/category",
      "/store/list",
      "/store/category",
      "/product/list",
      "/product/category",
      "/message/system",
      "/message/send",
      "/operation/banner",
      "/operation/recommend",
      "/operation/search-word",
      "/operation/help",
      "/system/log"
    ],
    permissions: [
      "post:category:add",
      "post:category:edit",
      "store:category:add",
      "store:category:edit",
      "product:category:add",
      "product:category:edit",
      "message:send",
      "operation:edit",
      "log:view"
    ]
  },
  {
    id: 4,
    account: "service",
    password: "Service@123",
    name: "陈晨",
    roleCode: "service_admin",
    roleName: "客服主管",
    scopeType: "assigned" as const,
    schools: ["北京大学"],
    menuPaths: ["/dashboard/overview", "/trade/order", "/trade/refund", "/trade/wallet", "/trade/withdraw", "/system/log"],
    permissions: ["order:view", "order:export", "refund:review", "wallet:view", "wallet:export", "withdraw:review", "log:view"]
  }
];

export const postReportList = [
  {
    id: "JB202604080001",
    school: "清华大学",
    postTitle: "清华食堂晚餐拼饭",
    reportUser: "周以安",
    reason: "广告营销",
    status: "待处理",
    reportTime: "2026-04-08 09:40"
  },
  {
    id: "JB202604080002",
    school: "北京大学",
    postTitle: "北大四月跳蚤市场招募摊主",
    reportUser: "陈鹿鸣",
    reason: "内容重复",
    status: "已处理",
    reportTime: "2026-04-08 10:10"
  },
  {
    id: "JB202604070018",
    school: "复旦大学",
    postTitle: "复旦南区跑步搭子集合",
    reportUser: "韩若宁",
    reason: "联系方式异常",
    status: "已驳回",
    reportTime: "2026-04-07 20:18"
  }
];

export const interactiveMessageList = [
  { id: 1, school: "清华大学", user: "林知夏", type: "评论", target: "清华食堂晚餐拼饭", content: "想问下几点开团？", status: "未读", createdAt: "2026-04-08 11:12" },
  { id: 2, school: "北京大学", user: "周以安", type: "点赞", target: "北大四月跳蚤市场招募摊主", content: "点赞了你的帖子", status: "已读", createdAt: "2026-04-08 10:46" },
  { id: 3, school: "复旦大学", user: "陈鹿鸣", type: "收藏", target: "复旦南区跑步搭子集合", content: "收藏了你的帖子", status: "已读", createdAt: "2026-04-08 09:58" }
];

export const messageTemplateList = [
  { id: 1, code: "verify_pass", name: "认证通过通知", school: "全部高校", channel: "站内信", status: "启用", updatedAt: "2026-04-07 09:30" },
  { id: 2, code: "verify_reject", name: "认证驳回通知", school: "全部高校", channel: "站内信", status: "启用", updatedAt: "2026-04-07 09:35" },
  { id: 3, code: "store_apply_pass", name: "店铺入驻通过通知", school: "全部高校", channel: "站内信+短信", status: "启用", updatedAt: "2026-04-06 13:20" },
  { id: 4, code: "order_refund_result", name: "退款处理结果通知", school: "按高校", channel: "站内信", status: "停用", updatedAt: "2026-04-05 16:40" }
];

export const searchKeywordList = [
  { id: 1, school: "清华大学", keyword: "跑腿", searchCount: 1230, sort: 1, status: "启用" },
  { id: 2, school: "北京大学", keyword: "二手书", searchCount: 1086, sort: 2, status: "启用" },
  { id: 3, school: "复旦大学", keyword: "咖啡", searchCount: 920, sort: 3, status: "启用" },
  { id: 4, school: "上海交通大学", keyword: "打印", searchCount: 665, sort: 4, status: "停用" }
];

export const helpCenterList = [
  { id: 1, category: "认证与账号", title: "校园认证为什么会被驳回", school: "全部高校", status: "发布中", updatedAt: "2026-04-07 11:20" },
  { id: 2, category: "店铺经营", title: "店铺入驻审核需要多久", school: "全部高校", status: "发布中", updatedAt: "2026-04-07 14:05" },
  { id: 3, category: "订单售后", title: "申请退款后多久到账", school: "全部高校", status: "草稿", updatedAt: "2026-04-06 16:40" },
  { id: 4, category: "平台规则", title: "违规内容会如何处理", school: "全部高校", status: "发布中", updatedAt: "2026-04-05 10:18" }
];

export const menuPermissionTree = [
  { id: 1, parentId: 0, name: "仪表盘", path: "/dashboard/overview", code: "menu:dashboard", type: "菜单" },
  { id: 2, parentId: 0, name: "帖子管理", path: "/post/list", code: "menu:post", type: "菜单" },
  { id: 3, parentId: 2, name: "帖子分类编辑", path: "", code: "post:category:edit", type: "按钮" },
  { id: 4, parentId: 2, name: "举报处理", path: "", code: "post:report:review", type: "按钮" },
  { id: 5, parentId: 0, name: "消息通知", path: "/message/system", code: "menu:message", type: "菜单" },
  { id: 6, parentId: 5, name: "消息发送", path: "", code: "message:send", type: "按钮" },
  { id: 7, parentId: 0, name: "订单与钱包", path: "/trade/order", code: "menu:trade", type: "菜单" },
  { id: 8, parentId: 7, name: "退款审核", path: "", code: "refund:review", type: "按钮" },
  { id: 9, parentId: 7, name: "提现审核", path: "", code: "withdraw:review", type: "按钮" }
];

export const rolePermissionMap: Record<string, string[]> = {
  super_admin: ["*"],
  audit_admin: ["menu:dashboard", "menu:post", "post:report:review", "refund:review", "withdraw:review"],
  operation_admin: ["menu:dashboard", "menu:post", "post:category:edit", "menu:message", "message:send"],
  service_admin: ["menu:dashboard", "menu:trade", "refund:review", "withdraw:review"]
};

export const userStatData = {
  cards: [
    { label: "新增用户", value: 286, trend: "+12.6%" },
    { label: "活跃用户", value: 1520, trend: "+8.2%" },
    { label: "认证通过率", value: "82.5%", trend: "+1.4%" }
  ],
  schoolRank: [
    { school: "清华大学", value: 420 },
    { school: "北京大学", value: 390 },
    { school: "复旦大学", value: 315 },
    { school: "上海交通大学", value: 286 }
  ]
};

export const postStatData = {
  cards: [
    { label: "今日发帖", value: 198, trend: "+9.8%" },
    { label: "互动总量", value: 4210, trend: "+6.4%" },
    { label: "审核通过率", value: "88.2%", trend: "+2.1%" }
  ],
  categoryRank: [
    { name: "二手交易", value: 520 },
    { name: "校园互助", value: 486 },
    { name: "校园社交", value: 410 },
    { name: "创业服务", value: 196 }
  ]
};

export const storeStatData = {
  cards: [
    { label: "新增店铺", value: 32, trend: "+14.3%" },
    { label: "营业中店铺", value: 486, trend: "+5.6%" },
    { label: "推荐店铺", value: 106, trend: "+3.2%" }
  ],
  schoolRank: [
    { school: "清华大学", value: 128 },
    { school: "北京大学", value: 116 },
    { school: "复旦大学", value: 103 },
    { school: "上海交通大学", value: 98 }
  ]
};

export const orderStatData = {
  cards: [
    { label: "今日订单", value: 412, trend: "+11.2%" },
    { label: "成交金额", value: "¥28640", trend: "+9.6%" },
    { label: "退款率", value: "2.8%", trend: "-0.6%" }
  ],
  schoolRank: [
    { school: "清华大学", value: 122 },
    { school: "北京大学", value: 111 },
    { school: "复旦大学", value: 97 },
    { school: "上海交通大学", value: 82 }
  ]
};

export const versionInfo = {
  currentVersion: "v1.3.0",
  env: "production",
  buildTime: "2026-04-08 18:10",
  latestRelease: "v1.3.0",
  changelog: [
    { version: "v1.3.0", date: "2026-04-08", content: "新增分类管理、退款审核、提现审核和权限闭环。" },
    { version: "v1.2.0", date: "2026-04-01", content: "新增商品、消息、订单、钱包基础能力。" },
    { version: "v1.1.0", date: "2026-03-25", content: "新增高校、用户、认证、帖子、店铺管理模块。" }
  ]
};

export const schoolContentList = [
  { id: 1, school: "清华大学", userCount: 2360, postCount: 1280, storeCount: 42, orderCount: 1386, gmv: 86520, verifyPassRate: "84.6%", status: "启用" },
  { id: 2, school: "北京大学", userCount: 2140, postCount: 1156, storeCount: 39, orderCount: 1222, gmv: 79260, verifyPassRate: "82.3%", status: "启用" },
  { id: 3, school: "复旦大学", userCount: 1985, postCount: 1046, storeCount: 37, orderCount: 1088, gmv: 68410, verifyPassRate: "81.2%", status: "启用" },
  { id: 4, school: "上海交通大学", userCount: 1876, postCount: 962, storeCount: 34, orderCount: 972, gmv: 63240, verifyPassRate: "79.8%", status: "停用" }
];

export const userPublishRecordList = [
  { id: 1, school: "清华大学", user: "林知夏", type: "帖子", title: "清华食堂晚餐拼饭", status: "已发布", createdAt: "2026-04-07 18:26" },
  { id: 2, school: "北京大学", user: "周以安", type: "商品", title: "卤味夜宵套餐", status: "已上架", createdAt: "2026-04-07 16:42" },
  { id: 3, school: "复旦大学", user: "陈鹿鸣", type: "帖子", title: "复旦南区跑步搭子集合", status: "已发布", createdAt: "2026-04-06 20:18" },
  { id: 4, school: "上海交通大学", user: "韩若宁", type: "店铺", title: "交大校园洗护", status: "待审核", createdAt: "2026-04-06 09:08" },
  { id: 5, school: "清华大学", user: "赵安宁", type: "商品", title: "鲜切西瓜杯", status: "已上架", createdAt: "2026-04-05 12:30" }
];

export const productSpecList = [
  { id: 1, school: "清华大学", storeName: "清园鲜果铺", productName: "鲜切西瓜杯", specGroup: "规格", specValue: "大杯", price: 12.8, stock: 68, status: "启用", updatedAt: "2026-04-08 10:20" },
  { id: 2, school: "清华大学", storeName: "清园鲜果铺", productName: "鲜切西瓜杯", specGroup: "规格", specValue: "小杯", price: 9.9, stock: 94, status: "启用", updatedAt: "2026-04-08 10:20" },
  { id: 3, school: "北京大学", storeName: "未名夜宵站", productName: "卤味夜宵套餐", specGroup: "辣度", specValue: "微辣", price: 26.0, stock: 34, status: "启用", updatedAt: "2026-04-08 09:12" },
  { id: 4, school: "北京大学", storeName: "未名夜宵站", productName: "卤味夜宵套餐", specGroup: "辣度", specValue: "中辣", price: 26.0, stock: 22, status: "启用", updatedAt: "2026-04-08 09:12" },
  { id: 5, school: "复旦大学", storeName: "旦苑手作咖啡", productName: "手冲咖啡体验券", specGroup: "杯型", specValue: "中杯", price: 19.9, stock: 120, status: "停用", updatedAt: "2026-04-07 17:05" }
];
