const { fetchStoreDetail } = require("../../utils/stores-api");
const { fetchAddressList } = require("../../utils/address-api");
const { getSelectedSchool } = require("../../utils/school-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { fetchFavoriteStatus, toggleFavorite } = require("../../utils/favorites-api");
const { createOrder } = require("../../utils/order-api");
const { normalizeStoreDetail } = require("../../utils/store-cover");

function pickDefaultProduct(detail) {
  const products = (detail && detail.products) || [];
  return products.find((item) => item && item.recommended) || products[0] || null;
}

function parsePriceNumber(priceText) {
  const value = Number(String(priceText || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function formatAmount(price, quantity) {
  if (!price || !quantity) {
    return "￥0";
  }
  const amount = Number((price * quantity).toFixed(2));
  const text = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `￥${text}`;
}

function getMaxQuantity(product) {
  if (!product) {
    return 1;
  }

  const stock = Number(product.stock || 0);
  const dailyLimit = Number(product.dailyLimit || 0);
  let max = dailyLimit > 0 ? dailyLimit : 99;

  if (stock > 0) {
    max = Math.min(max, stock);
  }

  return Math.max(1, max);
}

function buildSelectionState(product, nextQuantity) {
  const currentProduct = product || null;
  const maxQuantity = getMaxQuantity(currentProduct);
  const quantity = Math.min(Math.max(1, Number(nextQuantity || 1)), maxQuantity);
  const currentAmountText = currentProduct ? formatAmount(parsePriceNumber(currentProduct.price), quantity) : "￥0";

  return {
    currentProduct,
    selectedProductId: currentProduct ? String(currentProduct.id) : "",
    quantity,
    maxQuantity,
    currentAmountText
  };
}

function buildDetailState(detail) {
  const normalizedDetail = normalizeStoreDetail(detail);
  const currentProduct = pickDefaultProduct(normalizedDetail);

  return {
    detail: normalizedDetail,
    ...buildSelectionState(currentProduct, 1)
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
  return `${name} ${phone}${tag} ${detail}`;
}

Page({
  data: {
    statusBarHeight: 20,
    selectedSchool: "",
    detail: null,
    activeTab: "goods",
    favorite: false,
    submittingOrder: false,
    selectedProductId: "",
    currentProduct: null,
    currentAmountText: "￥0",
    quantity: 1,
    maxQuantity: 1,
    addressList: [],
    selectedAddress: null,
    addressSummary: "请先添加收货地址",
    confirmVisible: false
  },

  async onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });

    await this.loadStoreDetail(options.id);
    await Promise.all([this.loadFavoriteStatus(options.id), this.loadDefaultAddress()]);
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

    this.setData(buildSelectionState(currentProduct, 1));
  },

  decreaseQuantity() {
    const nextQuantity = Math.max(1, Number(this.data.quantity || 1) - 1);
    if (nextQuantity === this.data.quantity) {
      return;
    }
    this.setData(buildSelectionState(this.data.currentProduct, nextQuantity));
  },

  increaseQuantity() {
    const nextQuantity = Math.min(Number(this.data.maxQuantity || 1), Number(this.data.quantity || 1) + 1);
    if (nextQuantity === this.data.quantity) {
      const message =
        Number((this.data.currentProduct && this.data.currentProduct.dailyLimit) || 0) > 0
          ? "已达到每日限购"
          : "已达到可下单上限";
      wx.showToast({
        title: message,
        icon: "none"
      });
      return;
    }
    this.setData(buildSelectionState(this.data.currentProduct, nextQuantity));
  },

  async toggleStoreFavorite() {
    if (!this.data.detail) {
      return;
    }

    try {
      await ensureMiniSession();
      const result = await toggleFavorite({
        targetType: "store",
        targetId: String(this.options.id || ""),
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
    if (!this.data.currentProduct) {
      return;
    }

    if (!this.data.selectedAddress) {
      wx.showModal({
        title: "需要地址",
        content: "下单前请先添加收货地址。",
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
    if (this.data.submittingOrder || !this.data.detail || !this.data.currentProduct || !this.data.selectedAddress) {
      return;
    }

    this.setData({ submittingOrder: true });
    try {
      await ensureMiniSession();
      const order = await createOrder({
        school: this.data.selectedSchool || getSelectedSchool(),
        storeDetailId: String(this.options.id || ""),
        productId: String(this.data.currentProduct.id || ""),
        quantity: Number(this.data.quantity || 1),
        addressId: Number(this.data.selectedAddress.id)
      });

      this.setData({
        confirmVisible: false
      });

      wx.showModal({
        title: "下单成功",
        content: "订单已创建，接下来可直接查看订单详情并完成支付。",
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: `/pages/order-detail/order-detail?id=${order.id}`
          });
        }
      });
    } catch (error) {
      const message = error.message || "下单失败";
      if (message.indexOf("请先添加收货地址") !== -1) {
        wx.showModal({
          title: "需要地址",
          content: "下单前请先添加收货地址。",
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
