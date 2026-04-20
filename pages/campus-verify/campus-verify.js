const { getSelectedSchool } = require("../../utils/school-state");
const { getVerificationInfo, setVerificationInfo } = require("../../utils/verification-state");
const { ensureMiniSession } = require("../../utils/mini-auth");
const { fetchCurrentVerification, submitVerification } = require("../../utils/verification-api");

Page({
  data: {
    statusBarHeight: 20,
    loading: true,
    submitting: false,
    verification: {
      verified: false,
      statusText: "鏈璇?"
    },
    form: {
      name: "",
      phone: "",
      school: ""
    }
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
      verification: verificationInfo
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
        }
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
    this.setData({
      "form.school": event.detail.value
    });
  },

  async submitVerify() {
    const { name, phone, school } = this.data.form;
    const trimmedName = String(name || "").trim();
    const trimmedPhone = String(phone || "").trim();
    const trimmedSchool = String(school || "").trim();

    if (!trimmedName) {
      wx.showToast({
        title: "璇疯緭鍏ュ鍚?",
        icon: "none"
      });
      return;
    }

    if (!/^1\d{10}$/.test(trimmedPhone)) {
      wx.showToast({
        title: "璇疯緭鍏ユ纭殑鎵嬫満鍙?",
        icon: "none"
      });
      return;
    }

    if (!trimmedSchool) {
      wx.showToast({
        title: "璇疯緭鍏ュ鏍?",
        icon: "none"
      });
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

      this.setData({
        verification: nextInfo,
        form: {
          name: trimmedName,
          phone: trimmedPhone,
          school: trimmedSchool
        }
      });

      wx.showToast({
        title: "璁よ瘉鎴愬姛",
        icon: "success"
      });
    } catch (error) {
      wx.showToast({
        title: error && error.message ? error.message : "璁よ瘉鎻愪氦澶辫触",
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
