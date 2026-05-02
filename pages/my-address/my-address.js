const { ensureMiniSession } = require("../../utils/mini-auth");
const { getSelectedSchool } = require("../../utils/school-state");
const {
  createAddress,
  deleteAddress,
  fetchAddressList,
  setDefaultAddress,
  updateAddress
} = require("../../utils/address-api");

const LABELS = {
  title: "\u6211\u7684\u5730\u5740",
  add: "\u65b0\u589e\u5730\u5740",
  addTitle: "\u65b0\u589e\u5730\u5740",
  editTitle: "\u7f16\u8f91\u5730\u5740",
  save: "\u4fdd\u5b58\u5730\u5740",
  saving: "\u4fdd\u5b58\u4e2d...",
  empty: "\u6682\u65e0\u5730\u5740\uff0c\u70b9\u51fb\u4e0b\u65b9\u65b0\u589e",
  defaultTag: "\u9ed8\u8ba4\u5730\u5740",
  setDefault: "\u8bbe\u4e3a\u9ed8\u8ba4",
  edit: "\u7f16\u8f91",
  remove: "\u5220\u9664",
  cancel: "\u53d6\u6d88",
  confirmDelete: "\u786e\u5b9a\u5220\u9664\u8fd9\u4e2a\u5730\u5740\u5417\uff1f",
  school: "\u5b66\u6821",
  name: "\u6536\u8d27\u4eba",
  phone: "\u624b\u673a\u53f7",
  detail: "\u8be6\u7ec6\u5730\u5740",
  tag: "\u5730\u5740\u6807\u7b7e",
  helper: {
    school: "\u9ed8\u8ba4\u4f7f\u7528\u5f53\u524d\u9009\u62e9\u7684\u5b66\u6821\uff0c\u7528\u4e8e\u6821\u5185\u914d\u9001\u8303\u56f4\u5224\u65ad",
    name: "\u8bf7\u586b\u5199\u771f\u5b9e\u59d3\u540d\uff0c2-20 \u4e2a\u5b57",
    phone: "\u5546\u5bb6\u53ef\u80fd\u901a\u8fc7\u8be5\u624b\u673a\u53f7\u8054\u7cfb\u4f60",
    detail: "\u5efa\u8bae\u586b\u5199\u5bbf\u820d\u697c\u3001\u697c\u5c42\u3001\u95e8\u724c\u53f7\u6216\u81ea\u63d0\u70b9",
    tag: "\u4f8b\u5982\uff1a\u5bbf\u820d\u3001\u6559\u5b66\u697c\u3001\u81ea\u63d0\u70b9"
  },
  placeholders: {
    name: "\u8bf7\u586b\u5199\u6536\u8d27\u4eba\u59d3\u540d",
    phone: "\u8bf7\u586b\u5199\u624b\u673a\u53f7",
    detail: "\u8bf7\u586b\u5199\u5bbf\u820d\u697c\u3001\u95e8\u724c\u53f7\u6216\u81ea\u63d0\u70b9",
    tag: "\u4f8b\u5982\uff1a\u9ed8\u8ba4\u5730\u5740 / \u81ea\u63d0\u5730\u5740"
  }
};

function getInitialForm() {
  return {
    school: getSelectedSchool(),
    receiverName: "",
    phone: "",
    detail: "",
    tag: "",
    isDefault: false
  };
}

Page({
  data: {
    statusBarHeight: 20,
    labels: LABELS,
    addressList: [],
    loading: true,
    submitting: false,
    modalVisible: false,
    editingId: null,
    form: getInitialForm(),
    detailLength: 0
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
  },

  async onShow() {
    await this.loadAddressList();
  },

  async loadAddressList() {
    this.setData({ loading: true });
    try {
      await ensureMiniSession();
      const addressList = await fetchAddressList();
      this.setData({
        addressList: addressList || []
      });
    } catch (error) {
      this.setData({
        addressList: []
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  openCreateModal() {
    this.setData({
      modalVisible: true,
      editingId: null,
      form: getInitialForm(),
      detailLength: 0
    });
  },

  openEditModal(event) {
    const { id } = event.currentTarget.dataset;
    const current = this.data.addressList.find((item) => Number(item.id) === Number(id));
    if (!current) {
      return;
    }

    this.setData({
      modalVisible: true,
      editingId: current.id,
      form: {
        school: current.school || getSelectedSchool(),
        receiverName: current.name || "",
        phone: current.phone || "",
        detail: current.address || "",
        tag: current.tag === LABELS.defaultTag ? "" : current.tag || "",
        isDefault: !!current.isDefault
      },
      detailLength: String(current.address || "").length
    });
  },

  closeModal() {
    if (this.data.submitting) {
      return;
    }

    this.setData({
      modalVisible: false,
      editingId: null,
      form: getInitialForm(),
      detailLength: 0
    });
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset;
    if (!field) {
      return;
    }

    const value = event.detail.value;
    const nextData = {
      [`form.${field}`]: value
    };

    if (field === "detail") {
      nextData.detailLength = String(value || "").length;
    }

    this.setData(nextData);
  },

  onDefaultChange(event) {
    this.setData({
      "form.isDefault": !!event.detail.value
    });
  },

  async submitAddress() {
    const isEditing = !!this.data.editingId;
    const payload = {
      school: String(this.data.form.school || getSelectedSchool()).trim(),
      receiverName: String(this.data.form.receiverName || "").trim(),
      phone: String(this.data.form.phone || "").trim(),
      detail: String(this.data.form.detail || "").trim(),
      tag: String(this.data.form.tag || "").trim() || LABELS.defaultTag,
      isDefault: !!this.data.form.isDefault
    };

    if (payload.receiverName.length < 2) {
      wx.showToast({ title: "\u6536\u8d27\u4eba\u81f3\u5c11 2 \u4e2a\u5b57", icon: "none" });
      return;
    }

    if (!/^1\d{10}$/.test(payload.phone)) {
      wx.showToast({ title: "\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u624b\u673a\u53f7", icon: "none" });
      return;
    }

    if (payload.detail.length < 5) {
      wx.showToast({ title: "\u8be6\u7ec6\u5730\u5740\u81f3\u5c11 5 \u4e2a\u5b57", icon: "none" });
      return;
    }

    if (payload.tag.length < 2) {
      wx.showToast({ title: "\u8bf7\u586b\u5199\u5730\u5740\u6807\u7b7e", icon: "none" });
      return;
    }

    this.setData({ submitting: true });
    try {
      await ensureMiniSession();
      if (isEditing) {
        await updateAddress(this.data.editingId, payload);
      } else {
        await createAddress(payload);
      }

      await this.loadAddressList();
      this.setData({
        modalVisible: false,
        editingId: null,
        form: getInitialForm(),
        detailLength: 0
      });
      wx.showToast({
        title: isEditing ? "\u5df2\u66f4\u65b0\u5730\u5740" : "\u5df2\u65b0\u589e\u5730\u5740",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "\u4fdd\u5b58\u5931\u8d25",
        icon: "none"
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async handleSetDefault(event) {
    const { id } = event.currentTarget.dataset;
    try {
      await ensureMiniSession();
      await setDefaultAddress(id);
      await this.loadAddressList();
      wx.showToast({
        title: "\u5df2\u8bbe\u4e3a\u9ed8\u8ba4",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "\u8bbe\u7f6e\u5931\u8d25",
        icon: "none"
      });
    }
  },

  handleDelete(event) {
    const { id } = event.currentTarget.dataset;
    wx.showModal({
      title: "\u5220\u9664\u5730\u5740",
      content: LABELS.confirmDelete,
      success: async (res) => {
        if (!res.confirm) {
          return;
        }

        try {
          await ensureMiniSession();
          await deleteAddress(id);
          await this.loadAddressList();
          wx.showToast({
            title: "\u5df2\u5220\u9664",
            icon: "success"
          });
        } catch (error) {
          wx.showToast({
            title: error.message || "\u5220\u9664\u5931\u8d25",
            icon: "none"
          });
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  },

  noop() {}
});
