const { ensureMiniSession } = require("../../utils/mini-auth");

Page({
  data: {
    statusBarHeight: 20,
    loading: false
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
  },

  async handleWechatLogin() {
    if (this.data.loading) {
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
        this.goBackToProfile();
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
