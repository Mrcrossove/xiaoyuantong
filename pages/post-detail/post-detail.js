const {
  createPostComment,
  fetchPostDetail,
  togglePostLike
} = require("../../utils/posts-api");
const { getSelectedSchool } = require("../../utils/school-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { fetchFavoriteStatus, toggleFavorite } = require("../../utils/favorites-api");
const { requireLogin } = require("../../utils/login-guard");

function isStyleImage(value) {
  return /^style-/.test(String(value || ""));
}

function buildImageViews(images) {
  return (Array.isArray(images) ? images : [])
    .map((url) => {
      const value = String(url || "").trim();
      const styleImage = isStyleImage(value);
      return {
        url: value,
        className: styleImage ? value : "",
        isImage: !!value && !styleImage
      };
    })
    .filter((item) => item.url);
}

function normalizePost(post) {
  if (!post) return null;
  return {
    ...post,
    imageViews: buildImageViews(post.images),
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
    commentInputFocused: false,
    sendingComment: false,
    loadErrorText: "",
    keyboardHeight: 0
  },

  async onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20
    });

    await this.loadPostDetail(options.id);
    await this.loadFavoriteStatus(options.id);
    this.bindKeyboardHeightChange();
  },

  onUnload() {
    if (this.keyboardHeightChangeHandler && wx.offKeyboardHeightChange) {
      wx.offKeyboardHeightChange(this.keyboardHeightChangeHandler);
    }
  },

  bindKeyboardHeightChange() {
    if (!wx.onKeyboardHeightChange) {
      return;
    }

    this.keyboardHeightChangeHandler = (res) => {
      const height = Number((res && res.height) || 0);
      this.setData({
        keyboardHeight: height > 0 ? height + 8 : 0
      });
    };

    wx.onKeyboardHeightChange(this.keyboardHeightChangeHandler);
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

  previewPostImage(event) {
    const current = String((event.currentTarget.dataset && event.currentTarget.dataset.url) || "").trim();
    const urls = ((this.data.post && this.data.post.imageViews) || [])
      .filter((item) => item.isImage)
      .map((item) => item.url);

    if (!current || !urls.length) {
      return;
    }

    wx.previewImage({
      current,
      urls
    });
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

  copyContact(event) {
    const value = String((event.currentTarget.dataset && event.currentTarget.dataset.value) || "").trim();
    if (!value) {
      wx.showToast({
        title: "暂无可复制内容",
        icon: "none"
      });
      return;
    }

    wx.setClipboardData({
      data: value,
      success: () => {
        wx.showToast({
          title: "已复制",
          icon: "success"
        });
      },
      fail: () => {
        wx.showToast({
          title: "复制失败",
          icon: "none"
        });
      }
    });
  },

  async togglePostFavorite() {
    if (!this.data.post) {
      return;
    }

    try {
      const passed = await requireLogin({
        title: "收藏前请先登录",
        content: "浏览帖子无需登录，收藏帖子时需要微信授权登录。"
      });
      if (!passed) return;

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
      const passed = await requireLogin({
        title: "点赞前请先登录",
        content: "浏览帖子无需登录，点赞时需要微信授权登录。"
      });
      if (!passed) return;

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
    requireLogin({
      title: "评论前请先登录",
      content: "浏览帖子无需登录，发表评论时需要微信授权登录。"
    }).then((passed) => {
      if (!passed) return;
      this.setData({
        commentInput: this.data.commentInput || "",
        commentInputFocused: true
      });
    });
  },

  onCommentFocus(event) {
    const height = Number((event && event.detail && event.detail.height) || this.data.keyboardHeight || 0);
    this.setData({
      commentInputFocused: true,
      keyboardHeight: height > 0 ? height + 8 : this.data.keyboardHeight
    });
  },

  onCommentBlur() {
    this.setData({
      commentInputFocused: false,
      keyboardHeight: 0
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
      const passed = await requireLogin({
        title: "评论前请先登录",
        content: "发表评论需要微信授权登录。"
      });
      if (!passed) {
        this.setData({ sendingComment: false });
        return;
      }

      await ensureMiniSession();
      const result = await createPostComment(this.data.post.id, { content });
      const comments = (this.data.post.comments || []).concat(result.comment);
      this.setData({
        "post.comments": comments,
        "post.commentCount": Number(result.commentCount || comments.length),
        commentInput: "",
        commentInputFocused: false,
        keyboardHeight: 0
      });
      if (wx.hideKeyboard) {
        wx.hideKeyboard();
      }
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
    const title = post.title ? `${post.title} - 校院通` : "校院通帖子分享";
    const path = post.id ? `/pages/post-detail/post-detail?id=${encodeURIComponent(String(post.id))}` : "/pages/index/index";

    return {
      title,
      path
    };
  }
});
