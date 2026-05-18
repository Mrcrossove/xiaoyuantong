const { fetchTravelRoutes } = require("../../utils/travel-api");
const { getHomeFeedScope } = require("../../utils/home-feed-state");

Page({
  data: {
    statusBarHeight: 20,
    school: "",
    routes: [],
    loading: false,
    errorText: ""
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
  },

  onShow() {
    const scope = getHomeFeedScope ? getHomeFeedScope() : { school: "" };
    const school = scope.mode === "school" ? scope.school : "";
    this.loadRoutes(school);
  },

  async loadRoutes(school) {
    this.setData({ loading: true, school });
    try {
      const result = await fetchTravelRoutes({ school });
      this.setData({ routes: result.list || [], errorText: "" });
    } catch (error) {
      this.setData({ routes: [], errorText: "出游线路加载失败，请稍后重试" });
    } finally {
      this.setData({ loading: false });
    }
  },

  openDetail(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/travel-detail/travel-detail?id=${id}` });
  },

  openMyBookings() {
    wx.navigateTo({ url: "/pages/my-travel-bookings/my-travel-bookings" });
  },

  goBack() {
    wx.navigateBack();
  }
});
