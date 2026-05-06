const { ensureMiniSession, getToken } = require("../../utils/mini-auth");
const { getSelectedSchool } = require("../../utils/school-state");
const { calcUnreadTotal, formatBadgeCount } = require("../../utils/message-badge");
const { deleteMessage, fetchMessageList, markAllMessagesRead, markMessageRead } = require("../../utils/messages-api");
const { requireLogin } = require("../../utils/login-guard");

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
    navRightSafeRpx: 24,
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
    messageBadgeCount: 0,
    messageBadgeText: "",
    loadFailed: false
  },

  onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      navRightSafeRpx: this.getNavRightSafeRpx(systemInfo, menuButton)
    });
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
    if (!getToken()) {
      const passed = await requireLogin({
        title: "消息功能需要登录",
        content: "查看系统消息和互动消息需要微信授权登录。"
      });
      if (!passed) {
        wx.redirectTo({
          url: "/pages/index/index"
        });
        return;
      }
    }

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
        messageBadgeCount: calcUnreadTotal(remote.unreadCount || {}),
        messageBadgeText: formatBadgeCount(calcUnreadTotal(remote.unreadCount || {})),
        loadFailed: false
      });
    } catch (error) {
      this.setData({
        selectedSchool,
        systemMessages: [],
        interactiveMessages: [],
        unreadCount: { system: 0, interactive: 0 },
        messageBadgeCount: 0,
        messageBadgeText: "",
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
          [`unreadCount.${unreadKey}`]: Math.max(0, Number(this.data.unreadCount[unreadKey] || 0) - 1),
          messageBadgeCount: Math.max(0, Number(this.data.messageBadgeCount || 0) - 1),
          messageBadgeText: formatBadgeCount(Math.max(0, Number(this.data.messageBadgeCount || 0) - 1))
        });
      } catch (error) {}
    }

    const url = getTargetUrl(current);
    if (url) {
      wx.navigateTo({ url });
    }
  },

  async deleteMessage(event) {
    const { id, type } = event.currentTarget.dataset;
    if (!id) {
      return;
    }

    const { confirm } = await wx.showModal({
      title: "删除消息",
      content: "删除后将不再展示这条消息，确定删除吗？",
      confirmText: "删除",
      confirmColor: "#e5484d",
      cancelText: "取消"
    });
    if (!confirm) {
      return;
    }

    const targetKey = type === "interactive" ? "interactiveMessages" : "systemMessages";
    const unreadKey = type === "interactive" ? "interactive" : "system";
    const list = this.data[targetKey] || [];
    const current = list.find((item) => String(item.id) === String(id));
    const unreadDelta = current && !current.read ? 1 : 0;

    try {
      await ensureMiniSession();
      await deleteMessage(id);
      const nextUnread = Math.max(0, Number(this.data.unreadCount[unreadKey] || 0) - unreadDelta);
      const nextBadgeCount = Math.max(0, Number(this.data.messageBadgeCount || 0) - unreadDelta);
      this.setData({
        [targetKey]: list.filter((item) => String(item.id) !== String(id)),
        [`unreadCount.${unreadKey}`]: nextUnread,
        messageBadgeCount: nextBadgeCount,
        messageBadgeText: formatBadgeCount(nextBadgeCount)
      });
      wx.showToast({
        title: "已删除",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: error.message || LABELS.actionFailed,
        icon: "none"
      });
    }
  },

  async markCurrentTabRead() {
    const type = this.data.activeTab;
    try {
      await ensureMiniSession();
      await markAllMessagesRead({ type }, { school: this.data.selectedSchool });
      const key = type === "interactive" ? "interactiveMessages" : "systemMessages";
      const current = (this.data[key] || []).map((item) => ({
        ...item,
        read: true
      }));
      this.setData({
        [key]: current,
        [`unreadCount.${type === "interactive" ? "interactive" : "system"}`]: 0,
        messageBadgeCount: type === "interactive" ? Number(this.data.unreadCount.system || 0) : Number(this.data.unreadCount.interactive || 0),
        messageBadgeText: formatBadgeCount(type === "interactive" ? Number(this.data.unreadCount.system || 0) : Number(this.data.unreadCount.interactive || 0))
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
