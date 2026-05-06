const { fetchAddressList } = require("../../utils/address-api");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { createOrder } = require("../../utils/order-api");
const { getSelectedSchool } = require("../../utils/school-state");
const { normalizeStoreDetail } = require("../../utils/store-cover");
const { fetchStoreDetail } = require("../../utils/stores-api");
const { requireLogin } = require("../../utils/login-guard");

const CURRENCY_SYMBOL = "楼";

function pickDefaultSku(product) {
  const skus = (product && product.skus) || [];
  return skus.find((item) => item.isDefault) || skus[0] || null;
}

function parsePriceNumber(priceText) {
  const value = Number(String(priceText || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function formatAmount(price, quantity) {
  return `${CURRENCY_SYMBOL}${Number((Number(price || 0) * Number(quantity || 0)).toFixed(2)).toFixed(2)}`;
}

function getMaxQuantity(sku) {
  const stock = Number((sku && sku.stock) || 0);
  const dailyLimit = Number((sku && sku.dailyLimit) || 0);
  let max = dailyLimit > 0 ? dailyLimit : 99;
  if (stock > 0) {
    max = Math.min(max, stock);
  }
  return Math.max(1, max);
}

function pickDefaultAddress(addressList) {
  const list = addressList || [];
  return list.find((item) => item.isDefault) || list[0] || null;
}

function buildAddressSummary(address) {
  if (!address) {
    return "请先添加收货地址";
  }
  const name = address.receiverName || address.name || "";
  const phone = address.phone || "";
  const detail = address.detail || address.address || "";
  const tag = address.tag ? ` ${address.tag}` : "";
  return `${name} ${phone}${tag} ${detail}`.trim();
}

function normalizeDetailText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

Page({
  data: {
    statusBarHeight: 20,
    navRightSafeRpx: 24,
    selectedSchool: "",
    store: null,
    product: null,
    currentSku: null,
    quantity: 1,
    maxQuantity: 1,
    currentAmountText: `${CURRENCY_SYMBOL}0.00`,
    detailLines: [],
    addressList: [],
    selectedAddress: null,
    addressSummary: "请先添加收货地址",
    confirmVisible: false,
    submittingOrder: false
  },

  async onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    this.storeId = String(options.storeId || "");
    this.productId = String(options.productId || "");

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      navRightSafeRpx: this.getNavRightSafeRpx(systemInfo, menuButton),
      selectedSchool: getSelectedSchool()
    });

    await this.loadProductDetail();
    await this.loadDefaultAddress();
  },

  async onShow() {
    this.setData({ selectedSchool: getSelectedSchool() });
    await this.loadDefaultAddress();
  },

  getNavRightSafeRpx(systemInfo, menuButton) {
    const windowWidth = Number(systemInfo && systemInfo.windowWidth) || 375;
    if (!menuButton || !menuButton.left || !windowWidth) {
      return 24;
    }
    const capsuleAreaRpx = ((windowWidth - Number(menuButton.left)) / windowWidth) * 750;
    return Math.ceil(capsuleAreaRpx + 24);
  },

  async loadProductDetail() {
    try {
      const detail = normalizeStoreDetail(await fetchStoreDetail(this.storeId));
      const product = (detail.products || []).find((item) => String(item.id) === String(this.productId));
      if (!product) {
        throw new Error("商品不存在或已下架");
      }

      const currentSku = pickDefaultSku(product);
      const maxQuantity = getMaxQuantity(currentSku);
      this.setData({
        store: detail,
        product,
        currentSku,
        maxQuantity,
        quantity: 1,
        currentAmountText: currentSku ? formatAmount(parsePriceNumber(currentSku.price), 1) : `${CURRENCY_SYMBOL}0.00`,
        detailLines: normalizeDetailText(product.detailText)
      });
    } catch (error) {
      wx.showToast({
        title: (error && error.message) || "商品加载失败",
        icon: "none"
      });
      this.setData({
        store: null,
        product: null
      });
    }
  },

  async loadDefaultAddress() {
    try {
      await ensureMiniSession();
      const addressList = await fetchAddressList();
      const selectedAddress = pickDefaultAddress(addressList);
      this.setData({
        addressList: addressList || [],
        selectedAddress,
        addressSummary: buildAddressSummary(selectedAddress)
      });
    } catch (error) {
      this.setData({
        addressList: [],
        selectedAddress: null,
        addressSummary: "请先添加收货地址"
      });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  decreaseQuantity() {
    this.updateQuantity(Math.max(1, Number(this.data.quantity || 1) - 1));
  },

  increaseQuantity() {
    const nextQuantity = Math.min(Number(this.data.maxQuantity || 1), Number(this.data.quantity || 1) + 1);
    if (nextQuantity === Number(this.data.quantity || 1)) {
      wx.showToast({
        title: Number((this.data.currentSku && this.data.currentSku.dailyLimit) || 0) > 0 ? "已达到每日限购" : "已达到可下单上限",
        icon: "none"
      });
      return;
    }
    this.updateQuantity(nextQuantity);
  },

  updateQuantity(nextQuantity) {
    const currentSku = this.data.currentSku;
    const quantity = Math.min(Math.max(1, Number(nextQuantity || 1)), Number(this.data.maxQuantity || 1));
    this.setData({
      quantity,
      currentAmountText: currentSku ? formatAmount(parsePriceNumber(currentSku.price), quantity) : `${CURRENCY_SYMBOL}0.00`
    });
  },

  openConfirmModal() {
    if (!this.data.product || !this.data.currentSku) {
      wx.showToast({ title: "当前商品暂不可下单", icon: "none" });
      return;
    }

    requireLogin({
      title: "下单前请先登录",
      content: "浏览商品无需登录，下单时需要微信授权登录。"
    }).then((passed) => {
      if (!passed) return;

      if (!this.data.selectedAddress) {
        wx.showModal({
          title: "需要收货地址",
          content: "下单前请先添加收货地址。",
          confirmText: "去添加",
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: "/pages/my-address/my-address" });
            }
          }
        });
        return;
      }
      this.setData({ confirmVisible: true });
    });
  },

  closeConfirmModal() {
    if (!this.data.submittingOrder) {
      this.setData({ confirmVisible: false });
    }
  },

  goManageAddress() {
    this.setData({ confirmVisible: false });
    wx.navigateTo({ url: "/pages/my-address/my-address" });
  },

  async confirmCheckout() {
    if (this.data.submittingOrder || !this.data.store || !this.data.product || !this.data.currentSku || !this.data.selectedAddress) {
      return;
    }

    this.setData({ submittingOrder: true });
    try {
      await ensureMiniSession();
      const order = await createOrder({
        school: this.data.selectedSchool || getSelectedSchool(),
        storeDetailId: this.storeId,
        productId: String(this.data.product.id || ""),
        skuId: String(this.data.currentSku.id || ""),
        quantity: Number(this.data.quantity || 1),
        addressId: Number(this.data.selectedAddress.id)
      });

      this.setData({ confirmVisible: false });
      wx.showModal({
        title: "下单成功",
        content: "订单已创建，请在订单详情页完成支付。",
        confirmText: "查看订单",
        showCancel: false,
        success: () => {
          wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${order.id}&created=1` });
        }
      });
    } catch (error) {
      wx.showToast({
        title: (error && error.message) || "下单失败",
        icon: "none"
      });
    } finally {
      this.setData({ submittingOrder: false });
    }
  }
});
