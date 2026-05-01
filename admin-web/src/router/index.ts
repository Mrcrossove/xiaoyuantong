import { createRouter, createWebHistory } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("../views/login/LoginView.vue"),
      meta: { title: "登录", public: true }
    },
    {
      path: "/",
      component: () => import("../layouts/BasicLayout.vue"),
      children: [
        { path: "", redirect: "/dashboard/overview" },
        { path: "dashboard/overview", component: () => import("../views/dashboard/DashboardOverview.vue"), meta: { title: "数据概览" } },
        { path: "account", component: () => import("../views/account/AccountView.vue"), meta: { title: "账号设置" } },
        { path: "school/list", component: () => import("../views/school/SchoolListView.vue"), meta: { title: "高校列表", menuPath: "/school/list" } },
        { path: "school/content", component: () => import("../views/school/SchoolContentView.vue"), meta: { title: "高校内容统计", menuPath: "/school/content" } },
        { path: "user/list", component: () => import("../views/user/UserListView.vue"), meta: { title: "用户列表", menuPath: "/user/list" } },
        { path: "user/publish", component: () => import("../views/user/UserPublishView.vue"), meta: { title: "用户发布记录", menuPath: "/user/publish" } },
        { path: "verify/list", component: () => import("../views/verify/VerifyListView.vue"), meta: { title: "认证申请", menuPath: "/verify/list" } },
        { path: "post/list", component: () => import("../views/post/PostListView.vue"), meta: { title: "帖子列表", menuPath: "/post/list" } },
        { path: "post/category", component: () => import("../views/post/PostCategoryView.vue"), meta: { title: "帖子分类", menuPath: "/post/category" } },
        { path: "post/report", component: () => import("../views/post/PostReportView.vue"), meta: { title: "举报管理", menuPath: "/post/report" } },
        { path: "store/apply", component: () => import("../views/store/StoreApplyView.vue"), meta: { title: "入驻申请", menuPath: "/store/apply" } },
        { path: "store/list", component: () => import("../views/store/StoreListView.vue"), meta: { title: "店铺管理", menuPath: "/store/list" } },
        { path: "store/detail/:id", component: () => import("../views/store/StoreDetailView.vue"), meta: { title: "店铺经营看板", menuPath: "/store/list" } },
        { path: "store/category", component: () => import("../views/store/StoreCategoryView.vue"), meta: { title: "店铺分类", menuPath: "/store/category" } },
        { path: "product/list", component: () => import("../views/product/ProductListView.vue"), meta: { title: "商品巡检", menuPath: "/product/list" } },
        { path: "product/spec", component: () => import("../views/product/ProductSpecView.vue"), meta: { title: "商品规格管理", menuPath: "/product/spec" } },
        { path: "product/category", component: () => import("../views/product/ProductCategoryView.vue"), meta: { title: "商品分类", menuPath: "/product/category" } },
        { path: "message/system", component: () => import("../views/message/SystemMessageView.vue"), meta: { title: "系统消息", menuPath: "/message/system" } },
        { path: "message/interactive", component: () => import("../views/message/InteractiveMessageView.vue"), meta: { title: "互动消息", menuPath: "/message/interactive" } },
        { path: "message/send", component: () => import("../views/message/SendRecordView.vue"), meta: { title: "发送记录", menuPath: "/message/send" } },
        { path: "message/template", component: () => import("../views/message/MessageTemplateView.vue"), meta: { title: "消息模板", menuPath: "/message/template" } },
        { path: "operation/banner", component: () => import("../views/operation/BannerConfigView.vue"), meta: { title: "轮播图配置", menuPath: "/operation/banner" } },
        { path: "operation/recommend", component: () => import("../views/operation/RecommendConfigView.vue"), meta: { title: "推荐位配置", menuPath: "/operation/recommend" } },
        { path: "operation/search-word", component: () => import("../views/operation/SearchWordView.vue"), meta: { title: "搜索热词", menuPath: "/operation/search-word" } },
        { path: "operation/help", component: () => import("../views/operation/HelpCenterView.vue"), meta: { title: "帮助中心", menuPath: "/operation/help" } },
        { path: "trade/order", component: () => import("../views/trade/OrderListView.vue"), meta: { title: "订单列表", menuPath: "/trade/order" } },
        { path: "trade/refund", component: () => import("../views/trade/RefundListView.vue"), meta: { title: "退款管理", menuPath: "/trade/refund" } },
        { path: "trade/wallet", component: () => import("../views/trade/WalletAccountView.vue"), meta: { title: "钱包账户", menuPath: "/trade/wallet" } },
        { path: "trade/settlement", component: () => import("../views/trade/SettlementConfigView.vue"), meta: { title: "分账配置", menuPath: "/trade/settlement" } },
        { path: "trade/withdraw", component: () => import("../views/trade/WithdrawListView.vue"), meta: { title: "提现审核", menuPath: "/trade/withdraw" } },
        { path: "stat/user", component: () => import("../views/stat/UserStatView.vue"), meta: { title: "用户统计", menuPath: "/stat/user" } },
        { path: "stat/post", component: () => import("../views/stat/PostStatView.vue"), meta: { title: "帖子统计", menuPath: "/stat/post" } },
        { path: "stat/store", component: () => import("../views/stat/StoreStatView.vue"), meta: { title: "店铺统计", menuPath: "/stat/store" } },
        { path: "stat/order", component: () => import("../views/stat/OrderStatView.vue"), meta: { title: "订单统计", menuPath: "/stat/order" } },
        { path: "system/basic", component: () => import("../views/system/BasicConfigView.vue"), meta: { title: "基础配置", menuPath: "/system/basic" } },
        { path: "system/dict", component: () => import("../views/system/DictConfigView.vue"), meta: { title: "字典配置", menuPath: "/system/dict" } },
        { path: "system/store-approval", component: () => import("../views/system/StoreProductApprovalView.vue"), meta: { title: "商品变更审批", menuPath: "/system/store-approval" } },
        { path: "system/log", component: () => import("../views/system/OperationLogView.vue"), meta: { title: "操作日志", menuPath: "/system/log" } },
        { path: "system/version", component: () => import("../views/system/VersionInfoView.vue"), meta: { title: "版本信息", menuPath: "/system/version" } },
        { path: "auth/admin", component: () => import("../views/auth/AdminListView.vue"), meta: { title: "管理员列表", menuPath: "/auth/admin" } },
        { path: "auth/school-admin-apply", component: () => import("../views/auth/SchoolAdminApplyView.vue"), meta: { title: "管理员申请", menuPath: "/auth/school-admin-apply" } },
        { path: "auth/role", component: () => import("../views/auth/RoleListView.vue"), meta: { title: "角色列表", menuPath: "/auth/role" } },
        { path: "auth/menu", component: () => import("../views/auth/MenuPermissionView.vue"), meta: { title: "菜单权限", menuPath: "/auth/menu" } }
      ]
    },
    { path: "/:pathMatch(.*)*", redirect: "/dashboard/overview" }
  ]
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  const isPublic = Boolean(to.meta.public);

  if (isPublic) {
    if (to.path === "/login" && authStore.isLogin) {
      return authStore.mustChangePassword ? "/account" : "/dashboard/overview";
    }
    return true;
  }

  if (!authStore.isLogin) return `/login?redirect=${encodeURIComponent(to.fullPath)}`;

  if (authStore.mustChangePassword && to.path !== "/account") {
    ElMessage.warning("首次登录后需要先修改密码");
    return "/account";
  }

  const menuPath = String(to.meta.menuPath || to.path);
  if (to.path !== "/account" && !authStore.hasMenuAccess(menuPath)) {
    ElMessage.warning("当前账号无权访问该页面");
    return "/dashboard/overview";
  }

  return true;
});

export default router;
