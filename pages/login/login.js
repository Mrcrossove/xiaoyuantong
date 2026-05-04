const { ensureMiniSession } = require("../../utils/mini-auth");

Page({
  data: {
    statusBarHeight: 20,
    loading: false,
    agreementChecked: false
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
    wx.showModal({
      title: "\u9700\u8981\u767b\u5f55",
      content: "\u4f7f\u7528\u6821\u9662\u901a\u9700\u8981\u5148\u5b8c\u6210\u5fae\u4fe1\u6388\u6743\u767b\u5f55\u3002",
      confirmText: "\u6211\u77e5\u9053\u4e86",
      showCancel: false,
      success() {
        if (wx.exitMiniProgram) {
          wx.exitMiniProgram();
        }
      }
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
