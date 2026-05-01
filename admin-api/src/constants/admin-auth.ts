export interface AdminMenuNode {
  key: string;
  title: string;
  path?: string;
  children?: AdminMenuNode[];
}

export interface AdminPermissionItem {
  code: string;
  title: string;
}

export interface AdminPermissionGroup {
  key: string;
  title: string;
  permissions: AdminPermissionItem[];
}

export const ADMIN_MENU_TREE: AdminMenuNode[] = [
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
      { key: "store-list", title: "店铺列表", path: "/store/list" },
      { key: "store-category", title: "店铺分类", path: "/store/category" }
    ]
  },
  {
    key: "product",
    title: "商品管理",
    children: [
      { key: "product-list", title: "商品列表", path: "/product/list" },
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
      { key: "trade-settlement", title: "分账配置", path: "/trade/settlement" },
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

export const ADMIN_PERMISSION_GROUPS: AdminPermissionGroup[] = [
  {
    key: "auth",
    title: "权限管理",
    permissions: [
      { code: "auth:admin:add", title: "新增管理员" },
      { code: "auth:admin:edit", title: "编辑管理员" },
      { code: "auth:school-admin-apply:view", title: "查看管理员申请" },
      { code: "auth:school-admin-apply:review", title: "处理管理员申请" },
      { code: "auth:school-admin-apply:assign", title: "分配学校管理员账号" },
      { code: "auth:role:add", title: "新增角色" },
      { code: "auth:role:edit", title: "编辑角色" },
      { code: "auth:menu:edit", title: "配置菜单权限" }
    ]
  },
  {
    key: "message",
    title: "消息通知",
    permissions: [
      { code: "message:template:add", title: "新增消息模板" },
      { code: "message:template:edit", title: "编辑消息模板" }
    ]
  },
  {
    key: "operation",
    title: "运营配置",
    permissions: [
      { code: "operation:banner:add", title: "新增轮播图" },
      { code: "operation:banner:edit", title: "编辑轮播图" },
      { code: "operation:recommend:add", title: "新增推荐位" },
      { code: "operation:recommend:edit", title: "编辑推荐位" },
      { code: "operation:search:add", title: "新增搜索热词" },
      { code: "operation:search:edit", title: "编辑搜索热词" },
      { code: "operation:help:add", title: "新增帮助文章" },
      { code: "operation:help:edit", title: "编辑帮助文章" }
    ]
  },
  {
    key: "content",
    title: "内容与分类",
    permissions: [
      { code: "post:category:add", title: "新增帖子分类" },
      { code: "post:category:edit", title: "编辑帖子分类" },
      { code: "store:category:add", title: "新增店铺分类" },
      { code: "store:category:edit", title: "编辑店铺分类" },
      { code: "product:category:add", title: "新增商品分类" },
      { code: "product:category:edit", title: "编辑商品分类" },
      { code: "post:report:review", title: "审核帖子举报" },
      { code: "post:review", title: "审核帖子" }
    ]
  },
  {
    key: "system",
    title: "系统设置",
    permissions: [
      { code: "system:basic:add", title: "新增基础配置" },
      { code: "system:basic:edit", title: "编辑基础配置" },
      { code: "system:dict:add", title: "新增字典配置" },
      { code: "system:dict:edit", title: "编辑字典配置" }
    ]
  },
  {
    key: "trade",
    title: "审核与交易",
    permissions: [
      { code: "verify:view", title: "查看认证申请" },
      { code: "verify:approve", title: "通过认证申请" },
      { code: "verify:reject", title: "驳回认证申请" },
      { code: "store:apply:view", title: "查看入驻申请" },
      { code: "store:apply:approve", title: "通过入驻申请" },
      { code: "store:apply:reject", title: "驳回入驻申请" },
      { code: "order:view", title: "查看订单列表" },
      { code: "order:export", title: "导出订单列表" },
      { code: "wallet:view", title: "查看钱包账户" },
      { code: "wallet:export", title: "导出钱包账户" },
      { code: "settlement:config", title: "配置店铺分账" },
      { code: "refund:review", title: "审核退款" },
      { code: "withdraw:review", title: "审核提现" }
    ]
  }
];

function flattenMenuPaths(tree: AdminMenuNode[]): string[] {
  return tree.flatMap((item): string[] => {
    const children: string[] = item.children ? flattenMenuPaths(item.children) : [];
    return item.path ? [item.path, ...children] : children;
  });
}

export const ADMIN_MENU_PATHS = flattenMenuPaths(ADMIN_MENU_TREE);
export const ADMIN_PERMISSION_CODES = ADMIN_PERMISSION_GROUPS.flatMap((group) => group.permissions.map((item) => item.code));
