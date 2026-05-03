const { getPublishType } = require("../../utils/publish-config");
const { getPrimaryCategoryByType } = require("../../utils/post-category-view");
const { getCampusSchool, setVerificationInfo } = require("../../utils/verification-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { createPost } = require("../../utils/posts-api");
const { uploadImage } = require("../../utils/upload-api");
const { fetchCurrentVerification } = require("../../utils/verification-api");

Page({
  data: {
    statusBarHeight: 20,
    type: "tree-hole",
    pageTitle: "情感树洞",
    category: "",
    useCustomDisplayName: false,
    displayName: "",
    onlyCampus: true,
    title: "",
    content: "",
    phone: "",
    qq: "",
    wechat: "",
    publishSchool: "",
    publishing: false,
    imageFiles: []
  },

  onLoad(options) {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const type = options.type || "tree-hole";
    const config = getPublishType(type);
    const category = decodeURIComponent(options.category || "");

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      type,
      pageTitle: config.label,
      category,
      publishSchool: getCampusSchool()
    });
  },

  onShow() {
    this.setData({
      publishSchool: getCampusSchool()
    });
  },

  goBack() {
    wx.navigateBack();
  },

  onSwitchChange(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [field]: event.detail.value
    });
  },

  onInputChange(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [field]: event.detail.value
    });
  },

  chooseImages() {
    const remain = 9 - this.data.imageFiles.length;
    if (remain <= 0) {
      wx.showToast({ title: "最多上传 9 张图片", icon: "none" });
      return;
    }

    wx.chooseMedia({
      count: remain,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const nextFiles = (res.tempFiles || []).map((item) => ({
          localPath: item.tempFilePath,
          url: "",
          uploading: false
        }));
        this.setData({
          imageFiles: this.data.imageFiles.concat(nextFiles).slice(0, 9)
        });
      }
    });
  },

  removeImage(event) {
    const { index } = event.currentTarget.dataset;
    const nextFiles = this.data.imageFiles.filter((_, currentIndex) => currentIndex !== Number(index));
    this.setData({
      imageFiles: nextFiles
    });
  },

  async ensureUploadedImages() {
    const nextFiles = this.data.imageFiles.slice();

    for (let index = 0; index < nextFiles.length; index += 1) {
      const current = nextFiles[index];
      if (current.url) continue;

      nextFiles[index] = {
        ...current,
        uploading: true
      };
      this.setData({ imageFiles: nextFiles });

      const uploaded = await uploadImage(current.localPath, "post");
      nextFiles[index] = {
        ...current,
        url: uploaded.url,
        uploading: false
      };
      this.setData({ imageFiles: nextFiles });
    }

    return nextFiles.map((item) => item.url).filter(Boolean);
  },

  async syncVerificationSchool() {
    try {
      await ensureMiniSession();
      const remoteInfo = await fetchCurrentVerification();
      setVerificationInfo({
        ...remoteInfo,
        verified: !!remoteInfo.verified
      });
      this.setData({
        publishSchool: getCampusSchool()
      });
    } catch (error) {}
  },

  async submitPublish() {
    const title = String(this.data.title || "").trim();
    const content = String(this.data.content || "").trim();
    const category = String(this.data.category || "").trim();
    const displayName = String(this.data.displayName || "").trim();

    if (!category) {
      wx.showToast({ title: "请选择分类", icon: "none" });
      return;
    }

    if (title.length < 2) {
      wx.showToast({ title: "标题至少 2 个字", icon: "none" });
      return;
    }

    if (content.length < 5) {
      wx.showToast({ title: "内容至少 5 个字", icon: "none" });
      return;
    }

    if (this.data.useCustomDisplayName && displayName.length < 2) {
      wx.showToast({ title: "展示昵称至少 2 个字", icon: "none" });
      return;
    }

    const contacts = [
      this.data.phone ? { label: "手机", value: this.data.phone.trim() } : null,
      this.data.qq ? { label: "QQ", value: this.data.qq.trim() } : null,
      this.data.wechat ? { label: "微信", value: this.data.wechat.trim() } : null
    ].filter(Boolean);

    this.setData({ publishing: true });

    try {
      await this.syncVerificationSchool();
      const images = await this.ensureUploadedImages();
      const publishSchool = getCampusSchool();

      await createPost({
        school: publishSchool,
        primaryCategory: getPrimaryCategoryByType(this.data.type),
        category,
        title,
        content,
        displayName: this.data.useCustomDisplayName ? displayName : "",
        images,
        contacts,
        anonymous: false,
        onlyCampus: !!this.data.onlyCampus
      });

      wx.showToast({
        title: "发布成功，已展示",
        icon: "success"
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 800);
    } catch (error) {
      wx.showToast({
        title: error && error.message ? error.message : "发布失败",
        icon: "none"
      });
    } finally {
      this.setData({ publishing: false });
    }
  }
});
