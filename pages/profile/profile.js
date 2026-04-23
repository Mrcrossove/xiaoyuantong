const { getSelectedSchool } = require("../../utils/school-state");
const { getVerificationInfo, setVerificationInfo, clearVerificationInfo } = require("../../utils/verification-state");
const { ensureMiniSession, clearSession, isDevtoolsEnv } = require("../../utils/mini-auth");
const { fetchCurrentVerification } = require("../../utils/verification-api");

const contentRouteMap = {
  order: "/pages/my-orders/my-orders",
  publish: "/pages/my-posts/my-posts",
  favorite: "/pages/my-favorites/my-favorites",
  shop: "/pages/open-shop/open-shop",
  address: "/pages/my-address/my-address",
  wallet: "/pages/wallet/wallet"
};

const supportRouteMap = {
  service: "/pages/customer-service/customer-service",
  about: "/pages/about/about"
};

function buildGuestUser() {
  return {
    name: "校园用户",
    school: getSelectedSchool(),
    verified: false,
    statusText: "去认证"
  };
}

Page({
  data: {
    statusBarHeight: 20,
    logoutText: "退出登录",
    user: buildGuestUser(),
    contentItems: [
      { label: "我的订单", icon: "order" },
      { label: "我的发布", icon: "publish" },
      { label: "我的收藏", icon: "favorite" },
      { label: "我要开店", icon: "shop" },
      { label: "我的地址", icon: "address" },
      { label: "我的钱包", icon: "wallet" }
    ],
    supportItems: [
      { label: "联系客服", icon: "service", arrow: false },
      { label: "关于我们", icon: "about", arrow: true }
    ]
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      logoutText: isDevtoolsEnv() ? "切换测试账号" : "退出登录"
    });
  },

  async onShow() {
    await this.syncVerification();
  },

  async syncVerification() {
    const selectedSchool = getSelectedSchool();
    let verificationInfo = getVerificationInfo();

    try {
      await ensureMiniSession();
      const remoteInfo = await fetchCurrentVerification();
      verificationInfo = setVerificationInfo({
        ...remoteInfo,
        verified: !!remoteInfo.verified
      });
    } catch (error) {}

    this.setData({
      user: {
        name: verificationInfo.name || "校园用户",
        school: verificationInfo.school || selectedSchool,
        verified: !!verificationInfo.verified,
        statusText: verificationInfo.verified ? "已认证" : "去认证"
      }
    });
  },

  async handleLogout() {
    const devMode = isDevtoolsEnv();
    const { confirm } = await wx.showModal({
      title: devMode ? "切换测试账号" : "退出登录",
      content: devMode
        ? "当前为开发环境。确认后会清除当前账户缓存，并直接创建一个新的测试账号。"
        : "退出后会清除当前小程序账户缓存，是否继续？",
      confirmText: devMode ? "切换" : "退出",
      cancelText: "取消"
    });

    if (!confirm) {
      return;
    }

    try {
      clearSession();
      wx.removeStorageSync("miniDeviceId");
      clearVerificationInfo();
      this.setData({
        user: buildGuestUser()
      });
      await ensureMiniSession({
        forceFreshAccount: devMode
      });
      await this.syncVerification();
      wx.showToast({
        title: devMode ? "已切换测试账号" : "已退出当前账户",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: "退出失败",
        icon: "none"
      });
    }
  },

  goHome() {
    wx.redirectTo({
      url: "/pages/index/index"
    });
  },

  goStorefront() {
    wx.redirectTo({
      url: "/pages/storefront/storefront"
    });
  },

  goMessage() {
    wx.redirectTo({
      url: "/pages/message/message"
    });
  },

  openCampusVerify() {
    wx.navigateTo({
      url: "/pages/campus-verify/campus-verify"
    });
  },

  onContentTap(event) {
    const { icon } = event.currentTarget.dataset;
    const targetUrl = contentRouteMap[icon];

    if (!targetUrl) {
      return;
    }

    wx.navigateTo({
      url: targetUrl
    });
  },

  onSupportTap(event) {
    const { icon } = event.currentTarget.dataset;
    const targetUrl = supportRouteMap[icon];

    if (!targetUrl) {
      return;
    }

    wx.navigateTo({
      url: targetUrl
    });
  }
});
