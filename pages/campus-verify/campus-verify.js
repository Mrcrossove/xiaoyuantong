const schools = require("../../utils/school-options");
const { getSelectedSchool, setSelectedSchool } = require("../../utils/school-state");
const { setHomeFeedScope } = require("../../utils/home-feed-state");
const { isSchoolMatched } = require("../../utils/school-catalog");
const { getVerificationInfo, setVerificationInfo } = require("../../utils/verification-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { fetchCurrentVerification, submitVerification } = require("../../utils/verification-api");

function filterSchoolOptions(keyword) {
  const trimmed = String(keyword || "").trim();
  const list = trimmed ? schools.filter((school) => isSchoolMatched(school, trimmed)) : schools;
  return list.slice(0, 50);
}

Page({
  data: {
    statusBarHeight: 20,
    loading: true,
    submitting: false,
    verification: {
      verified: false,
      statusText: "未认证"
    },
    form: {
      name: "",
      phone: "",
      school: ""
    },
    schoolPickerVisible: false,
    schoolKeyword: "",
    schoolOptions: []
  },

  async onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const selectedSchool = getSelectedSchool();
    const verificationInfo = getVerificationInfo();

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      form: {
        name: verificationInfo.name || "",
        phone: verificationInfo.phone || "",
        school: verificationInfo.school || selectedSchool
      },
      verification: verificationInfo,
      schoolKeyword: verificationInfo.school || selectedSchool,
      schoolOptions: filterSchoolOptions(verificationInfo.school || selectedSchool)
    });

    await this.loadVerification();
  },

  async loadVerification() {
    try {
      await ensureMiniSession();
      const remoteInfo = await fetchCurrentVerification();
      const merged = setVerificationInfo({
        ...remoteInfo,
        verified: !!remoteInfo.verified
      });
      this.setData({
        verification: merged,
        form: {
          name: merged.name || "",
          phone: merged.phone || "",
          school: merged.school || getSelectedSchool()
        },
        schoolKeyword: merged.school || getSelectedSchool(),
        schoolOptions: filterSchoolOptions(merged.school || getSelectedSchool())
      });
    } catch (error) {
      const localInfo = getVerificationInfo();
      this.setData({
        verification: localInfo
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onNameInput(event) {
    this.setData({
      "form.name": event.detail.value
    });
  },

  onPhoneInput(event) {
    this.setData({
      "form.phone": event.detail.value
    });
  },

  onSchoolInput(event) {
    const value = event.detail.value;
    this.setData({
      "form.school": value,
      schoolKeyword: value,
      schoolOptions: filterSchoolOptions(value)
    });
  },

  openSchoolPicker() {
    const keyword = this.data.form.school || "";
    this.setData({
      schoolPickerVisible: true,
      schoolKeyword: keyword,
      schoolOptions: filterSchoolOptions(keyword)
    });
  },

  closeSchoolPicker() {
    this.setData({
      schoolPickerVisible: false
    });
  },

  stopTap() {},

  onSchoolKeywordInput(event) {
    const value = event.detail.value;
    this.setData({
      schoolKeyword: value,
      schoolOptions: filterSchoolOptions(value)
    });
  },

  selectSchool(event) {
    const { school } = event.currentTarget.dataset;
    if (!school) return;
    this.setData({
      "form.school": school,
      schoolKeyword: school,
      schoolOptions: filterSchoolOptions(school),
      schoolPickerVisible: false
    });
  },

  async submitVerify() {
    const { name, phone, school } = this.data.form;
    const trimmedName = String(name || "").trim();
    const trimmedPhone = String(phone || "").trim();
    const trimmedSchool = String(school || "").trim();

    if (!trimmedName) {
      wx.showToast({
        title: "请填写姓名",
        icon: "none"
      });
      return;
    }

    if (!/^1\d{10}$/.test(trimmedPhone)) {
      wx.showToast({
        title: "请输入正确的手机号",
        icon: "none"
      });
      return;
    }

    if (!trimmedSchool) {
      wx.showToast({
        title: "请填写学校",
        icon: "none"
      });
      return;
    }

    if (!schools.includes(trimmedSchool)) {
      wx.showToast({
        title: "请从学校列表中选择",
        icon: "none"
      });
      this.openSchoolPicker();
      return;
    }

    this.setData({ submitting: true });

    try {
      await ensureMiniSession();
      const result = await submitVerification({
        name: trimmedName,
        phone: trimmedPhone,
        school: trimmedSchool
      });

      const nextInfo = setVerificationInfo({
        ...result,
        name: trimmedName,
        phone: trimmedPhone,
        school: trimmedSchool,
        verified: true
      });
      setSelectedSchool(trimmedSchool);
      setHomeFeedScope(trimmedSchool, trimmedSchool);

      this.setData({
        verification: nextInfo,
        form: {
          name: trimmedName,
          phone: trimmedPhone,
          school: trimmedSchool
        }
      });

      wx.showToast({
        title: "提交成功",
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
