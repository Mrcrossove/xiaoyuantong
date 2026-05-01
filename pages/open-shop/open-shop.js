const {
  getCampusSchool,
  getVerificationInfo,
  getVerifiedSchool,
  setVerificationInfo
} = require("../../utils/verification-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { uploadImage } = require("../../utils/upload-api");
const { fetchCurrentVerification } = require("../../utils/verification-api");
const {
  fetchCurrentMerchantOrderBoard,
  fetchCurrentMerchantStore,
  fetchCurrentShopApply,
  submitShopApply,
  updateCurrentMerchantStore
} = require("../../utils/open-shop-api");

const MERCHANT_WEB_URL = "https://xy-merchant.jpwlkj.com/merchant/";

const LABELS = {
  title: "我要开店",
  merchantTitle: "商家中心",
  bannerTitle: "校园商家入驻申请",
  bannerDescPrefix: "当前入驻高校：",
  processTitle: "申请流程",
  process1: "1. 完成校园认证，并确认当前高校",
  process2: "2. 填写店铺名称、经营分类和联系方式",
  process3: "3. 等待平台审核，审核通过后到商家后台统一维护商品",
  formTitle: "申请信息",
  currentSchool: "入驻高校",
  storeName: "店铺名称",
  category: "经营分类",
  contactName: "联系人",
  contactPhone: "联系手机",
  description: "经营说明",
  statusTitle: "当前申请状态",
  statusLabel: "状态",
  appliedStoreName: "店铺名称",
  appliedCategory: "经营分类",
  appliedTime: "提交时间",
  noRecord: "暂无申请记录",
  loading: "加载中...",
  submit: "提交开店申请",
  submitting: "提交中...",
  retryTip: "已驳回的申请可修改后重新提交。",
  rejected: "已驳回",
  storeManage: "店铺资料",
  orderManage: "接单看板",
  orderNew: "新订单提醒",
  orderPending: "待处理订单",
  orderFinished: "完成订单",
  noNewOrders: "暂无新订单提醒",
  noPendingOrders: "暂无待处理订单",
  noFinishedOrders: "暂无完成订单",
  orderBuyer: "收货人：",
  orderAddress: "收货地址：",
  orderAmount: "订单金额：",
  orderPaidAt: "支付时间：",
  orderFinishedAt: "完成时间：",
  storeCover: "店铺封面",
  storeBanners: "店铺轮播图",
  saveStore: "保存店铺资料",
  saveStoreLoading: "保存中...",
  subtitle: "店铺副标题",
  notice: "店铺公告",
  phone: "联系电话",
  address: "店铺地址",
  moveUp: "上移",
  moveDown: "下移",
  remove: "删除",
  addBanner: "添加轮播图",
  placeholders: {
    storeName: "例如：校园轻食屋",
    category: "例如：学生商家",
    contactName: "请填写真实联系人",
    contactPhone: "请填写联系手机",
    description: "请至少填写 5 个字，例如：主营奶茶、零食配送",
    subtitle: "例如：早餐 / 简餐 / 盖饭",
    notice: "请输入店铺公告",
    phone: "请输入店铺联系电话",
    address: "请输入店铺地址",
    storeCover: "上传店铺封面"
  }
};

function getInitialMerchantForm() {
  return {
    name: "",
    subtitle: "",
    notice: "",
    phone: "",
    address: "",
    cover: "",
    banners: []
  };
}

function getInitialOrderBoard() {
  return {
    summary: {
      newOrderCount: 0,
      pendingOrderCount: 0,
      finishedOrderCount: 0
    },
    newOrders: [],
    pendingOrders: [],
    finishedOrders: []
  };
}

function moveArrayItem(list, index, direction) {
  const next = (list || []).slice();
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= next.length) {
    return next;
  }
  const temp = next[index];
  next[index] = next[targetIndex];
  next[targetIndex] = temp;
  return next;
}

Page({
  data: {
    statusBarHeight: 20,
    loading: true,
    submitting: false,
    savingStore: false,
    selectedSchool: "",
    merchantWebUrl: MERCHANT_WEB_URL,
    labels: LABELS,
    currentApply: null,
    merchantStore: null,
    merchantOrderBoard: getInitialOrderBoard(),
    form: {
      school: "",
      storeName: "",
      category: "学生商家",
      contactName: "",
      contactPhone: "",
      description: ""
    },
    merchantForm: getInitialMerchantForm()
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
  },

  async onShow() {
    let verification = getVerificationInfo();

    try {
      await ensureMiniSession();
      const remoteInfo = await fetchCurrentVerification();
      verification = setVerificationInfo({
        ...remoteInfo,
        verified: !!remoteInfo.verified
      });
    } catch (error) {}

    const selectedSchool = getCampusSchool();

    this.setData({
      selectedSchool,
      form: {
        ...this.data.form,
        school: selectedSchool,
        contactName: verification.name || this.data.form.contactName,
        contactPhone: verification.phone || this.data.form.contactPhone
      }
    });

    await this.loadShopState();
  },

  async loadShopState() {
    this.setData({ loading: true });
    try {
      await ensureMiniSession();
      const [currentApply, merchantStore, merchantOrderBoard] = await Promise.all([
        fetchCurrentShopApply().catch(() => null),
        fetchCurrentMerchantStore().catch(() => null),
        fetchCurrentMerchantOrderBoard().catch(() => getInitialOrderBoard())
      ]);

      this.setData({
        currentApply,
        merchantStore,
        merchantOrderBoard: merchantStore ? merchantOrderBoard : getInitialOrderBoard(),
        merchantForm: merchantStore
          ? {
              name: merchantStore.name || "",
              subtitle: merchantStore.subtitle || "",
              notice: merchantStore.notice || "",
              phone: merchantStore.phone || "",
              address: merchantStore.address || "",
              cover: merchantStore.cover || "",
              banners: merchantStore.banners || []
            }
          : getInitialMerchantForm()
      });

      if (currentApply && currentApply.status === LABELS.rejected) {
        this.setData({
          form: {
            school: this.data.selectedSchool,
            storeName: currentApply.storeName || "",
            category: currentApply.category || "学生商家",
            contactName: currentApply.contactName || "",
            contactPhone: currentApply.contactPhone || "",
            description: currentApply.description || ""
          }
        });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  onMerchantInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({ [`merchantForm.${field}`]: event.detail.value });
  },

  async submitApply() {
    try {
      await ensureMiniSession();
      const remoteInfo = await fetchCurrentVerification();
      setVerificationInfo({
        ...remoteInfo,
        verified: !!remoteInfo.verified
      });
    } catch (error) {}

    const verifiedSchool = getVerifiedSchool();
    if (!verifiedSchool) {
      wx.showModal({
        title: "需要校园认证",
        content: "开店申请需要先完成校园认证，学校将按认证学校固定。",
        confirmText: "去认证",
        success: (res) => {
          if (!res.confirm) return;
          wx.navigateTo({
            url: "/pages/campus-verify/campus-verify"
          });
        }
      });
      return;
    }

    const payload = {
      school: verifiedSchool,
      storeName: String(this.data.form.storeName || "").trim(),
      category: String(this.data.form.category || "").trim(),
      contactName: String(this.data.form.contactName || "").trim(),
      contactPhone: String(this.data.form.contactPhone || "").trim(),
      description: String(this.data.form.description || "").trim()
    };

    this.setData({
      selectedSchool: verifiedSchool,
      "form.school": verifiedSchool
    });

    if (payload.storeName.length < 2) return wx.showToast({ title: "请填写店铺名称", icon: "none" });
    if (!payload.category) return wx.showToast({ title: "请填写经营分类", icon: "none" });
    if (!payload.contactName) return wx.showToast({ title: "请填写联系人", icon: "none" });
    if (!/^1\d{10}$/.test(payload.contactPhone)) return wx.showToast({ title: "请输入正确的手机号", icon: "none" });
    if (payload.description.length < 5) return wx.showToast({ title: "经营说明至少 5 个字", icon: "none" });

    this.setData({ submitting: true });
    try {
      const currentApply = await submitShopApply(payload);
      this.setData({ currentApply });
      wx.showToast({ title: "开店申请已提交", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "提交失败", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async saveMerchantStore() {
    const payload = {
      name: String(this.data.merchantForm.name || "").trim(),
      subtitle: String(this.data.merchantForm.subtitle || "").trim(),
      notice: String(this.data.merchantForm.notice || "").trim(),
      phone: String(this.data.merchantForm.phone || "").trim(),
      address: String(this.data.merchantForm.address || "").trim(),
      cover: String(this.data.merchantForm.cover || "").trim(),
      banners: (this.data.merchantForm.banners || []).slice(0, 5)
    };

    if (
      payload.name.length < 2 ||
      payload.subtitle.length < 2 ||
      payload.notice.length < 5 ||
      payload.address.length < 5
    ) {
      return wx.showToast({ title: "请完整填写店铺资料", icon: "none" });
    }

    this.setData({ savingStore: true });
    try {
      const merchantStore = await updateCurrentMerchantStore(payload);
      this.setData({
        merchantStore,
        merchantForm: {
          name: merchantStore.name || "",
          subtitle: merchantStore.subtitle || "",
          notice: merchantStore.notice || "",
          phone: merchantStore.phone || "",
          address: merchantStore.address || "",
          cover: merchantStore.cover || "",
          banners: merchantStore.banners || []
        }
      });
      wx.showToast({ title: "店铺资料已保存", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    } finally {
      this.setData({ savingStore: false });
    }
  },

  async chooseStoreCover() {
    await this.chooseAndUpload("merchantForm.cover");
  },

  async addStoreBanner() {
    const banners = this.data.merchantForm.banners || [];
    if (banners.length >= 5) return wx.showToast({ title: "轮播图最多 5 张", icon: "none" });
    try {
      const filePath = await this.pickSingleImage();
      if (!filePath) return;
      wx.showLoading({ title: "上传中", mask: true });
      const uploaded = await uploadImage(filePath, "merchant");
      this.setData({
        "merchantForm.banners": banners.concat(uploaded.url).slice(0, 5)
      });
    } catch (error) {
      wx.showToast({ title: error.message || "上传失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  moveStoreBanner(event) {
    const { index, direction } = event.currentTarget.dataset;
    this.setData({
      "merchantForm.banners": moveArrayItem(this.data.merchantForm.banners || [], Number(index), direction)
    });
  },

  removeStoreBanner(event) {
    const { index } = event.currentTarget.dataset;
    const next = (this.data.merchantForm.banners || []).filter((_, currentIndex) => currentIndex !== Number(index));
    this.setData({ "merchantForm.banners": next });
  },

  async chooseAndUpload(targetField) {
    try {
      const filePath = await this.pickSingleImage();
      if (!filePath) return;
      wx.showLoading({ title: "上传中", mask: true });
      const uploaded = await uploadImage(filePath, "merchant");
      this.setData({ [targetField]: uploaded.url });
    } catch (error) {
      wx.showToast({ title: error.message || "上传失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  pickSingleImage() {
    return new Promise((resolve, reject) => {
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        success: (res) => resolve(res.tempFiles && res.tempFiles[0] ? res.tempFiles[0].tempFilePath : ""),
        fail: reject
      });
    });
  },

  copyMerchantWebUrl() {
    wx.setClipboardData({
      data: MERCHANT_WEB_URL,
      success: () => wx.showToast({ title: "后台地址已复制", icon: "success" })
    });
  },

  showMerchantLoginTip() {
    wx.showModal({
      title: "商家后台登录说明",
      content: "入驻审核通过后，平台会通过小程序消息发送登录账号和初始密码。请复制商家后台地址，在浏览器中打开后维护商品、订单和钱包。",
      confirmText: "知道了",
      showCancel: false
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
