const { aboutInfo } = require("../../utils/profile-content");

Page({
  data: {
    statusBarHeight: 20,
    aboutInfo
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
