const { getAgreement } = require("../../utils/legal-agreements");

Page({
  data: {
    statusBarHeight: 20,
    agreement: getAgreement("user")
  },

  onLoad(query = {}) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      agreement: getAgreement(query.type)
    });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }

    wx.redirectTo({
      url: "/pages/index/index"
    });
  }
});
