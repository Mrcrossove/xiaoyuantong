const { fetchAddressList } = require("../../utils/address-api");
const { fetchFavoriteStatus, toggleFavorite } = require("../../utils/favorites-api");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { createOrder } = require("../../utils/order-api");
const { getSelectedSchool } = require("../../utils/school-state");
const { normalizeStoreDetail } = require("../../utils/store-cover");
const { fetchStoreDetail } = require("../../utils/stores-api");

const CURRENCY_SYMBOL = "¥";

function pickDefaultProduct(detail) {
  const products = (detail && detail.products) || [];
  return products.find((item) => item && item.recommended) || products[0] || null;
}

function pickDefaultSku(product) {
  const skus = (product && product.skus) || [];
  return skus.find((item) => item.isDefault) || skus[0] || null;
}

function parsePriceNumber(priceText) {
  const value = Number(String(priceText || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function formatAmount(price, quantity) {
  if (!price || !quantity) {
    return `${CURRENCY_SYMBOL}0.00`;
  }
  return `${CURRENCY_SYMBOL}${Number((price * quantity).toFixed(2)).toFixed(2)}`;
}

function getMaxQuantity(sku) {
  if (!sku) {
    return 1;
  }

  const stock = Number(sku.stock || 0);
  const dailyLimit = Number(sku.dailyLimit || 0);
  let max = dailyLimit > 0 ? dailyLimit : 99;

  if (stock > 0) {
    max = Math.min(max, stock);
  }

  return Math.max(1, max);
}

function buildSelectionState(product, skuId, nextQuantity) {
  const currentProduct = product || null;
  const skuList = (currentProduct && currentProduct.skus) || [];
  const currentSku = skuList.find((item) => String(item.id) === String(skuId || "")) || pickDefaultSku(currentProduct);
  const maxQuantity = getMaxQuantity(currentSku);
  const quantity = Math.min(Math.max(1, Number(nextQuantity || 1)), maxQuantity);
  const currentAmountText = currentSku ? formatAmount(parsePriceNumber(currentSku.price), quantity) : `${CURRENCY_SYMBOL}0.00`;

  return {
    currentProduct,
    currentSku,
    selectedProductId: currentProduct ? String(currentProduct.id) : "",
    selectedSkuId: currentSku ? String(currentSku.id) : "",
    quantity,
    maxQuantity,
    currentAmountText
  };
}

function buildDetailState(detail) {
  const normalizedDetail = normalizeStoreDetail(detail);
  const currentProduct = pickDefaultProduct(normalizedDetail);
  const currentSku = pickDefaultSku(currentProduct);

  return {
    detail: normalizedDetail,
    ...buildSelectionState(currentProduct, currentSku && currentSku.id, 1)
  };
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

Page({
  data: {
    statusBarHeight: 20,
    navRightSafeRpx: 24,
    selectedSchool: "",
    detail: null,
    activeTab: "goods",
    favorite: false,
    submittingOrder: false,
    selectedProductId: "",
    selectedSkuId: "",
    currentProduct: null,
    currentSku: null,
    currentAmountText: `${CURRENCY_SYMBOL}0.00`,
    quantity: 1,
    maxQuantity: 1,
    addressList: [],
    selectedAddress: null,
    addressSummary: "请先添加收货地址",
    confirmVisible: false
  },

  async onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    this.storeId = String(options.id || "");

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      navRightSafeRpx: this.getNavRightSafeRpx(systemInfo, menuButton)
    });

    await this.loadStoreDetail(this.storeId);
    await Promise.all([this.loadFavoriteStatus(this.storeId), this.loadDefaultAddress()]);
  },

  getNavRightSafeRpx(systemInfo, menuButton) {
    const windowWidth = Number(systemInfo && systemInfo.windowWidth) || 375;
    if (!menuButton || !menuButton.left || !windowWidth) {
      return 24;
    }

    const capsuleAreaRpx = ((windowWidth - Number(menuButton.left)) / windowWidth) * 750;
    return Math.ceil(capsuleAreaRpx + 24);
  },

  async onShow() {
    this.setData({
      selectedSchool: getSelectedSchool()
    });

    await this.loadDefaultAddress();
  },

  async loadStoreDetail(id) {
    try {
      const detail = await fetchStoreDetail(id);
      this.setData(buildDetailState(detail));
    } catch (error) {
      wx.showToast({
        title: "加载店铺失败",
        icon: "none"
      });
      this.setData({
        detail: null
      });
    }
  },

  async loadFavoriteStatus(id) {
    try {
      await ensureMiniSession();
      const result = await fetchFavoriteStatus({
        targetType: "store",
        targetId: String(id)
      });
      this.setData({
        favorite: !!result.favorite
      });
    } catch (error) {}
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

  switchTab(event) {
    const { key } = event.currentTarget.dataset;
    if (!key || key === this.data.activeTab) {
      return;
    }

    this.setData({
      activeTab: key
    });
  },

  selectProduct(event) {
    const { id } = event.currentTarget.dataset;
    const products = (this.data.detail && this.data.detail.products) || [];
    const currentProduct = products.find((item) => String(item.id) === String(id));

    if (!currentProduct || String(currentProduct.id) === String(this.data.selectedProductId || "")) {
      return;
    }

    const currentSku = pickDefaultSku(currentProduct);
    this.setData(buildSelectionState(currentProduct, currentSku && currentSku.id, 1));
  },

  openProductDetail(event) {
    const { id } = event.currentTarget.dataset;
    if (!id || !this.storeId) {
      return;
    }

    wx.navigateTo({
      url: `/pages/store-product-detail/store-product-detail?storeId=${encodeURIComponent(this.storeId)}&productId=${encodeURIComponent(String(id))}`
    });
  },

  decreaseQuantity() {
    const nextQuantity = Math.max(1, Number(this.data.quantity || 1) - 1);
    if (nextQuantity === this.data.quantity) {
      return;
    }
    this.setData(buildSelectionState(this.data.currentProduct, this.data.selectedSkuId, nextQuantity));
  },

  increaseQuantity() {
    const nextQuantity = Math.min(Number(this.data.maxQuantity || 1), Number(this.data.quantity || 1) + 1);
    if (nextQuantity === this.data.quantity) {
      const message = Number((this.data.currentSku && this.data.currentSku.dailyLimit) || 0) > 0 ? "已达到每日限购" : "已达到可下单上限";
      wx.showToast({
        title: message,
        icon: "none"
      });
      return;
    }
    this.setData(buildSelectionState(this.data.currentProduct, this.data.selectedSkuId, nextQuantity));
  },

  async toggleStoreFavorite() {
    if (!this.data.detail) {
      return;
    }

    try {
      await ensureMiniSession();
      const result = await toggleFavorite({
        targetType: "store",
        targetId: this.storeId,
        school: this.data.selectedSchool || getSelectedSchool()
      });

      this.setData({
        favorite: !!result.favorite
      });

      wx.showToast({
        title: result.favorite ? "已收藏店铺" : "已取消收藏",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: "操作失败",
        icon: "none"
      });
    }
  },

  openConfirmModal() {
    if (!this.data.currentProduct || !this.data.currentSku) {
      wx.showToast({
        title: "当前店铺暂无可下单商品",
        icon: "none"
      });
      return;
    }

    if (!this.data.selectedAddress) {
      wx.showModal({
        title: "需要收货地址",
        content: "下单前请先添加收货地址。",
        confirmText: "去添加",
        success: (res) => {
          if (!res.confirm) return;
          wx.navigateTo({
            url: "/pages/my-address/my-address"
          });
        }
      });
      return;
    }

    this.setData({
      confirmVisible: true
    });
  },

  closeConfirmModal() {
    if (this.data.submittingOrder) {
      return;
    }

    this.setData({
      confirmVisible: false
    });
  },

  goManageAddress() {
    this.setData({
      confirmVisible: false
    });
    wx.navigateTo({
      url: "/pages/my-address/my-address"
    });
  },

  async confirmCheckout() {
    if (
      this.data.submittingOrder ||
      !this.data.detail ||
      !this.data.currentProduct ||
      !this.data.currentSku ||
      !this.data.selectedAddress
    ) {
      return;
    }

    this.setData({ submittingOrder: true });
    try {
      await ensureMiniSession();
      const order = await createOrder({
        school: this.data.selectedSchool || getSelectedSchool(),
        storeDetailId: this.storeId,
        productId: String(this.data.currentProduct.id || ""),
        skuId: String(this.data.currentSku.id || ""),
        quantity: Number(this.data.quantity || 1),
        addressId: Number(this.data.selectedAddress.id)
      });

      this.setData({
        confirmVisible: false
      });

      wx.showModal({
        title: "下单成功",
        content: "订单已创建，请在订单详情页完成支付。",
        confirmText: "查看订单",
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: `/pages/order-detail/order-detail?id=${order.id}&created=1`
          });
        }
      });
    } catch (error) {
      const message = (error && error.message) || "下单失败";
      if (message.indexOf("请先添加收货地址") !== -1) {
        wx.showModal({
          title: "需要收货地址",
          content: "下单前请先添加收货地址。",
          confirmText: "去添加",
          success: (res) => {
            if (!res.confirm) return;
            wx.navigateTo({
              url: "/pages/my-address/my-address"
            });
          }
        });
      } else {
        wx.showToast({
          title: message,
          icon: "none"
        });
      }
    } finally {
      this.setData({ submittingOrder: false });
    }
  }
});
