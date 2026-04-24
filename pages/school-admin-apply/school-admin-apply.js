const { getSelectedSchool } = require("../../utils/school-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { fetchCurrentSchoolAdminApply, submitSchoolAdminApply } = require("../../utils/school-admin-apply-api");

const STATUS_TEXT = {
  "待处理": "平台正在筛选同校申请，会优先联系合适团队。",
  "已联系": "平台已联系你，请留意电话或微信并确认合作细节。",
  "已分配账号": "你的学校管理员账号已开通，请按平台通知登录后台。",
  "已拒绝": "本次申请未通过，你可以补充团队信息后再次提交。",
  "已关闭": "该申请已结束，如仍有意向可重新提交。"
};

Page({
  data: {
    statusBarHeight: 20,
    loading: true,
    submitting: false,
    currentApply: null,
    form: {
      school: "",
      teamSize: "",
      contact: ""
    }
  },

  async onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      "form.school": getSelectedSchool()
    });
  },

  async onShow() {
    this.setData({
      "form.school": getSelectedSchool()
    });
    await this.loadCurrentApply();
  },

  async loadCurrentApply() {
    this.setData({ loading: true });
    try {
      await ensureMiniSession();
      const result = await fetchCurrentSchoolAdminApply();
      this.setData({
        currentApply: result
          ? {
              ...result,
              statusDesc: STATUS_TEXT[result.status] || "请等待平台处理。"
            }
          : null
      });
    } catch (error) {
      this.setData({
        currentApply: null
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSchoolInput(event) {
    this.setData({
      "form.school": event.detail.value
    });
  },

  onTeamSizeInput(event) {
    this.setData({
      "form.teamSize": event.detail.value
    });
  },

  onContactInput(event) {
    this.setData({
      "form.contact": event.detail.value
    });
  },

  async submitApply() {
    const school = String(this.data.form.school || "").trim();
    const contact = String(this.data.form.contact || "").trim();
    const teamSize = Number(this.data.form.teamSize || 0);

    if (!school) {
      wx.showToast({ title: "请填写学校", icon: "none" });
      return;
    }

    if (!Number.isInteger(teamSize) || teamSize <= 0) {
      wx.showToast({ title: "请填写正确的团队人数", icon: "none" });
      return;
    }

    if (!contact || contact.length < 5) {
      wx.showToast({ title: "请填写联系方式", icon: "none" });
      return;
    }

    this.setData({ submitting: true });
    try {
      await ensureMiniSession();
      const result = await submitSchoolAdminApply({
        school,
        teamSize,
        contact
      });
      this.setData({
        currentApply: {
          ...result,
          statusDesc: STATUS_TEXT[result.status] || "请等待平台处理。"
        },
        form: {
          school,
          teamSize: String(teamSize),
          contact
        }
      });
      wx.showToast({
        title: "申请已提交",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: error && error.message ? error.message : "提交失败，请稍后重试",
        icon: "none"
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
