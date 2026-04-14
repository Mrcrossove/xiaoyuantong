const { getSelectedSchool } = require("../../utils/school-state");
const { getVerificationInfo, setVerificationInfo } = require("../../utils/verification-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
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

Page({
  data: {
    statusBarHeight: 20,
    user: {
      name: "校园用户",
      school: "",
      verified: false,
      statusText: "去认证"
    },
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
      statusBarHeight: systemInfo.statusBarHeight || 20
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
