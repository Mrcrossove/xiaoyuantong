const { ensureMiniSession, getProfile } = require("../../utils/mini-auth");
const { createWithdraw, fetchWalletSummary } = require("../../utils/wallet-api");

const LABELS = {
  title: "\u6211\u7684\u94b1\u5305",
  total: "\u6211\u7684\u4f59\u989d",
  frozen: "\u51bb\u7ed3\u4f59\u989d",
  available: "\u53ef\u7528\u4f59\u989d",
  income: "\u7d2f\u8ba1\u6536\u5165",
  withdrawn: "\u7d2f\u8ba1\u63d0\u73b0",
  withdraw: "\u63d0\u73b0",
  records: "\u63d0\u73b0\u8bb0\u5f55",
  recent: "\u4ec5\u5c55\u793a\u6700\u8fd1\u4e09\u6761\u8bb0\u5f55",
  noRecord: "\u6682\u65e0\u63d0\u73b0\u8bb0\u5f55",
  modalTitle: "\u7533\u8bf7\u63d0\u73b0",
  amount: "\u63d0\u73b0\u91d1\u989d",
  account: "\u63d0\u73b0\u8d26\u6237",
  placeholderAmount: "\u8bf7\u8f93\u5165\u63d0\u73b0\u91d1\u989d",
  placeholderAccount: "\u9ed8\u8ba4\u4f7f\u7528\u624b\u673a\u53f7\u6216\u6635\u79f0",
  cancel: "\u53d6\u6d88",
  confirm: "\u63d0\u4ea4\u7533\u8bf7",
  submitting: "\u63d0\u4ea4\u4e2d..."
};

Page({
  data: {
    statusBarHeight: 20,
    labels: LABELS,
    loading: true,
    submitting: false,
    modalVisible: false,
    wallet: {
      total: "0.00",
      frozen: "0.00",
      available: "0.00",
      totalIncome: "0.00",
      totalWithdrawn: "0.00"
    },
    records: [],
    form: {
      amount: "",
      accountNo: ""
    }
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
  },

  async onShow() {
    await this.loadWalletSummary();
  },

  async loadWalletSummary() {
    this.setData({ loading: true });
    try {
      await ensureMiniSession();
      const data = await fetchWalletSummary();
      this.setData({
        wallet: data.wallet || this.data.wallet,
        records: data.withdrawRecords || []
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "\u52a0\u8f7d\u94b1\u5305\u5931\u8d25",
        icon: "none"
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  openWithdrawModal() {
    const profile = getProfile();
    this.setData({
      modalVisible: true,
      form: {
        amount: "",
        accountNo: profile.phone || profile.nickname || ""
      }
    });
  },

  closeWithdrawModal() {
    if (this.data.submitting) {
      return;
    }
    this.setData({
      modalVisible: false,
      form: {
        amount: "",
        accountNo: ""
      }
    });
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: event.detail.value
    });
  },

  async submitWithdraw() {
    const amount = Number(this.data.form.amount || 0);
    const accountNo = String(this.data.form.accountNo || "").trim();

    if (!amount || amount <= 0) {
      wx.showToast({
        title: "\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u63d0\u73b0\u91d1\u989d",
        icon: "none"
      });
      return;
    }

    if (!accountNo) {
      wx.showToast({
        title: "\u8bf7\u8f93\u5165\u63d0\u73b0\u8d26\u6237",
        icon: "none"
      });
      return;
    }

    this.setData({ submitting: true });
    try {
      await ensureMiniSession();
      await createWithdraw({
        amount,
        accountType: "\u5fae\u4fe1\u96f6\u94b1",
        accountNo
      });
      wx.showToast({
        title: "\u63d0\u73b0\u7533\u8bf7\u5df2\u63d0\u4ea4",
        icon: "success"
      });
      this.setData({
        modalVisible: false,
        form: {
          amount: "",
          accountNo: ""
        }
      });
      await this.loadWalletSummary();
    } catch (error) {
      wx.showToast({
        title: error.message || "\u63d0\u73b0\u5931\u8d25",
        icon: "none"
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
