const { createTravelBooking, fetchTravelRouteDetail, fetchTravelSubscribeConfig } = require("../../utils/travel-api");
const { getProfile } = require("../../utils/mini-auth");
const { requestSubscribeMessage } = require("../../utils/subscribe-message");

Page({
  data: {
    statusBarHeight: 20,
    routeId: 0,
    scheduleId: 0,
    detail: null,
    form: {
      contactName: "",
      contactPhone: "",
      school: "",
      participantCount: 1,
      emergencyName: "",
      emergencyPhone: "",
      remark: ""
    },
    submitting: false
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const profile = getProfile ? getProfile() : {};
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      routeId: Number(options.routeId || 0),
      scheduleId: Number(options.scheduleId || 0),
      form: {
        ...this.data.form,
        contactPhone: profile.phone || "",
        school: profile.school || ""
      }
    });
    this.loadDetail();
  },

  async loadDetail() {
    if (!this.data.routeId) return;
    try {
      const detail = await fetchTravelRouteDetail(this.data.routeId);
      this.setData({ detail });
    } catch (error) {}
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  stepCount(event) {
    const delta = Number(event.currentTarget.dataset.delta || 0);
    const next = Math.max(1, Number(this.data.form.participantCount || 1) + delta);
    this.setData({ "form.participantCount": next });
  },

  async submit() {
    const form = this.data.form;
    if (!form.contactName || !form.contactPhone || !form.school) {
      wx.showToast({ title: "请填写姓名、手机和学校", icon: "none" });
      return;
    }
    this.setData({ submitting: true });
    try {
      const config = await fetchTravelSubscribeConfig().catch(() => ({}));
      await requestSubscribeMessage([config.paymentTemplateId]);
      await createTravelBooking({
        ...form,
        scheduleId: this.data.scheduleId
      });
      wx.showToast({ title: "报名成功", icon: "success" });
      setTimeout(() => {
        wx.redirectTo({ url: "/pages/my-travel-bookings/my-travel-bookings" });
      }, 500);
    } catch (error) {
      wx.showToast({ title: error.message || "报名失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
