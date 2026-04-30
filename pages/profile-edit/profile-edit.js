const { buildAvatarView } = require("../../utils/avatar");
const { getProfile, setProfile } = require("../../utils/mini-auth");
const { fetchMiniProfile, updateMiniProfile } = require("../../utils/profile-api");
const { uploadImage } = require("../../utils/upload-api");

Page({
  data: {
    statusBarHeight: 20,
    nickname: "",
    avatarUrl: "",
    avatarView: buildAvatarView(""),
    saving: false,
    uploading: false
  },

  async onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const profile = getProfile();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      nickname: profile.nickname || "校园用户",
      avatarUrl: profile.avatarUrl || "",
      avatarView: buildAvatarView(profile.avatarUrl || "")
    });
    await this.loadProfile();
  },

  async loadProfile() {
    try {
      const profile = await fetchMiniProfile();
      setProfile(profile);
      this.setData({
        nickname: profile.nickname || "校园用户",
        avatarUrl: profile.avatarUrl || "",
        avatarView: buildAvatarView(profile.avatarUrl || "")
      });
    } catch (error) {}
  },

  onNicknameInput(event) {
    this.setData({
      nickname: event.detail.value
    });
  },

  async onChooseWechatAvatar(event) {
    const avatarPath = event.detail && event.detail.avatarUrl;
    if (!avatarPath) return;
    await this.uploadAvatar(avatarPath);
  },

  chooseAvatarFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: async (res) => {
        const filePath = res.tempFiles && res.tempFiles[0] ? res.tempFiles[0].tempFilePath : "";
        if (!filePath) return;
        await this.uploadAvatar(filePath);
      }
    });
  },

  async uploadAvatar(filePath) {
    if (this.data.uploading) return;
    this.setData({ uploading: true });
    wx.showLoading({ title: "上传中", mask: true });
    try {
      const uploaded = await uploadImage(filePath, "avatar");
      this.setData({
        avatarUrl: uploaded.url,
        avatarView: buildAvatarView(uploaded.url)
      });
    } catch (error) {
      wx.showToast({
        title: error && error.message ? error.message : "头像上传失败",
        icon: "none"
      });
    } finally {
      wx.hideLoading();
      this.setData({ uploading: false });
    }
  },

  async saveProfile() {
    const nickname = String(this.data.nickname || "").trim();
    if (!nickname) {
      wx.showToast({ title: "请输入昵称", icon: "none" });
      return;
    }

    this.setData({ saving: true });
    try {
      const profile = await updateMiniProfile({
        nickname,
        avatarUrl: this.data.avatarUrl || ""
      });
      setProfile(profile);
      this.setData({
        nickname: profile.nickname || nickname,
        avatarUrl: profile.avatarUrl || "",
        avatarView: buildAvatarView(profile.avatarUrl || "")
      });
      wx.showToast({ title: "资料已更新", icon: "success" });
      setTimeout(() => {
        wx.navigateBack();
      }, 600);
    } catch (error) {
      wx.showToast({
        title: error && error.message ? error.message : "保存失败",
        icon: "none"
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
