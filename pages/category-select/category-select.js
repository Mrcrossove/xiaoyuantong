const { getPublishType } = require("../../utils/publish-config");
const { requireLogin } = require("../../utils/login-guard");

Page({
  data: {
    statusBarHeight: 20,
    type: "tree-hole",
    pageTitle: "情感树洞",
    submitText: "发布",
    categories: []
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const type = options.type || "tree-hole";
    const config = getPublishType(type);

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      type,
      pageTitle: config.label,
      submitText: config.submitText,
      categories: config.categories
    });
  },

  goBack() {
    wx.navigateBack();
  },

  selectCategory(event) {
    const { category } = event.currentTarget.dataset;
    requireLogin({
      title: "发布前请先登录",
      content: "浏览内容无需登录，发布内容时需要微信授权登录。"
    }).then((passed) => {
      if (!passed) return;
      wx.navigateTo({
        url: `/pages/publish/publish?type=${this.data.type}&category=${encodeURIComponent(category)}`
      });
    });
  }
});
