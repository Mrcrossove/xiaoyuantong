const { ensureMiniSession } = require("../../utils/mini-auth");
const {
  cancelOrder,
  confirmOrderPay,
  createOrderPay,
  fetchOrderDetail,
  finishOrder,
  payOrder
} = require("../../utils/order-api");

const LABELS = {
  title: "订单详情",
  orderInfo: "订单信息",
  receiverInfo: "收货信息",
  amountInfo: "金额信息",
  orderNo: "订单编号",
  orderTime: "下单时间",
  status: "订单状态",
  payStatus: "支付状态",
  product: "商品",
  quantity: "数量",
  receiver: "收货人",
  phone: "手机号",
  address: "收货地址",
  amount: "订单金额",
  cancel: "取消订单",
  pay: "立即支付",
  finish: "确认完成",
  paidBannerTitle: "支付成功",
  paidBannerDesc: "订单已进入处理中，商家正在准备商品或服务。"
};

function getStatusTone(detail) {
  if (!detail) {
    return "";
  }

  if (detail.status === "pending") {
    return "pending";
  }
  if (detail.status === "processing") {
    return "processing";
  }
  if (detail.status === "finished") {
    return "finished";
  }
  if (detail.status === "canceled") {
    return "canceled";
  }
  return "";
}

Page({
  data: {
    statusBarHeight: 20,
    labels: LABELS,
    loading: true,
    processing: false,
    detail: null,
    paySuccessNotice: false
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      paySuccessNotice: options.paid === "1"
    });

    if (options.id) {
      this.orderId = options.id;
    }
  },

  async onShow() {
    await this.loadDetail();
  },

  async loadDetail() {
    if (!this.orderId) {
      return;
    }

    this.setData({ loading: true });
    try {
      await ensureMiniSession();
      const detail = await fetchOrderDetail(this.orderId);
      this.setData({
        detail: {
          ...detail,
          statusTone: getStatusTone(detail)
        }
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "加载订单失败",
        icon: "none"
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async handlePay() {
    if (this.data.processing || !this.data.detail) {
      return;
    }

    this.setData({ processing: true });
    try {
      await ensureMiniSession();
      const payResult = await createOrderPay(this.orderId);

      if (payResult && payResult.mode === "mock") {
        await confirmOrderPay(this.orderId);
      } else if (payResult && payResult.payment) {
        await new Promise((resolve, reject) => {
          wx.requestPayment({
            ...payResult.payment,
            success: resolve,
            fail: reject
          });
        });
        await confirmOrderPay(this.orderId);
      } else {
        await payOrder(this.orderId);
      }

      this.setData({
        paySuccessNotice: true
      });

      wx.showToast({
        title: "支付成功",
        icon: "success"
      });
      await this.loadDetail();
    } catch (error) {
      wx.showToast({
        title: error.message || "支付失败",
        icon: "none"
      });
    } finally {
      this.setData({ processing: false });
    }
  },

  handleCancel() {
    if (!this.data.detail || this.data.processing) {
      return;
    }

    wx.showModal({
      title: "取消订单",
      content: "确定取消这笔订单吗？",
      success: async (res) => {
        if (!res.confirm) {
          return;
        }

        this.setData({ processing: true });
        try {
          await ensureMiniSession();
          await cancelOrder(this.orderId);
          wx.showToast({
            title: "已取消",
            icon: "success"
          });
          await this.loadDetail();
        } catch (error) {
          wx.showToast({
            title: error.message || "取消失败",
            icon: "none"
          });
        } finally {
          this.setData({ processing: false });
        }
      }
    });
  },

  handleFinish() {
    if (!this.data.detail || this.data.processing) {
      return;
    }

    wx.showModal({
      title: "确认完成",
      content: "确认已经收到商品或服务吗？",
      success: async (res) => {
        if (!res.confirm) {
          return;
        }

        this.setData({ processing: true });
        try {
          await ensureMiniSession();
          await finishOrder(this.orderId);
          wx.showToast({
            title: "订单已完成",
            icon: "success"
          });
          await this.loadDetail();
        } catch (error) {
          wx.showToast({
            title: error.message || "操作失败",
            icon: "none"
          });
        } finally {
          this.setData({ processing: false });
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
