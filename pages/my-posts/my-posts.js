const { getSelectedSchool } = require("../../utils/school-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { deletePost, fetchMyPosts } = require("../../utils/posts-api");

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

  async deletePost(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) {
      return;
    }

    const { confirm } = await wx.showModal({
      title: "\u5220\u9664\u5e16\u5b50",
      content: "\u5220\u9664\u540e\u5c06\u65e0\u6cd5\u6062\u590d\uff0c\u786e\u5b9a\u5220\u9664\u8fd9\u6761\u5e16\u5b50\u5417\uff1f",
      confirmText: "\u5220\u9664",
      confirmColor: "#e5484d",
      cancelText: "\u53d6\u6d88"
    });
    if (!confirm) {
      return;
    }

    try {
      await ensureMiniSession();
      await deletePost(id);
      this.setData({
        posts: (this.data.posts || []).filter((item) => String(item.id) !== String(id))
      });
      wx.showToast({
        title: "\u5df2\u5220\u9664",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "\u5220\u9664\u5931\u8d25",
        icon: "none"
      });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
