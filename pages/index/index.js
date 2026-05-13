const { services, fabOptions } = require("../../utils/home-config");
const { fetchHomeBanners } = require("../../utils/banner-api");
const { fetchPostList } = require("../../utils/posts-api");
const { buildAvatarView } = require("../../utils/avatar");
const { getToken, getProfile, setProfile, ensureMiniSession } = require("../../utils/mini-auth");
const { fetchMiniProfile } = require("../../utils/profile-api");
const { getStoredSelectedSchool, setSelectedSchool } = require("../../utils/school-state");
const { HOME_FEED_ALL, getHomeFeedScope, setHomeFeedScope } = require("../../utils/home-feed-state");
const { getProvinceSchoolGroups, filterProvinceSchoolGroups } = require("../../utils/school-catalog");
const { buildPostCategoryView } = require("../../utils/post-category-view");
const { refreshMessageBadge } = require("../../utils/message-badge");
const { fetchCurrentVerification } = require("../../utils/verification-api");
const { getVerificationInfo, setVerificationInfo } = require("../../utils/verification-state");
const { requireLogin } = require("../../utils/login-guard");
const { captureReferralSceneFromOptions } = require("../../utils/referral-scene");

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
  {
    label: "全部",
    category: ""
  },
  ...services.map((item) => ({
    label: item.label,
    category: item.category
  }))
];

function isStyleImage(value) {
  return /^style-/.test(String(value || ""));
}

function buildImageViews(images) {
  return (Array.isArray(images) ? images : [])
    .map((url) => {
      const value = String(url || "").trim();
      const styleImage = isStyleImage(value);
      return {
        url: value,
        className: styleImage ? value : "",
        isImage: !!value && !styleImage
      };
    })
    .filter((item) => item.url);
}

function mapPostView(post) {
  return {
    ...post,
    authorAvatar: buildAvatarView(post.authorAvatar || ""),
    categoryView: buildPostCategoryView(post),
    imageViews: buildImageViews(post.images)
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
    selectedFeedMode: "all",
    selectedFeedSchool: "",
    selectedFeedLabel: "全网",
    businessSchool: "",
    verifiedSchool: "",
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
    userAvatar: buildAvatarView(""),
    messageBadgeCount: 0,
    messageBadgeText: ""
  },

  onLoad(options) {
    captureReferralSceneFromOptions(options);
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const provinceSchoolGroups = getProvinceSchoolGroups();
    if (wx.showShareMenu) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ["shareAppMessage", "shareTimeline"]
      });
    }
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      provinceSchoolGroups,
      filteredProvinceSchoolGroups: this.buildDisplayGroups("", provinceSchoolGroups, DEFAULT_EXPANDED_PROVINCES)
    });
  },

  async onShow() {
    const hasToken = !!getToken();
    let verificationInfo = getVerificationInfo();
    let verifiedSchool = verificationInfo.verified && verificationInfo.school ? verificationInfo.school : "";
    let businessSchool = verifiedSchool || getStoredSelectedSchool();

    if (hasToken) {
      verificationInfo = await this.syncVerification();
      verifiedSchool = verificationInfo.verified && verificationInfo.school ? verificationInfo.school : "";
      businessSchool = verifiedSchool || getStoredSelectedSchool();
      await this.syncProfile();
    } else {
      this.setData({
        userAvatar: buildAvatarView("")
      });
    }

    refreshMessageBadge(this, { school: businessSchool });
    this.setData({
      activeServiceCategory: "",
      verifiedSchool
    });
    this.applyFeedScope(getHomeFeedScope(), businessSchool);
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

  async syncVerification() {
    let verificationInfo = getVerificationInfo();

    try {
      await ensureMiniSession();
      const remoteInfo = await fetchCurrentVerification();
      verificationInfo = setVerificationInfo({
        ...remoteInfo,
        verified: !!remoteInfo.verified
      });
    } catch (error) {}

    if (verificationInfo.verified && verificationInfo.school) {
      setSelectedSchool(verificationInfo.school);
    }

    return verificationInfo;
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

  async applyFeedScope(feedScope, businessSchool = "") {
    const selectedFeedMode = feedScope.mode || "all";
    const selectedFeedSchool = feedScope.school || "";
    const selectedFeedLabel = feedScope.label || (selectedFeedMode === "all" ? "全网" : selectedFeedSchool);
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
      const bannerSchool = selectedFeedMode === "all" ? "" : selectedFeedSchool;
      const postQuery =
        selectedFeedMode === "all"
          ? {
              page: 1,
              pageSize: 20,
              scope: "all"
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
    const nextFeedScope = setHomeFeedScope(school);
    this.setData({
      schoolPickerOpen: false
    });
    this.applyFeedScope(nextFeedScope, this.data.businessSchool || "");
  },

  selectAllNetwork() {
    const nextFeedScope = setHomeFeedScope(HOME_FEED_ALL, "", { manual: true });
    this.setData({
      schoolPickerOpen: false
    });
    this.applyFeedScope(nextFeedScope, this.data.businessSchool || "");
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
    this.applyFeedScope(getHomeFeedScope(), this.data.businessSchool || "");
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
    requireLogin({
      title: "发布前请先登录",
      content: "浏览内容无需登录，发布帖子时需要微信授权登录。"
    }).then((passed) => {
      if (!passed) return;
      wx.navigateTo({
        url: `/pages/category-select/category-select?type=${type}`
      });
    });
  },

  onShareAppMessage() {
    return {
      title: "校园通",
      path: "/pages/index/index"
    };
  },

  onShareTimeline() {
    return {
      title: "校园通",
      query: ""
    };
  },

  noop() {}
});
