const { fetchFavoriteList } = require("../../utils/favorites-api");
const { ensureMiniSession } = require("../../utils/mini-auth");

const TABS = [
  { key: "posts", label: "\u6536\u85cf\u5e16\u5b50" },
  { key: "shops", label: "\u6536\u85cf\u5e97\u94fa" }
];

Page({
  data: {
    statusBarHeight: 20,
    tabs: TABS,
    activeTab: "posts",
    favoritePosts: [],
    favoriteShops: []
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
  },

  async onShow() {
    try {
      await ensureMiniSession();
      const result = await fetchFavoriteList();
      this.setData({
        favoritePosts: result.favoritePosts || [],
        favoriteShops: result.favoriteShops || []
      });
    } catch (error) {
      this.setData({
        favoritePosts: [],
        favoriteShops: []
      });
    }
  },

  switchTab(event) {
    const { key } = event.currentTarget.dataset;
    if (!key || key === this.data.activeTab) {
      return;
    }

    this.setData({
      activeTab: key
    });
  },

  openPostDetail(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${id}`
    });
  },

  openShopDetail(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/store-detail/store-detail?id=${id}`
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
