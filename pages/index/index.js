const { services, fabOptions } = require("../../utils/home-config");
const { fetchHomeBanners } = require("../../utils/banner-api");
const { fetchPostList } = require("../../utils/posts-api");
const { buildAvatarView } = require("../../utils/avatar");
const { getProfile, setProfile } = require("../../utils/mini-auth");
const { fetchMiniProfile } = require("../../utils/profile-api");
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

const DEFAULT_EXPANDED_PROVINCES = [];
const FLOATING_CATEGORY_SHOW_TOP = 520;
const BACK_TO_FEED_SHOW_TOP = 760;

const floatingCategories = [
  { label: "全部", category: "" },
  ...services.map((item) => ({
    label: item.label,
    category: item.category
  }))
];

function mapPostView(post) {
  return {
    ...post,
    authorAvatar: buildAvatarView(post.authorAvatar || "")
  };
}

Page({
  data: {
    services,
    floatingCategories,
    fabOptions,
    banners: [],
    displayBanners: [DEFAULT_HOME_BANNER],
    posts: [],
    activeServiceCategory: "",
    searchKeyword: "",
    provinceSchoolGroups: [],
    filteredProvinceSchoolGroups: [],
    selectedFeedMode: "school",
    selectedFeedSchool: DEFAULT_SCHOOL,
    selectedFeedLabel: DEFAULT_SCHOOL,
    businessSchool: DEFAULT_SCHOOL,
    schoolKeyword: "",
    schoolPickerOpen: false,
    expandedProvinces: DEFAULT_EXPANDED_PROVINCES,
    fabOpen: false,
    statusBarHeight: 20,
    postsLoading: false,
    postsErrorText: "",
    bannerCurrent: 0,
    showFloatingCategories: false,
    showBackToFeed: false,
    userAvatar: buildAvatarView("")
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

  onShow() {
    const businessSchool = getSelectedSchool();
    this.syncProfile();
    this.applyFeedScope(getHomeFeedScope(businessSchool), businessSchool);
  },

  onPageScroll(event) {
    const scrollTop = Number((event && event.scrollTop) || 0);
    const showFloatingCategories = scrollTop > FLOATING_CATEGORY_SHOW_TOP;
    const showBackToFeed = scrollTop > BACK_TO_FEED_SHOW_TOP;

    if (
      showFloatingCategories !== this.data.showFloatingCategories ||
      showBackToFeed !== this.data.showBackToFeed
    ) {
      this.setData({
        showFloatingCategories,
        showBackToFeed
      });
    }
  },

  async syncProfile() {
    const localProfile = getProfile();
    this.setData({
      userAvatar: buildAvatarView(localProfile.avatarUrl || "")
    });
    try {
      const remoteProfile = await fetchMiniProfile();
      setProfile(remoteProfile);
      this.setData({
        userAvatar: buildAvatarView(remoteProfile.avatarUrl || "")
      });
    } catch (error) {}
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

  async applyFeedScope(feedScope, businessSchool = getSelectedSchool()) {
    const selectedFeedMode = feedScope.mode || "school";
    const selectedFeedSchool = feedScope.school || "";
    const selectedFeedLabel = feedScope.label || (selectedFeedMode === "all" ? "全网" : businessSchool);
    const schoolKeyword = "";
    const expandedProvinces = DEFAULT_EXPANDED_PROVINCES.slice();

    this.setData({
      businessSchool,
      selectedFeedMode,
      selectedFeedSchool,
      selectedFeedLabel,
      banners: [],
      displayBanners: [DEFAULT_HOME_BANNER],
      bannerCurrent: 0,
      schoolKeyword,
      expandedProvinces,
      filteredProvinceSchoolGroups: this.buildDisplayGroups(schoolKeyword, this.data.provinceSchoolGroups, expandedProvinces),
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
      const activeServiceCategory = String(this.data.activeServiceCategory || "").trim();
      if (activeServiceCategory) {
        postQuery.category = activeServiceCategory;
      }

      const [postResult, bannerResult] = await Promise.all([
        fetchPostList(postQuery),
        fetchHomeBanners(bannerSchool).catch(() => ({ list: [] }))
      ]);

      this.setData({
        posts: (postResult.list || []).map(mapPostView),
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

  openSchoolPicker() {
    this.setData({
      schoolPickerOpen: true,
      filteredProvinceSchoolGroups: this.buildDisplayGroups(this.data.schoolKeyword)
    });
  },

  closeSchoolPicker() {
    if (!this.data.schoolPickerOpen) {
      return;
    }
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
    if (!province) {
      return;
    }

    const expandedSet = new Set(this.data.expandedProvinces || []);
    if (expandedSet.has(province)) {
      expandedSet.delete(province);
    } else {
      expandedSet.add(province);
    }

    const expandedProvinces = Array.from(expandedSet);
    const keyword = String(this.data.schoolKeyword || "").trim();
    this.setData({
      expandedProvinces,
      filteredProvinceSchoolGroups: this.buildDisplayGroups(keyword, this.data.provinceSchoolGroups, expandedProvinces)
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

  selectServiceCategory(event) {
    const { category } = event.currentTarget.dataset;
    const nextCategory = category === this.data.activeServiceCategory ? "" : String(category || "");
    this.setData({
      activeServiceCategory: nextCategory
    });
    this.applyFeedScope(getHomeFeedScope(this.data.businessSchool || DEFAULT_SCHOOL), this.data.businessSchool || DEFAULT_SCHOOL);
  },

  scrollToFeedTop() {
    wx.pageScrollTo({
      selector: ".feed",
      duration: 280,
      fail() {
        wx.pageScrollTo({
          scrollTop: 0,
          duration: 280
        });
      }
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

  goProfileEdit() {
    wx.navigateTo({
      url: "/pages/profile-edit/profile-edit"
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
