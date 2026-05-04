const { buildAvatarView } = require("../../utils/avatar");
const { getSelectedSchool, setSelectedSchool } = require("../../utils/school-state");
const { getVerificationInfo, setVerificationInfo, clearVerificationInfo } = require("../../utils/verification-state");
const { getToken, ensureMiniSession, clearSession, getProfile, setProfile } = require("../../utils/mini-auth");
const { fetchCurrentVerification } = require("../../utils/verification-api");
const { fetchMiniProfile } = require("../../utils/profile-api");
const { refreshMessageBadge } = require("../../utils/message-badge");

const contentRouteMap = {
  order: "/pages/my-orders/my-orders",
  publish: "/pages/my-posts/my-posts",
  favorite: "/pages/my-favorites/my-favorites",
  shop: "/pages/open-shop/open-shop",
  address: "/pages/my-address/my-address"
};

const supportRouteMap = {
  about: "/pages/about/about"
};

function buildGuestUser() {
  const profile = getProfile();
  return {
    name: profile.nickname || "校园用户",
    avatar: buildAvatarView(profile.avatarUrl || ""),
    school: getSelectedSchool(),
    verified: false,
    statusText: "去认证"
  };
}

Page({
  data: {
    statusBarHeight: 20,
    isLoggedIn: !!getToken(),
    logoutText: getToken() ? "退出登录" : "立即登录",
    user: buildGuestUser(),
    contentItems: [
      { label: "我的订单", icon: "order" },
      { label: "我的发布", icon: "publish" },
      { label: "我的收藏", icon: "favorite" },
      { label: "我要开店", icon: "shop" },
      { label: "我的地址", icon: "address" }
    ],
    messageBadgeCount: 0,
    messageBadgeText: "",
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
    const isLoggedIn = !!getToken();
    this.setData({
      isLoggedIn,
      logoutText: isLoggedIn ? "退出登录" : "立即登录"
    });

    if (isLoggedIn) {
      refreshMessageBadge(this, { school: getSelectedSchool() });
      await this.syncVerification();
      return;
    }

    this.setData({
      user: buildGuestUser(),
      messageBadgeCount: 0,
      messageBadgeText: ""
    });
  },

  async syncVerification() {
    const selectedSchool = getSelectedSchool();
    let verificationInfo = getVerificationInfo();
    let profile = getProfile();

    try {
      await ensureMiniSession();
      const [remoteInfo, remoteProfile] = await Promise.all([fetchCurrentVerification(), fetchMiniProfile()]);
      verificationInfo = setVerificationInfo({
        ...remoteInfo,
        verified: !!remoteInfo.verified
      });
      profile = setProfile(remoteProfile);
    } catch (error) {}

    if (verificationInfo.verified && verificationInfo.school) {
      setSelectedSchool(verificationInfo.school);
    }

    this.setData({
      user: {
        name: profile.nickname || verificationInfo.name || "校园用户",
        avatar: buildAvatarView(profile.avatarUrl || ""),
        school: verificationInfo.school || selectedSchool,
        verified: !!verificationInfo.verified,
        statusText: verificationInfo.verified ? "已认证" : "去认证"
      }
    });
  },

  async handleLogout() {
    if (!this.data.isLoggedIn) {
      this.openLogin();
      return;
    }

    const { confirm } = await wx.showModal({
      title: "退出登录",
      content: "退出后会清除当前小程序账号缓存，是否继续？",
      confirmText: "退出",
      cancelText: "取消"
    });

    if (!confirm) {
      return;
    }

    try {
      clearSession();
      clearVerificationInfo();
      this.setData({
        isLoggedIn: false,
        logoutText: "立即登录",
        user: buildGuestUser()
      });
      wx.showToast({
        title: "已退出登录",
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

  openLogin() {
    wx.navigateTo({
      url: "/pages/login/login"
    });
  },

  ensureLoggedIn() {
    if (this.data.isLoggedIn) {
      return true;
    }

    this.openLogin();
    return false;
  },

  openCampusVerify() {
    if (!this.ensureLoggedIn()) return;
    wx.navigateTo({
      url: "/pages/campus-verify/campus-verify"
    });
  },

  openProfileEdit() {
    if (!this.ensureLoggedIn()) return;
    wx.navigateTo({
      url: "/pages/profile-edit/profile-edit"
    });
  },

  onContentTap(event) {
    const { icon } = event.currentTarget.dataset;
    const targetUrl = contentRouteMap[icon];

    if (!targetUrl) {
      return;
    }

    if (!this.ensureLoggedIn()) {
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
