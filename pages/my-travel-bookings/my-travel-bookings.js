const { cancelTravelBooking, confirmTravelPay, createTravelPay, fetchMyTravelBookings, fetchTravelSubscribeConfig } = require("../../utils/travel-api");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { requestSubscribeMessage } = require("../../utils/subscribe-message");

Page({
  data: {
    statusBarHeight: 20,
    list: [],
    loading: false
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const result = await fetchMyTravelBookings();
      this.setData({ list: (result.list || []).map((item) => ({ ...item, statusLabel: this.statusText(item.status) })) });
    } catch (error) {
      wx.showToast({ title: "报名加载失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  statusText(status) {
    const map = {
      submitted: "已报名",
      confirmed: "已确认占位",
      payment: "待支付",
      paid: "已支付",
      canceled: "已取消",
      rejected: "已驳回",
      expired: "超时未支付",
      traveled: "已出行"
    };
    return map[status] || status;
  },

  cancel(event) {
    const { id } = event.currentTarget.dataset;
    wx.showModal({
      title: "取消报名",
      content: "确认取消该出游报名吗？",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await cancelTravelBooking(id);
          wx.showToast({ title: "已取消", icon: "success" });
          this.loadData();
        } catch (error) {
          wx.showToast({ title: error.message || "取消失败", icon: "none" });
        }
      }
    });
  },

  async goPay(event) {
    const { id } = event.currentTarget.dataset;
    if (!id || this.data.loading) return;

    this.setData({ loading: true });
    try {
      await ensureMiniSession();
      const config = await fetchTravelSubscribeConfig().catch(() => ({}));
      await requestSubscribeMessage([config.paymentTemplateId]);
      const payResult = await createTravelPay(id);

      if (payResult && payResult.mode === "paid") {
        wx.showToast({ title: "已完成缴费", icon: "success" });
      } else if (payResult && payResult.mode === "mock") {
        await confirmTravelPay(id);
        wx.showToast({ title: "缴费成功", icon: "success" });
      } else if (payResult && payResult.payment) {
        await new Promise((resolve, reject) => {
          wx.requestPayment({
            ...payResult.payment,
            success: resolve,
            fail: reject
          });
        });
        await confirmTravelPay(id);
        wx.showToast({ title: "缴费成功", icon: "success" });
      } else {
        throw new Error("支付参数缺失");
      }

      await this.loadData();
    } catch (error) {
      wx.showToast({ title: error.message || "缴费失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
