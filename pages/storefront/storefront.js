const { shopCategories } = require("../../utils/store-config");
const { fetchStoreList } = require("../../utils/stores-api");
const { getSelectedSchool } = require("../../utils/school-state");
const { normalizeStoreList } = require("../../utils/store-cover");

Page({
  data: {
    statusBarHeight: 20,
    keyword: "",
    selectedSchool: "",
    categories: shopCategories,
    banners: [],
    shops: [],
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
      const result = await fetchStoreList({
        school: selectedSchool
      });
      this.setData({
        selectedSchool,
        banners: result.banners || [],
        shops: normalizeStoreList(result.list || []),
        loadErrorText: ""
      });
    } catch (error) {
      this.setData({
        selectedSchool,
        banners: [],
        shops: [],
        loadErrorText: "店铺加载失败，请稍后重试。"
      });
    }
  },

  onKeywordInput(event) {
    this.setData({
      keyword: event.detail.value
    });
  },

  openSearchPage() {
    const keyword = encodeURIComponent((this.data.keyword || "").trim());
    wx.navigateTo({
      url: `/pages/search/search?keyword=${keyword}`
    });
  },

  openCategoryPage(event) {
    const { key } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/store-category/store-category?key=${key}`
    });
  },

  openRecommendStores() {
    wx.navigateTo({
      url: "/pages/store-category/store-category?key=student"
    });
  },

  openStoreDetail(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/store-detail/store-detail?id=${id}`
    });
  },

  goOpenShop() {
    wx.navigateTo({
      url: "/pages/open-shop/open-shop"
    });
  },

  goHome() {
    wx.redirectTo({
      url: "/pages/index/index"
    });
  },

  goMessage() {
    wx.redirectTo({
      url: "/pages/message/message"
    });
  },

  goProfile() {
    wx.redirectTo({
      url: "/pages/profile/profile"
    });
  }
});
