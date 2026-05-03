const { fetchStoreList } = require("../../utils/stores-api");
const { getSelectedSchool } = require("../../utils/school-state");
const { normalizeStoreList } = require("../../utils/store-cover");
const { getStoreGroupTitle } = require("../../utils/store-config");

function buildSectionsFromList(list) {
  const sectionMap = new Map();
  normalizeStoreList(list || []).forEach((item) => {
    const current = sectionMap.get(item.sectionKey) || {
      key: item.sectionKey,
      label: item.sectionLabel,
      shops: []
    };

    current.shops.push({
      id: item.detailId,
      name: item.name,
      subtitle: item.subtitle,
      orderText: item.orderText || "新店",
      paidAmountText: item.paidAmountText || "",
      distance: item.distance,
      tags: item.tags || [],
      cover: item.cover,
      coverMode: item.coverMode,
      isRecommendedStore: !!item.isRecommendedStore,
      recommendTitle: item.recommendTitle || "",
      hasRecommendedProduct: !!item.hasRecommendedProduct,
      recommendedProductName: item.recommendedProductName || "",
      recommendedProductPrice: item.recommendedProductPrice || ""
    });

    sectionMap.set(item.sectionKey, current);
  });

  return Array.from(sectionMap.values());
}

Page({
  data: {
    statusBarHeight: 20,
    selectedSchool: "",
    keyword: "",
    pageTitle: "学生商家",
    groupKey: "student",
    sections: [],
    activeSectionKey: "",
    activeShops: []
  },

  async onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const groupKey = options.key || "student";
    const selectedSchool = getSelectedSchool();

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      groupKey,
      selectedSchool,
      pageTitle: getStoreGroupTitle(groupKey)
    });

    await this.loadStoreCategoryData(groupKey, selectedSchool);
  },

  async onShow() {
    const selectedSchool = getSelectedSchool();
    if (selectedSchool !== this.data.selectedSchool) {
      this.setData({ selectedSchool });
      await this.loadStoreCategoryData(this.data.groupKey, selectedSchool);
    }
  },

  async loadStoreCategoryData(groupKey, selectedSchool) {
    try {
      const result = await fetchStoreList({
        school: selectedSchool,
        groupKey
      });
      const sections = buildSectionsFromList(result.list || []);
      const firstSection = sections[0] || { key: "", shops: [] };
      this.setData({
        pageTitle: getStoreGroupTitle(groupKey),
        sections,
        activeSectionKey: firstSection.key,
        activeShops: firstSection.shops
      });
    } catch (error) {
      this.setData({
        sections: [],
        activeSectionKey: "",
        activeShops: []
      });
      wx.showToast({
        title: "加载店铺失败",
        icon: "none"
      });
    }
  },

  onKeywordInput(event) {
    this.setData({
      keyword: event.detail.value
    });
  },

  switchSection(event) {
    const { key } = event.currentTarget.dataset;
    const activeSection = this.data.sections.find((section) => section.key === key);
    if (!activeSection || activeSection.key === this.data.activeSectionKey) {
      return;
    }

    this.setData({
      activeSectionKey: activeSection.key,
      activeShops: activeSection.shops
    });
  },

  goBack() {
    wx.navigateBack();
  },

  enterShop(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/store-detail/store-detail?id=${id}`
    });
  }
});
