const schools = require("../../utils/school-options");
const { getSelectedSchool, setSelectedSchool } = require("../../utils/school-state");
const { isSchoolMatched } = require("../../utils/school-catalog");
const { getVerificationInfo, setVerificationInfo } = require("../../utils/verification-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { fetchCurrentVerification, submitVerification } = require("../../utils/verification-api");

function normalizeText(value) {
  return String(value || "").trim();
}

function scoreSchoolMatch(school, keyword) {
  const trimmed = normalizeText(keyword);
  if (!trimmed) return 0;
  if (school === trimmed) return 100;
  if (school.startsWith(trimmed)) return 80;
  if (school.includes(trimmed)) return 60;
  return 10;
}

function filterSchoolOptions(keyword) {
  const trimmed = normalizeText(keyword);
  const list = trimmed ? schools.filter((school) => isSchoolMatched(school, trimmed)) : schools;
  return list
    .slice()
    .sort((left, right) => scoreSchoolMatch(right, trimmed) - scoreSchoolMatch(left, trimmed))
    .slice(0, 50);
}

function getSchoolHelperText(school) {
  const trimmed = normalizeText(school);
  if (!trimmed) {
    return "请点击“选择”，从学校列表中搜索并选择。";
  }
  if (schools.includes(trimmed)) {
    return "已匹配学校标准名称。";
  }
  return "当前不是标准学校名称，请从搜索结果中点击选择。";
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
    schoolMatched: false,
    schoolHelperText: getSchoolHelperText(""),
    schoolPickerVisible: false,
    schoolKeyword: "",
    schoolOptions: []
  },

  async onLoad() {
    const systemInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const verificationInfo = getVerificationInfo();
    const initialSchool = verificationInfo.verified ? verificationInfo.school || "" : "";

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 20,
      form: {
        name: verificationInfo.name || "",
        phone: verificationInfo.phone || "",
        school: initialSchool
      },
      verification: verificationInfo,
      schoolMatched: schools.includes(normalizeText(initialSchool)),
      schoolHelperText: getSchoolHelperText(initialSchool),
      schoolKeyword: initialSchool,
      schoolOptions: filterSchoolOptions(initialSchool)
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
      const school = merged.verified ? merged.school || "" : "";

      this.setData({
        verification: merged,
        form: {
          name: merged.name || "",
          phone: merged.phone || "",
          school
        },
        schoolMatched: schools.includes(normalizeText(school)),
        schoolHelperText: getSchoolHelperText(school),
        schoolKeyword: school,
        schoolOptions: filterSchoolOptions(school)
      });
    } catch (error) {
      const localInfo = getVerificationInfo();
      const school = localInfo.verified ? localInfo.school || "" : "";
      this.setData({
        verification: localInfo,
        form: {
          ...this.data.form,
          school
        },
        schoolMatched: schools.includes(normalizeText(school)),
        schoolHelperText: getSchoolHelperText(school),
        schoolKeyword: school,
        schoolOptions: filterSchoolOptions(school)
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
      schoolMatched: true,
      schoolHelperText: getSchoolHelperText(school),
      schoolKeyword: school,
      schoolOptions: filterSchoolOptions(school),
      schoolPickerVisible: false
    });
  },

  async submitVerify() {
    if (this.data.submitting) return;

    const { name, phone, school } = this.data.form;
    const trimmedName = normalizeText(name);
    const trimmedPhone = normalizeText(phone);
    const trimmedSchool = normalizeText(school);

    if (!trimmedName) {
      wx.showToast({
        title: "请填写姓名",
        icon: "none"
      });
      return;
    }

    if (!/^1\d{10}$/.test(trimmedPhone)) {
      wx.showToast({
        title: "请输入正确手机号",
        icon: "none"
      });
      return;
    }

    if (!trimmedSchool) {
      wx.showToast({
        title: "请选择学校",
        icon: "none"
      });
      this.openSchoolPicker();
      return;
    }

    if (!schools.includes(trimmedSchool)) {
      wx.showToast({
        title: "请点击选择标准学校名称",
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

      this.setData({
        verification: nextInfo,
        form: {
          name: trimmedName,
          phone: trimmedPhone,
          school: trimmedSchool
        },
        schoolMatched: true,
        schoolHelperText: getSchoolHelperText(trimmedSchool)
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
