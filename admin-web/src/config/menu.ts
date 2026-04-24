export interface AdminMenuItem {
  key: string;
  title: string;
  path?: string;
  children?: AdminMenuItem[];
}

export const adminMenus: AdminMenuItem[] = [
  {
    key: "dashboard",
    title: "仪表盘",
    children: [{ key: "dashboard-overview", title: "数据概览", path: "/dashboard/overview" }]
  },
  {
    key: "school",
    title: "高校管理",
    children: [
      { key: "school-list", title: "高校列表", path: "/school/list" },
      { key: "school-content", title: "高校内容统计", path: "/school/content" }
    ]
  },
  {
    key: "user",
    title: "用户中心",
    children: [
      { key: "user-list", title: "用户列表", path: "/user/list" },
      { key: "user-publish", title: "用户发布记录", path: "/user/publish" }
    ]
  },
  {
    key: "verify",
    title: "校园认证",
    children: [{ key: "verify-list", title: "认证申请", path: "/verify/list" }]
  },
  {
    key: "post",
    title: "帖子管理",
    children: [
      { key: "post-list", title: "帖子列表", path: "/post/list" },
      { key: "post-category", title: "帖子分类", path: "/post/category" },
      { key: "post-report", title: "举报管理", path: "/post/report" }
    ]
  },
  {
    key: "store",
    title: "店铺管理",
    children: [
      { key: "store-apply", title: "入驻申请", path: "/store/apply" },
      { key: "store-list", title: "店铺管理", path: "/store/list" },
      { key: "store-category", title: "店铺分类", path: "/store/category" }
    ]
  },
  {
    key: "product",
    title: "商品管理",
    children: [
      { key: "product-list", title: "商品巡检", path: "/product/list" },
      { key: "product-spec", title: "商品规格管理", path: "/product/spec" },
      { key: "product-category", title: "商品分类", path: "/product/category" }
    ]
  },
  {
    key: "message",
    title: "消息通知",
    children: [
      { key: "message-system", title: "系统消息", path: "/message/system" },
      { key: "message-interactive", title: "互动消息", path: "/message/interactive" },
      { key: "message-send", title: "发送记录", path: "/message/send" },
      { key: "message-template", title: "消息模板", path: "/message/template" }
    ]
  },
  {
    key: "operation",
    title: "运营配置",
    children: [
      { key: "operation-banner", title: "轮播图配置", path: "/operation/banner" },
      { key: "operation-recommend", title: "推荐位配置", path: "/operation/recommend" },
      { key: "operation-search-word", title: "搜索热词", path: "/operation/search-word" },
      { key: "operation-help", title: "帮助中心", path: "/operation/help" }
    ]
  },
  {
    key: "trade",
    title: "订单与钱包",
    children: [
      { key: "trade-order", title: "订单列表", path: "/trade/order" },
      { key: "trade-refund", title: "退款管理", path: "/trade/refund" },
      { key: "trade-wallet", title: "钱包账户", path: "/trade/wallet" },
      { key: "trade-withdraw", title: "提现审核", path: "/trade/withdraw" }
    ]
  },
  {
    key: "stat",
    title: "数据统计",
    children: [
      { key: "stat-user", title: "用户统计", path: "/stat/user" },
      { key: "stat-post", title: "帖子统计", path: "/stat/post" },
      { key: "stat-store", title: "店铺统计", path: "/stat/store" },
      { key: "stat-order", title: "订单统计", path: "/stat/order" }
    ]
  },
  {
    key: "system",
    title: "系统设置",
    children: [
      { key: "system-basic", title: "基础配置", path: "/system/basic" },
      { key: "system-dict", title: "字典配置", path: "/system/dict" },
      { key: "system-log", title: "操作日志", path: "/system/log" },
      { key: "system-version", title: "版本信息", path: "/system/version" }
    ]
  },
  {
    key: "auth",
    title: "权限管理",
    children: [
      { key: "auth-admin", title: "管理员列表", path: "/auth/admin" },
      { key: "auth-school-admin-apply", title: "管理员申请", path: "/auth/school-admin-apply" },
      { key: "auth-role", title: "角色列表", path: "/auth/role" },
      { key: "auth-menu", title: "菜单权限", path: "/auth/menu" }
    ]
  }
];
