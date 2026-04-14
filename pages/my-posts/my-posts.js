const { getSelectedSchool } = require("../../utils/school-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { fetchMyPosts } = require("../../utils/posts-api");

Page({
  data: {
    statusBarHeight: 20,
    selectedSchool: "",
    posts: [],
    loadErrorText: ""
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
  },

  async onShow() {
    const selectedSchool = getSelectedSchool();

    try {
      await ensureMiniSession();
      const posts = await fetchMyPosts();
      this.setData({
        selectedSchool,
        posts,
        loadErrorText: ""
      });
    } catch (error) {
      this.setData({
        selectedSchool,
        posts: [],
        loadErrorText: "我的发布加载失败，请稍后重试。"
      });
    }
  },

  openPostDetail(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) {
      return;
    }
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${id}`
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
