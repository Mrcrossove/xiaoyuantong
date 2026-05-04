const { shopCategories } = require("../../utils/store-config");
const { fetchStoreList } = require("../../utils/stores-api");
const { getStorefrontSchool, setStorefrontSchool } = require("../../utils/school-state");
const { getProvinceSchoolGroups, filterProvinceSchoolGroups } = require("../../utils/school-catalog");
const { normalizeStoreList } = require("../../utils/store-cover");
const { refreshMessageBadge } = require("../../utils/message-badge");

const DEFAULT_EXPANDED_PROVINCES = [];

Page({
  data: {
    statusBarHeight: 20,
    keyword: "",
    selectedSchool: "",
    schoolPickerOpen: false,
    schoolKeyword: "",
    provinceSchoolGroups: [],
    filteredProvinceSchoolGroups: [],
    expandedProvinces: DEFAULT_EXPANDED_PROVINCES,
    categories: shopCategories,
    banners: [],
    shops: [],
    loadErrorText: "",
    messageBadgeCount: 0,
    messageBadgeText: ""
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const provinceSchoolGroups = getProvinceSchoolGroups();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      provinceSchoolGroups,
      filteredProvinceSchoolGroups: this.buildDisplayGroups("", provinceSchoolGroups, DEFAULT_EXPANDED_PROVINCES)
    });
  },

  async onShow() {
    const selectedSchool = getStorefrontSchool();
    refreshMessageBadge(this, { school: selectedSchool });
    await this.loadStores(selectedSchool);
  },

  buildDisplayGroups(keyword, sourceGroups = this.data.provinceSchoolGroups, expandedProvinces = this.data.expandedProvinces) {
    const trimmed = String(keyword || "").trim();
    const groups = trimmed ? filterProvinceSchoolGroups(trimmed) : sourceGroups;
    return groups.map((group) => {
      const expanded = trimmed ? true : expandedProvinces.includes(group.province);
      return {
        province: group.province,
        schools: expanded ? group.schools : [],
        totalSchools: group.schools.length,
        expanded
      };
    });
  },

  getExpandedProvincesForKeyword(keyword) {
    const trimmed = String(keyword || "").trim();
    if (!trimmed) {
      return DEFAULT_EXPANDED_PROVINCES.slice();
    }
    return filterProvinceSchoolGroups(trimmed).map((group) => group.province);
  },

  async loadStores(selectedSchool) {
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

  openSchoolPicker() {
    this.setData({
      schoolPickerOpen: true,
      filteredProvinceSchoolGroups: this.buildDisplayGroups(this.data.schoolKeyword)
    });
  },

  closeSchoolPicker() {
    this.setData({
      schoolPickerOpen: false,
      schoolKeyword: "",
      expandedProvinces: DEFAULT_EXPANDED_PROVINCES.slice(),
      filteredProvinceSchoolGroups: this.buildDisplayGroups("", this.data.provinceSchoolGroups, DEFAULT_EXPANDED_PROVINCES)
    });
  },

  onSchoolKeywordInput(event) {
    const schoolKeyword = event.detail.value;
    const expandedProvinces = this.getExpandedProvincesForKeyword(schoolKeyword);
    this.setData({
      schoolKeyword,
      expandedProvinces,
      filteredProvinceSchoolGroups: this.buildDisplayGroups(schoolKeyword, this.data.provinceSchoolGroups, expandedProvinces)
    });
  },

  toggleProvince(event) {
    const { province } = event.currentTarget.dataset;
    if (!province) return;
    const expandedSet = new Set(this.data.expandedProvinces || []);
    if (expandedSet.has(province)) {
      expandedSet.delete(province);
    } else {
      expandedSet.add(province);
    }
    const expandedProvinces = Array.from(expandedSet);
    this.setData({
      expandedProvinces,
      filteredProvinceSchoolGroups: this.buildDisplayGroups(this.data.schoolKeyword, this.data.provinceSchoolGroups, expandedProvinces)
    });
  },

  selectSchool(event) {
    const { school } = event.currentTarget.dataset;
    if (!school) return;
    const selectedSchool = setStorefrontSchool(school);
    this.setData({
      schoolPickerOpen: false,
      schoolKeyword: "",
      expandedProvinces: DEFAULT_EXPANDED_PROVINCES.slice()
    });
    this.loadStores(selectedSchool);
  },

  onKeywordInput(event) {
    this.setData({
      keyword: event.detail.value
    });
  },

  openSearchPage() {
    const keyword = encodeURIComponent((this.data.keyword || "").trim());
    wx.navigateTo({
      url: `/pages/search/search?keyword=${keyword}&school=${encodeURIComponent(this.data.selectedSchool || "")}`
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

  , stopTap() {}
});
