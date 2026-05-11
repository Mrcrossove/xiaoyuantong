const { ensureMiniSession } = require("../../utils/mini-auth");

Page({
  data: {
    statusBarHeight: 20,
    loading: false,
    agreementChecked: false,
    redirectUrl: ""
  },

  onLoad(options = {}) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const redirectUrl = this.normalizeRedirectUrl(options.redirect || "");
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      redirectUrl
    });
  },

  async handleWechatLogin() {
    if (this.data.loading) {
      return;
    }

    if (!this.data.agreementChecked) {
      wx.showToast({
        title: "\u8bf7\u5148\u52fe\u9009\u540c\u610f\u7528\u6237\u534f\u8bae\u548c\u9690\u79c1\u653f\u7b56",
        icon: "none"
      });
      return;
    }

    this.setData({ loading: true });

    try {
      await ensureMiniSession({ forceFreshAccount: true });
      wx.showToast({
        title: "登录成功",
        icon: "success"
      });
      setTimeout(() => {
        this.goAfterLogin();
      }, 500);
    } catch (error) {
      wx.showToast({
        title: error && error.message ? error.message : "登录失败",
        icon: "none"
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  cancelLogin() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }

    wx.redirectTo({
      url: "/pages/index/index"
    });
  },

  toggleAgreement() {
    this.setData({
      agreementChecked: !this.data.agreementChecked
    });
  },

  openAgreement(event) {
    const type = event.currentTarget.dataset.type || "user";
    wx.navigateTo({
      url: `/pages/legal-agreement/legal-agreement?type=${type}`
    });
  },

  normalizeRedirectUrl(value) {
    let decoded = "";
    try {
      decoded = decodeURIComponent(String(value || ""));
    } catch (error) {
      decoded = String(value || "");
    }

    return /^\/pages\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+(\?.*)?$/.test(decoded) ? decoded : "";
  },

  goAfterLogin() {
    if (this.data.redirectUrl) {
      wx.redirectTo({
        url: this.data.redirectUrl
      });
      return;
    }

    this.goBackToProfile();
  },

  goBackToProfile() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }

    wx.redirectTo({
      url: "/pages/profile/profile"
    });
  }
});
