const {
  createPostComment,
  fetchPostDetail,
  togglePostLike
} = require("../../utils/posts-api");
const { getSelectedSchool } = require("../../utils/school-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { fetchFavoriteStatus, toggleFavorite } = require("../../utils/favorites-api");

function normalizePost(post) {
  if (!post) return null;
  return {
    ...post,
    contact: post.contact || [],
    likeCount: Number(post.likeCount || 0),
    commentCount: Number(post.commentCount || 0),
    viewCount: Number(post.viewCount || 0),
    liked: !!post.liked,
    comments: Array.isArray(post.comments) ? post.comments : []
  };
}

Page({
  data: {
    post: null,
    contactVisible: false,
    statusBarHeight: 20,
    favorite: false,
    commentInput: "",
    sendingComment: false,
    loadErrorText: ""
  },

  async onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });

    await this.loadPostDetail(options.id);
    await this.loadFavoriteStatus(options.id);
  },

  async loadPostDetail(id) {
    try {
      const post = await fetchPostDetail(id);
      this.setData({
        post: normalizePost(post),
        loadErrorText: ""
      });
    } catch (error) {
      this.setData({
        post: null,
        loadErrorText: error.message || "帖子详情加载失败，请稍后重试。"
      });
    }
  },

  async loadFavoriteStatus(id) {
    try {
      await ensureMiniSession();
      const result = await fetchFavoriteStatus({
        targetType: "post",
        targetId: String(id)
      });
      this.setData({
        favorite: !!result.favorite
      });
    } catch (error) {}
  },

  goBack() {
    wx.navigateBack();
  },

  showContact() {
    if (!this.data.post) {
      return;
    }
    this.setData({
      contactVisible: true
    });
  },

  hideContact() {
    this.setData({
      contactVisible: false
    });
  },

  async togglePostFavorite() {
    if (!this.data.post) {
      return;
    }

    try {
      await ensureMiniSession();
      const result = await toggleFavorite({
        targetType: "post",
        targetId: String(this.data.post.id),
        school: this.data.post.school || getSelectedSchool()
      });

      this.setData({
        favorite: !!result.favorite
      });

      wx.showToast({
        title: result.favorite ? "已收藏帖子" : "已取消收藏",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: "操作失败",
        icon: "none"
      });
    }
  },

  async handleToggleLike() {
    if (!this.data.post) {
      return;
    }

    try {
      await ensureMiniSession();
      const result = await togglePostLike(this.data.post.id);
      this.setData({
        "post.liked": !!result.liked,
        "post.likeCount": Number(result.likeCount || 0)
      });
      wx.showToast({
        title: result.liked ? "已点赞" : "已取消点赞",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "点赞失败",
        icon: "none"
      });
    }
  },

  focusCommentInput() {
    this.setData({
      commentInput: this.data.commentInput || ""
    });
  },

  onCommentInput(event) {
    this.setData({
      commentInput: event.detail.value
    });
  },

  async submitComment() {
    const content = String(this.data.commentInput || "").trim();
    if (!this.data.post || !content) {
      wx.showToast({
        title: "请输入评论内容",
        icon: "none"
      });
      return;
    }

    this.setData({ sendingComment: true });
    try {
      await ensureMiniSession();
      const result = await createPostComment(this.data.post.id, { content });
      const comments = (this.data.post.comments || []).concat(result.comment);
      this.setData({
        "post.comments": comments,
        "post.commentCount": Number(result.commentCount || comments.length),
        commentInput: ""
      });
      wx.showToast({
        title: "评论成功",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: error.message || "评论失败",
        icon: "none"
      });
    } finally {
      this.setData({ sendingComment: false });
    }
  },

  onShareAppMessage() {
    const post = this.data.post || {};
    const title = post.title ? `${post.title} - 校园通` : "校园通帖子分享";
    const path = post.id ? `/pages/post-detail/post-detail?id=${encodeURIComponent(String(post.id))}` : "/pages/index/index";

    return {
      title,
      path
    };
  }
});
