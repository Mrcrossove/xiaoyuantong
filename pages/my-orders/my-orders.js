const { ensureMiniSession } = require("../../utils/mini-auth");
const { cancelOrder, confirmOrderPay, createOrderPay, fetchOrderList, finishOrder, payOrder } = require("../../utils/order-api");

const LABELS = {
  title: "\u6211\u7684\u8ba2\u5355",
  empty: "\u6682\u65e0\u8ba2\u5355\uff0c\u53ef\u4ee5\u53bb\u521b\u4e1a\u5e97\u94fa\u4e0b\u5355",
  amount: "\u5408\u8ba1",
  quantity: "\u6570\u91cf",
  afterSale: "\u552e\u540e",
  pay: "\u53bb\u652f\u4ed8",
  cancel: "\u53d6\u6d88\u8ba2\u5355",
  finish: "\u786e\u8ba4\u5b8c\u6210"
};

const TABS = [
  { key: "all", label: "\u5168\u90e8" },
  { key: "pending", label: "\u5f85\u652f\u4ed8" },
  { key: "processing", label: "\u8fdb\u884c\u4e2d" },
  { key: "finished", label: "\u5df2\u5b8c\u6210" }
];

Page({
  data: {
    statusBarHeight: 20,
    labels: LABELS,
    tabs: TABS,
    activeTab: "all",
    loading: true,
    orders: []
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
  },

  async onShow() {
    await this.loadOrders();
  },

  async loadOrders() {
    this.setData({ loading: true });
    try {
      await ensureMiniSession();
      const orders = await fetchOrderList({
        status: this.data.activeTab
      });
      this.setData({
        orders: orders || []
      });
    } catch (error) {
      this.setData({
        orders: []
      });
      wx.showToast({
        title: error.message || "\u52a0\u8f7d\u8ba2\u5355\u5931\u8d25",
        icon: "none"
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async switchTab(event) {
    const { key } = event.currentTarget.dataset;
    if (!key || key === this.data.activeTab) {
      return;
    }

    this.setData({
      activeTab: key
    });
    await this.loadOrders();
  },

  openOrderDetail(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) {
      return;
    }

    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${id}`
    });
  },

  async handlePay(event) {
    const { id } = event.currentTarget.dataset;
    try {
      await ensureMiniSession();
      const payResult = await createOrderPay(id);

      if (payResult && payResult.mode === "mock") {
        await confirmOrderPay(id);
      } else if (payResult && payResult.payment) {
        await new Promise((resolve, reject) => {
          wx.requestPayment({
            ...payResult.payment,
            success: resolve,
            fail: reject
          });
        });
        await confirmOrderPay(id);
      } else {
        await payOrder(id);
      }

      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${id}&paid=1`
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "\u652f\u4ed8\u5931\u8d25",
        icon: "none"
      });
    }
  },

  handleCancel(event) {
    const { id } = event.currentTarget.dataset;
    wx.showModal({
      title: "\u53d6\u6d88\u8ba2\u5355",
      content: "\u786e\u5b9a\u53d6\u6d88\u8fd9\u7b14\u8ba2\u5355\u5417\uff1f",
      success: async (res) => {
        if (!res.confirm) {
          return;
        }

        try {
          await ensureMiniSession();
          await cancelOrder(id);
          wx.showToast({
            title: "\u5df2\u53d6\u6d88",
            icon: "success"
          });
          await this.loadOrders();
        } catch (error) {
          wx.showToast({
            title: error.message || "\u53d6\u6d88\u5931\u8d25",
            icon: "none"
          });
        }
      }
    });
  },

  handleFinish(event) {
    const { id } = event.currentTarget.dataset;
    wx.showModal({
      title: "\u786e\u8ba4\u5b8c\u6210",
      content: "\u786e\u8ba4\u5df2\u7ecf\u6536\u5230\u5546\u54c1\u6216\u670d\u52a1\u5417\uff1f",
      success: async (res) => {
        if (!res.confirm) {
          return;
        }

        try {
          await ensureMiniSession();
          await finishOrder(id);
          wx.showToast({
            title: "\u8ba2\u5355\u5df2\u5b8c\u6210",
            icon: "success"
          });
          await this.loadOrders();
        } catch (error) {
          wx.showToast({
            title: error.message || "\u64cd\u4f5c\u5931\u8d25",
            icon: "none"
          });
        }
      }
    });
  },

  goStorefront() {
    wx.navigateTo({
      url: "/pages/storefront/storefront"
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
