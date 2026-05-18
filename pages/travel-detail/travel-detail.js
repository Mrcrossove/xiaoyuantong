const { fetchTravelRouteDetail } = require("../../utils/travel-api");

Page({
  data: {
    statusBarHeight: 20,
    id: 0,
    detail: null,
    selectedScheduleId: 0,
    loading: false,
    errorText: ""
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20, id: Number(options.id || 0) });
  },

  onShow() {
    this.loadDetail();
  },

  async loadDetail() {
    if (!this.data.id) return;
    this.setData({ loading: true });
    try {
      const detail = await fetchTravelRouteDetail(this.data.id);
      const selectedScheduleId = detail.activeSchedule ? detail.activeSchedule.id : ((detail.schedules || [])[0] || {}).id || 0;
      this.setData({ detail, selectedScheduleId, errorText: "" });
    } catch (error) {
      this.setData({ detail: null, errorText: "线路加载失败，请稍后重试" });
    } finally {
      this.setData({ loading: false });
    }
  },

  selectSchedule(event) {
    this.setData({ selectedScheduleId: Number(event.currentTarget.dataset.id || 0) });
  },

  goApply() {
    if (!this.data.selectedScheduleId) {
      wx.showToast({ title: "请选择排期", icon: "none" });
      return;
    }
    wx.navigateTo({ url: `/pages/travel-apply/travel-apply?routeId=${this.data.id}&scheduleId=${this.data.selectedScheduleId}` });
  },

  openMyBookings() {
    wx.navigateTo({ url: "/pages/my-travel-bookings/my-travel-bookings" });
  },

  goBack() {
    wx.navigateBack();
  }
});
