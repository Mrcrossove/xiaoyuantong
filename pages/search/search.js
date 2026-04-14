const { fetchPostList } = require("../../utils/posts-api");
const { fetchMessageList } = require("../../utils/messages-api");
const { fetchStoreList } = require("../../utils/stores-api");
const { getSelectedSchool } = require("../../utils/school-state");
const { normalizeStoreList } = require("../../utils/store-cover");

const LABELS = {
  title: "统一搜索",
  placeholder: "搜索帖子、店铺和消息",
  clear: "清空",
  currentSchool: "当前高校",
  allSchools: "全部高校",
  all: "全部",
  posts: "帖子",
  shops: "店铺",
  messages: "消息",
  inputHint: "输入关键词开始搜索",
  inputDesc: "可搜索当前高校或全部高校内的帖子、创业店铺和消息内容",
  emptyTitle: "没有找到相关内容",
  emptyDesc: "换个关键词试试，或者切换筛选范围",
  countSuffix: "条",
  monthlySales: "月售",
  star: "★",
  partialError: "部分搜索结果加载失败，已展示当前可用内容",
  searching: "正在搜索"
};

Page({
  data: {
    statusBarHeight: 20,
    keyword: "",
    selectedSchool: "",
    scope: "current",
    activeTab: "all",
    labels: LABELS,
    scopeOptions: [
      { key: "current", label: LABELS.currentSchool },
      { key: "all", label: LABELS.allSchools }
    ],
    resultTabs: [
      { key: "all", label: LABELS.all },
      { key: "posts", label: LABELS.posts },
      { key: "shops", label: LABELS.shops },
      { key: "messages", label: LABELS.messages }
    ],
    postResults: [],
    shopResults: [],
    messageResults: [],
    postCount: 0,
    shopCount: 0,
    messageCount: 0,
    partialErrorText: "",
    searching: false
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const keyword = decodeURIComponent(options.keyword || "");

    this.searchSeq = 0;

    this.setData({
      keyword,
      selectedSchool: getSelectedSchool(),
      statusBarHeight: systemInfo.statusBarHeight || 20
    });

    this.runSearch();
  },

  onShow() {
    const selectedSchool = getSelectedSchool();
    if (selectedSchool !== this.data.selectedSchool) {
      this.setData({
        selectedSchool
      });
      this.runSearch();
    }
  },

  onKeywordInput(event) {
    this.setData({
      keyword: event.detail.value
    });
    this.runSearch();
  },

  clearKeyword() {
    this.setData({
      keyword: ""
    });
    this.runSearch();
  },

  switchScope(event) {
    const { key } = event.currentTarget.dataset;
    if (!key || key === this.data.scope) {
      return;
    }

    this.setData({
      scope: key
    });
    this.runSearch();
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

  async runSearch() {
    const { keyword, selectedSchool, scope } = this.data;
    const trimmedKeyword = String(keyword || "").trim();

    if (!trimmedKeyword) {
      this.setData({
        postResults: [],
        shopResults: [],
        messageResults: [],
        postCount: 0,
        shopCount: 0,
        messageCount: 0,
        partialErrorText: "",
        searching: false
      });
      return;
    }

    this.searchSeq = (this.searchSeq || 0) + 1;
    const currentSearchSeq = this.searchSeq;
    const school = scope === "current" ? selectedSchool : "";

    this.setData({
      searching: true,
      partialErrorText: ""
    });

    const [postTask, messageTask, storeTask] = await Promise.allSettled([
      fetchPostList({
        page: 1,
        pageSize: 50,
        keyword: trimmedKeyword,
        school
      }),
      fetchMessageList({
        keyword: trimmedKeyword,
        school
      }),
      fetchStoreList({
        keyword: trimmedKeyword,
        school
      })
    ]);

    if (currentSearchSeq !== this.searchSeq) {
      return;
    }

    const postResults = postTask.status === "fulfilled" ? postTask.value.list || [] : [];
    const shopResults = storeTask.status === "fulfilled" ? normalizeStoreList(storeTask.value.list || []) : [];
    const messageResults =
      messageTask.status === "fulfilled"
        ? []
            .concat(messageTask.value.systemMessages || [])
            .concat(messageTask.value.interactiveMessages || [])
        : [];

    const partialErrorText =
      postTask.status === "rejected" || messageTask.status === "rejected" || storeTask.status === "rejected"
        ? LABELS.partialError
        : "";

    this.setData({
      postResults,
      shopResults,
      messageResults,
      postCount: postResults.length,
      shopCount: shopResults.length,
      messageCount: messageResults.length,
      partialErrorText,
      searching: false
    });
  },

  openPostDetail(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) {
      return;
    }
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${id}`
    });
  },

  openShopDetail(event) {
    const { id } = event.currentTarget.dataset;
    if (!id) {
      return;
    }

    wx.navigateTo({
      url: `/pages/store-detail/store-detail?id=${id}`
    });
  },

  goMessage() {
    wx.redirectTo({
      url: "/pages/message/message"
    });
  },

  goStorefront() {
    wx.redirectTo({
      url: "/pages/storefront/storefront"
    });
  },

  goHome() {
    wx.redirectTo({
      url: "/pages/index/index"
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
