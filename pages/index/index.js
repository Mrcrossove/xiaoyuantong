const { services, fabOptions } = require("../../utils/home-config");
const { fetchHomeBanners } = require("../../utils/banner-api");
const { fetchPostList } = require("../../utils/posts-api");
const { DEFAULT_SCHOOL, getSelectedSchool } = require("../../utils/school-state");
const { HOME_FEED_ALL, getHomeFeedScope, setHomeFeedScope } = require("../../utils/home-feed-state");
const { getProvinceSchoolGroups, filterProvinceSchoolGroups } = require("../../utils/school-catalog");

const DEFAULT_HOME_BANNER = {
  id: "default-recruit",
  title: "校园管理员招募中",
  imageUrl: "",
  linkUrl: "",
  isDefault: true
};

Page({
  data: {
    services,
    fabOptions,
    banners: [],
    displayBanners: [DEFAULT_HOME_BANNER],
    posts: [],
    searchKeyword: "",
    provinceSchoolGroups: [],
    filteredProvinceSchoolGroups: [],
    selectedFeedMode: "school",
    selectedFeedSchool: DEFAULT_SCHOOL,
    selectedFeedLabel: DEFAULT_SCHOOL,
    businessSchool: DEFAULT_SCHOOL,
    schoolKeyword: "",
    schoolPickerOpen: false,
    fabOpen: false,
    statusBarHeight: 20,
    postsLoading: false,
    postsErrorText: "",
    bannerCurrent: 0
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const provinceSchoolGroups = getProvinceSchoolGroups();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      provinceSchoolGroups,
      filteredProvinceSchoolGroups: provinceSchoolGroups
    });
  },

  onShow() {
    const businessSchool = getSelectedSchool();
    this.applyFeedScope(getHomeFeedScope(businessSchool), businessSchool);
  },

  async applyFeedScope(feedScope, businessSchool = getSelectedSchool()) {
    const selectedFeedMode = feedScope.mode || "school";
    const selectedFeedSchool = feedScope.school || "";
    const selectedFeedLabel = feedScope.label || (selectedFeedMode === "all" ? "全网" : businessSchool);
    const schoolKeyword = "";
    this.setData({
      businessSchool,
      selectedFeedMode,
      selectedFeedSchool,
      selectedFeedLabel,
      banners: [],
      displayBanners: [DEFAULT_HOME_BANNER],
      bannerCurrent: 0,
      schoolKeyword,
      filteredProvinceSchoolGroups: this.filterSchoolGroups(schoolKeyword),
      postsLoading: true,
      postsErrorText: ""
    });

    try {
      const bannerSchool = selectedFeedMode === "all" ? businessSchool : selectedFeedSchool;
      const postQuery =
        selectedFeedMode === "all"
          ? {
              page: 1,
              pageSize: 20,
              scope: "all",
              excludeSchool: businessSchool
            }
          : {
              page: 1,
              pageSize: 20,
              scope: "school",
              school: selectedFeedSchool
            };

      const [postResult, bannerResult] = await Promise.all([
        fetchPostList(postQuery),
        fetchHomeBanners(bannerSchool).catch(() => ({ list: [] }))
      ]);

      this.setData({
        posts: postResult.list || [],
        banners: bannerResult.list || [],
        displayBanners: (bannerResult.list || []).length ? bannerResult.list : [DEFAULT_HOME_BANNER],
        postsErrorText: ""
      });
    } catch (error) {
      this.setData({
        posts: [],
        postsErrorText: "帖子加载失败，请稍后重试。"
      });
    } finally {
      this.setData({
        postsLoading: false
      });
    }
  },

  filterSchoolGroups(keyword) {
    return filterProvinceSchoolGroups(keyword);
  },

  openSchoolPicker() {
    this.setData({
      schoolPickerOpen: true,
      filteredProvinceSchoolGroups: this.filterSchoolGroups(this.data.schoolKeyword)
    });
  },

  closeSchoolPicker() {
    if (!this.data.schoolPickerOpen) {
      return;
    }
    this.setData({
      schoolPickerOpen: false,
      schoolKeyword: "",
      filteredProvinceSchoolGroups: this.filterSchoolGroups("")
    });
  },

  onSchoolKeywordInput(event) {
    const schoolKeyword = event.detail.value;
    this.setData({
      schoolKeyword,
      filteredProvinceSchoolGroups: this.filterSchoolGroups(schoolKeyword)
    });
  },

  selectSchool(event) {
    const { school } = event.currentTarget.dataset;
    if (!school) {
      return;
    }
    const nextFeedScope = setHomeFeedScope(school, this.data.businessSchool || DEFAULT_SCHOOL);
    this.setData({
      schoolPickerOpen: false
    });
    this.applyFeedScope(nextFeedScope, this.data.businessSchool || DEFAULT_SCHOOL);
  },

  selectAllNetwork() {
    const nextFeedScope = setHomeFeedScope(HOME_FEED_ALL, this.data.businessSchool || DEFAULT_SCHOOL);
    this.setData({
      schoolPickerOpen: false
    });
    this.applyFeedScope(nextFeedScope, this.data.businessSchool || DEFAULT_SCHOOL);
  },

  onSearchKeywordInput(event) {
    this.setData({
      searchKeyword: event.detail.value
    });
  },

  openSearchPage() {
    const keyword = encodeURIComponent((this.data.searchKeyword || "").trim());
    wx.navigateTo({
      url: `/pages/search/search?keyword=${keyword}`
    });
  },

  openSchoolAdminApply() {
    wx.navigateTo({
      url: "/pages/school-admin-apply/school-admin-apply"
    });
  },

  onBannerChange(event) {
    this.setData({
      bannerCurrent: Number(event.detail.current || 0)
    });
  },

  openHomeBanner(event) {
    const { link, isDefault } = event.currentTarget.dataset;
    if (isDefault) {
      this.openSchoolAdminApply();
      return;
    }

    if (!link) {
      return;
    }

    if (String(link).startsWith("/pages/")) {
      wx.navigateTo({
        url: link
      });
      return;
    }

    wx.showToast({
      title: "暂不支持该跳转地址",
      icon: "none"
    });
  },

  stopTap() {},

  toggleFabMenu() {
    this.setData({
      fabOpen: !this.data.fabOpen
    });
  },

  closeFabMenu() {
    if (!this.data.fabOpen) {
      return;
    }
    this.setData({
      fabOpen: false
    });
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

  goMessage() {
    wx.redirectTo({
      url: "/pages/message/message"
    });
  },

  goStorefront() {
    wx.redirectTo({
      url: "/pages/storefront/storefront"
    });
  },

  goProfile() {
    wx.redirectTo({
      url: "/pages/profile/profile"
    });
  },

  onFabOptionTap(event) {
    const { type } = event.currentTarget.dataset;
    this.setData({
      fabOpen: false
    });
    wx.navigateTo({
      url: `/pages/category-select/category-select?type=${type}`
    });
  },

  noop() {}
});
