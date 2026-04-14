const { ensureMiniSession } = require("../../utils/mini-auth");
const { getSelectedSchool } = require("../../utils/school-state");
const { fetchMessageList, markAllMessagesRead, markMessageRead } = require("../../utils/messages-api");

const LABELS = {
  pageTitle: "消息",
  systemTab: "系统消息",
  interactiveTab: "互动消息",
  officialNotice: "官方通知",
  storefront: "创业店铺",
  home: "首页",
  profile: "我的",
  noSystemMessage: "当前高校暂无系统消息",
  noInteractiveMessage: "当前高校暂无互动消息",
  readAll: "全部已读",
  unread: "未读",
  orderNotice: "订单通知",
  orderAction: "查看订单",
  loadFailed: "消息加载失败，请稍后重试",
  markReadSuccess: "已全部设为已读",
  actionFailed: "操作失败"
};

function getTargetUrl(item) {
  if (!item) {
    return "";
  }

  if (item.targetType === "order" && item.targetId) {
    return `/pages/order-detail/order-detail?id=${item.targetId}`;
  }

  if (item.targetType === "post" && item.targetId) {
    return `/pages/post-detail/post-detail?id=${item.targetId}`;
  }

  return "";
}

Page({
  data: {
    statusBarHeight: 20,
    selectedSchool: "",
    activeTab: "system",
    labels: LABELS,
    tabs: [
      { key: "system", label: LABELS.systemTab },
      { key: "interactive", label: LABELS.interactiveTab }
    ],
    systemMessages: [],
    interactiveMessages: [],
    unreadCount: {
      system: 0,
      interactive: 0
    },
    loadFailed: false
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });
  },

  async onShow() {
    await this.loadMessages();
  },

  async loadMessages() {
    const selectedSchool = getSelectedSchool();

    try {
      await ensureMiniSession();
      const remote = await fetchMessageList({
        school: selectedSchool
      });

      this.setData({
        selectedSchool,
        systemMessages: remote.systemMessages || [],
        interactiveMessages: remote.interactiveMessages || [],
        unreadCount: remote.unreadCount || { system: 0, interactive: 0 },
        loadFailed: false
      });
    } catch (error) {
      this.setData({
        selectedSchool,
        systemMessages: [],
        interactiveMessages: [],
        unreadCount: { system: 0, interactive: 0 },
        loadFailed: true
      });
    }
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

  async openMessage(event) {
    const { id, type } = event.currentTarget.dataset;
    const targetKey = type === "interactive" ? "interactiveMessages" : "systemMessages";
    const unreadKey = type === "interactive" ? "interactive" : "system";
    const list = this.data[targetKey] || [];
    const index = list.findIndex((item) => String(item.id) === String(id));
    if (index === -1) {
      return;
    }

    const current = list[index];

    if (!current.read) {
      try {
        await ensureMiniSession();
        await markMessageRead(id);
        this.setData({
          [`${targetKey}[${index}].read`]: true,
          [`unreadCount.${unreadKey}`]: Math.max(0, Number(this.data.unreadCount[unreadKey] || 0) - 1)
        });
      } catch (error) {}
    }

    const url = getTargetUrl(current);
    if (url) {
      wx.navigateTo({ url });
    }
  },

  async markCurrentTabRead() {
    const type = this.data.activeTab;
    try {
      await ensureMiniSession();
      await markAllMessagesRead(
        { type },
        { school: this.data.selectedSchool }
      );
      const key = type === "interactive" ? "interactiveMessages" : "systemMessages";
      const current = (this.data[key] || []).map((item) => ({
        ...item,
        read: true
      }));
      this.setData({
        [key]: current,
        [`unreadCount.${type === "interactive" ? "interactive" : "system"}`]: 0
      });
      wx.showToast({
        title: LABELS.markReadSuccess,
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: error.message || LABELS.actionFailed,
        icon: "none"
      });
    }
  },

  goHome() {
    wx.redirectTo({
      url: "/pages/index/index"
    });
  },

  goStorefront() {
    wx.redirectTo({
      url: "/pages/storefront/storefront"
    });
  },

  goProfile() {
    wx.redirectTo({
      url: "/pages/profile/profile"
    });
  }
});
