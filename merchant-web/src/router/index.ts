import { createRouter, createWebHistory } from "vue-router";
import { ElMessage } from "element-plus";
import { useMerchantAuthStore } from "../stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      component: () => import("../views/login/LoginView.vue"),
      meta: { title: "商家登录", public: true }
    },
    {
      path: "/",
      component: () => import("../layouts/MerchantLayout.vue"),
      children: [
        { path: "", redirect: "/dashboard" },
        {
          path: "dashboard",
          name: "merchant-dashboard",
          component: () => import("../views/dashboard/DashboardView.vue"),
          meta: { title: "工作台", menuPath: "/dashboard" }
        },
        {
          path: "store",
          name: "merchant-store",
          component: () => import("../views/store/StoreView.vue"),
          meta: { title: "店铺管理", menuPath: "/store" }
        },
        {
          path: "product",
          name: "merchant-product",
          component: () => import("../views/product/ProductView.vue"),
          meta: { title: "商品管理", menuPath: "/product" }
        },
        {
          path: "order",
          name: "merchant-order",
          component: () => import("../views/order/OrderView.vue"),
          meta: { title: "订单管理", menuPath: "/order" }
        },
        {
          path: "order/:id",
          name: "merchant-order-detail",
          component: () => import("../views/order/OrderDetailView.vue"),
          meta: { title: "订单详情", menuPath: "/order" }
        },
        {
          path: "refund",
          name: "merchant-refund",
          component: () => import("../views/refund/RefundView.vue"),
          meta: { title: "售后退款", menuPath: "/refund" }
        },
        {
          path: "refund/:id",
          name: "merchant-refund-detail",
          component: () => import("../views/refund/RefundDetailView.vue"),
          meta: { title: "退款详情", menuPath: "/refund" }
        },
        {
          path: "wallet",
          name: "merchant-wallet",
          component: () => import("../views/wallet/WalletView.vue"),
          meta: { title: "钱包结算", menuPath: "/wallet" }
        },
        {
          path: "referral",
          name: "merchant-referral",
          component: () => import("../views/referral/ReferralView.vue"),
          meta: { title: "推广获客", menuPath: "/referral" }
        },
        {
          path: "supply",
          name: "merchant-supply",
          component: () => import("../views/supply/SupplyRequestView.vue"),
          meta: { title: "商品补给申请", menuPath: "/supply" }
        },
        {
          path: "message",
          name: "merchant-message",
          component: () => import("../views/message/MessageView.vue"),
          meta: { title: "消息通知", menuPath: "/message" }
        },
        {
          path: "stat",
          name: "merchant-stat",
          component: () => import("../views/stat/StatView.vue"),
          meta: { title: "数据统计", menuPath: "/stat" }
        },
        {
          path: "account",
          name: "merchant-account",
          component: () => import("../views/account/AccountView.vue"),
          meta: { title: "账号设置", menuPath: "/account" }
        }
      ]
    },
    { path: "/:pathMatch(.*)*", redirect: "/dashboard" }
  ]
});

router.beforeEach((to) => {
  const authStore = useMerchantAuthStore();
  const isPublic = Boolean(to.meta.public);

  if (isPublic) {
    if (to.path === "/login" && authStore.isLogin) {
      return "/dashboard";
    }
    return true;
  }

  if (!authStore.isLogin) {
    return `/login?redirect=${encodeURIComponent(to.fullPath)}`;
  }

  const menuPath = String(to.meta.menuPath || to.path);
  if (!authStore.hasMenuAccess(menuPath)) {
    ElMessage.warning("当前账号无权访问该页面");
    return "/dashboard";
  }

  return true;
});

export default router;
