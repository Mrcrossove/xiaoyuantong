const { getSelectedSchool } = require("../../utils/school-state");
const { getVerificationInfo } = require("../../utils/verification-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { uploadImage } = require("../../utils/upload-api");
const {
  batchDeleteMerchantProducts,
  batchDownMerchantProducts,
  createMerchantProduct,
  deleteMerchantProduct,
  fetchCurrentMerchantOrderBoard,
  fetchCurrentMerchantStore,
  fetchCurrentShopApply,
  moveMerchantProduct,
  submitShopApply,
  toggleMerchantProductStatus,
  updateCurrentMerchantStore,
  updateMerchantProduct
} = require("../../utils/open-shop-api");

const LABELS = {
  title: "我要开店",
  merchantTitle: "商家中心",
  bannerTitle: "校园商家入驻申请",
  bannerDescPrefix: "当前入驻高校：",
  processTitle: "申请流程",
  process1: "1. 完成校园认证，并确认当前高校",
  process2: "2. 填写店铺名称、经营分类和联系方式",
  process3: "3. 等待平台审核，审核通过后即可上架商品",
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
  storeManage: "店铺管理",
  goodsManage: "商品管理",
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
  saveStore: "保存店铺信息",
  saveStoreLoading: "保存中...",
  addProduct: "新增商品",
  editProduct: "编辑商品",
  submitProduct: "保存商品",
  saveProductLoading: "保存中...",
  emptyProduct: "暂无商品，点击上方按钮新增",
  subtitle: "店铺副标题",
  notice: "店铺公告",
  phone: "联系电话",
  address: "店铺地址",
  productName: "商品名称",
  productDesc: "商品描述",
  productPrice: "商品价格",
  productCover: "商品图片",
  productStock: "库存数量",
  productDailyLimit: "每日限购",
  productRecommended: "推荐商品",
  cancel: "取消",
  statusUp: "已上架",
  statusDown: "已下架",
  toggleStatus: "启停",
  moveUp: "上移",
  moveDown: "下移",
  remove: "删除",
  addBanner: "添加轮播图",
  batchSelect: "批量管理",
  batchCancel: "取消选择",
  batchDown: "批量下架",
  batchDelete: "批量删除",
  selectedCount: "已选",
  recommendedTag: "推荐",
  stockTag: "库存",
  dailyLimitTag: "日限",
  unitCount: "件",
  placeholders: {
    storeName: "例如：校园轻食屋",
    category: "例如：学生商家",
    contactName: "请填写真实联系人",
    contactPhone: "请填写联系手机",
    description: "请简要说明你的商品或服务内容",
    subtitle: "例如：早餐 / 简餐 / 盖饭",
    notice: "请输入店铺公告",
    phone: "请输入店铺联系电话",
    address: "请输入店铺地址",
    storeCover: "上传店铺封面",
    productName: "例如：招牌套餐饭",
    productDesc: "例如：热菜 / 米饭 / 例汤",
    productPrice: "例如：12.8",
    productCover: "上传商品封面",
    productStock: "例如：99",
    productDailyLimit: "例如：10，填 0 表示不限"
  }
};

function getInitialProductForm() {
  return {
    id: "",
    name: "",
    desc: "",
    price: "",
    cover: "",
    stock: 0,
    dailyLimit: 0,
    recommended: false,
    status: LABELS.statusUp
  };
}

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

function normalizePrice(value) {
  return String(value || "").replace(/[￥¥元]/g, "").trim();
}

Page({
  data: {
    statusBarHeight: 20,
    loading: true,
    submitting: false,
    savingStore: false,
    savingProduct: false,
    selectedSchool: "",
    labels: LABELS,
    currentApply: null,
    merchantStore: null,
    merchantOrderBoard: getInitialOrderBoard(),
    productModalVisible: false,
    batchMode: false,
    selectedProductIds: [],
    productForm: getInitialProductForm(),
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
    const selectedSchool = getSelectedSchool();
    const verification = getVerificationInfo();

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
        batchMode: false,
        selectedProductIds: [],
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
            school: currentApply.school || this.data.selectedSchool,
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

  onProductInput(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({ [`productForm.${field}`]: event.detail.value });
  },

  onProductSwitchChange(event) {
    const { field } = event.currentTarget.dataset;
    this.setData({ [`productForm.${field}`]: !!event.detail.value });
  },

  async submitApply() {
    const payload = {
      school: String(this.data.form.school || "").trim(),
      storeName: String(this.data.form.storeName || "").trim(),
      category: String(this.data.form.category || "").trim(),
      contactName: String(this.data.form.contactName || "").trim(),
      contactPhone: String(this.data.form.contactPhone || "").trim(),
      description: String(this.data.form.description || "").trim()
    };

    if (payload.storeName.length < 2) return wx.showToast({ title: "请填写店铺名称", icon: "none" });
    if (!payload.category) return wx.showToast({ title: "请填写经营分类", icon: "none" });
    if (!payload.contactName) return wx.showToast({ title: "请填写联系人", icon: "none" });
    if (!/^1\d{10}$/.test(payload.contactPhone)) return wx.showToast({ title: "请输入正确的手机号", icon: "none" });
    if (payload.description.length < 5) return wx.showToast({ title: "请填写经营说明", icon: "none" });

    this.setData({ submitting: true });
    try {
      await ensureMiniSession();
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
      return wx.showToast({ title: "请完整填写店铺信息", icon: "none" });
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
      wx.showToast({ title: "店铺信息已保存", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    } finally {
      this.setData({ savingStore: false });
    }
  },

  openCreateProduct() {
    this.setData({
      productModalVisible: true,
      productForm: getInitialProductForm()
    });
  },

  openEditProduct(event) {
    if (this.data.batchMode) return;
    const { id } = event.currentTarget.dataset;
    const product = ((this.data.merchantStore && this.data.merchantStore.products) || []).find(
      (item) => String(item.id) === String(id)
    );
    if (!product) return;
    this.setData({
      productModalVisible: true,
      productForm: {
        id: product.id,
        name: product.name || "",
        desc: product.desc || "",
        price: normalizePrice(product.price),
        cover: product.cover || "",
        stock: Number(product.stock || 0),
        dailyLimit: Number(product.dailyLimit || 0),
        recommended: !!product.recommended,
        status: product.status || LABELS.statusUp
      }
    });
  },

  closeProductModal() {
    if (this.data.savingProduct) return;
    this.setData({
      productModalVisible: false,
      productForm: getInitialProductForm()
    });
  },

  async saveProduct() {
    const payload = {
      name: String(this.data.productForm.name || "").trim(),
      desc: String(this.data.productForm.desc || "").trim(),
      price: String(this.data.productForm.price || "").trim(),
      cover: String(this.data.productForm.cover || "").trim(),
      stock: Math.max(0, Number(this.data.productForm.stock || 0)),
      dailyLimit: Math.max(0, Number(this.data.productForm.dailyLimit || 0)),
      recommended: !!this.data.productForm.recommended,
      status: this.data.productForm.status || LABELS.statusUp
    };

    if (payload.name.length < 2 || payload.desc.length < 2 || !payload.price) {
      return wx.showToast({ title: "请完整填写商品信息", icon: "none" });
    }

    this.setData({ savingProduct: true });
    try {
      const result = this.data.productForm.id
        ? await updateMerchantProduct(this.data.productForm.id, payload)
        : await createMerchantProduct(payload);

      this.setData({
        merchantStore: result.store,
        productModalVisible: false,
        productForm: getInitialProductForm()
      });
      wx.showToast({ title: "商品已保存", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "保存失败", icon: "none" });
    } finally {
      this.setData({ savingProduct: false });
    }
  },

  toggleBatchMode() {
    this.setData({
      batchMode: !this.data.batchMode,
      selectedProductIds: []
    });
  },

  toggleSelectProduct(event) {
    const { id } = event.currentTarget.dataset;
    const current = new Set(this.data.selectedProductIds || []);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    this.setData({ selectedProductIds: Array.from(current) });
  },

  async batchDownProducts() {
    const ids = this.data.selectedProductIds || [];
    if (!ids.length) return wx.showToast({ title: "请先选择商品", icon: "none" });
    try {
      const merchantStore = await batchDownMerchantProducts(ids);
      this.setData({ merchantStore, selectedProductIds: [] });
      wx.showToast({ title: "所选商品已下架", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "批量下架失败", icon: "none" });
    }
  },

  batchDeleteProducts() {
    const ids = this.data.selectedProductIds || [];
    if (!ids.length) return wx.showToast({ title: "请先选择商品", icon: "none" });
    wx.showModal({
      title: "批量删除",
      content: `确定删除已选的 ${ids.length} 件商品吗？`,
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const merchantStore = await batchDeleteMerchantProducts(ids);
          this.setData({ merchantStore, selectedProductIds: [] });
          wx.showToast({ title: "所选商品已删除", icon: "success" });
        } catch (error) {
          wx.showToast({ title: error.message || "批量删除失败", icon: "none" });
        }
      }
    });
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

  async chooseProductCover() {
    await this.chooseAndUpload("productForm.cover");
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

  async moveProduct(event) {
    if (this.data.batchMode) return;
    const { id, direction } = event.currentTarget.dataset;
    try {
      const merchantStore = await moveMerchantProduct(id, direction);
      this.setData({ merchantStore });
      wx.showToast({ title: "商品顺序已更新", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "排序失败", icon: "none" });
    }
  },

  async handleToggleProductStatus(event) {
    if (this.data.batchMode) return;
    const { id } = event.currentTarget.dataset;
    try {
      const result = await toggleMerchantProductStatus(id);
      this.setData({ merchantStore: result.store });
      wx.showToast({ title: "商品状态已更新", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error.message || "操作失败", icon: "none" });
    }
  },

  handleDeleteProduct(event) {
    if (this.data.batchMode) return;
    const { id } = event.currentTarget.dataset;
    wx.showModal({
      title: "删除商品",
      content: "确定删除这个商品吗？",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const merchantStore = await deleteMerchantProduct(id);
          this.setData({ merchantStore });
          wx.showToast({ title: "商品已删除", icon: "success" });
        } catch (error) {
          wx.showToast({ title: error.message || "删除失败", icon: "none" });
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
