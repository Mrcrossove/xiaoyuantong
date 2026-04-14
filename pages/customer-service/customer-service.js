const { helpCards, contactList } = require("../../utils/profile-content");

Page({
  data: {
    statusBarHeight: 20,
    helpCards,
    contactList
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
  },

  copyText(event) {
    const { value } = event.currentTarget.dataset;
    if (!value) {
      return;
    }

    wx.setClipboardData({
      data: value
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
