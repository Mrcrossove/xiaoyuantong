const { services, fabOptions } = require("../../utils/home-config");
const { fetchPostList } = require("../../utils/posts-api");
const schools = require("../../utils/schools");
const { DEFAULT_SCHOOL, getSelectedSchool, setSelectedSchool } = require("../../utils/school-state");

Page({
  data: {
    services,
    fabOptions,
    posts: [],
    searchKeyword: "",
    schools,
    filteredSchools: [],
    selectedSchool: DEFAULT_SCHOOL,
    schoolKeyword: "",
    schoolPickerOpen: false,
    fabOpen: false,
    statusBarHeight: 20,
    postsLoading: false,
    postsErrorText: ""
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
  },

  onShow() {
    this.applySelectedSchool(getSelectedSchool());
  },

  async applySelectedSchool(selectedSchool) {
    const schoolKeyword = "";
    this.setData({
      selectedSchool,
      schoolKeyword,
      filteredSchools: this.filterSchools(schoolKeyword),
      postsLoading: true,
      postsErrorText: ""
    });

    try {
      const result = await fetchPostList({
        page: 1,
        pageSize: 20,
        school: selectedSchool
      });

      this.setData({
        posts: result.list || [],
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

  filterSchools(keyword) {
    const trimmed = (keyword || "").trim();
    const list = trimmed ? schools.filter((school) => school.includes(trimmed)) : schools;
    return list.slice(0, 120);
  },

  openSchoolPicker() {
    this.setData({
      schoolPickerOpen: true,
      filteredSchools: this.filterSchools(this.data.schoolKeyword)
    });
  },

  closeSchoolPicker() {
    if (!this.data.schoolPickerOpen) {
      return;
    }
    this.setData({
      schoolPickerOpen: false,
      schoolKeyword: "",
      filteredSchools: this.filterSchools("")
    });
  },

  onSchoolKeywordInput(event) {
    const schoolKeyword = event.detail.value;
    this.setData({
      schoolKeyword,
      filteredSchools: this.filterSchools(schoolKeyword)
    });
  },

  selectSchool(event) {
    const { school } = event.currentTarget.dataset;
    if (!school) {
      return;
    }
    const selectedSchool = setSelectedSchool(school);
    this.setData({
      schoolPickerOpen: false
    });
    this.applySelectedSchool(selectedSchool);
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
