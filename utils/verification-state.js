const { getSelectedSchool } = require("./school-state");

const STORAGE_KEY = "campusVerification";

function getDefaultVerification() {
  return {
    verified: false,
    statusText: "未认证",
    name: "",
    phone: "",
    school: getSelectedSchool(),
    reviewNote: "",
    reviewedAt: "",
    verifiedAt: ""
  };
}

function getVerificationInfo() {
  try {
    const stored = wx.getStorageSync(STORAGE_KEY);
    if (stored && typeof stored === "object") {
      return {
        ...getDefaultVerification(),
        ...stored
      };
    }
  } catch (error) {}

  return getDefaultVerification();
}

function setVerificationInfo(payload) {
  const nextValue = {
    ...getDefaultVerification(),
    ...payload
  };

  try {
    wx.setStorageSync(STORAGE_KEY, nextValue);
  } catch (error) {}

  return nextValue;
}

function clearVerificationInfo() {
  try {
    wx.removeStorageSync(STORAGE_KEY);
  } catch (error) {}

  return getDefaultVerification();
}

function getVerifiedSchool() {
  const info = getVerificationInfo();
  return info && info.verified && info.school ? info.school : "";
}

function getCampusSchool() {
  return getVerifiedSchool() || getSelectedSchool();
}

module.exports = {
  getVerificationInfo,
  setVerificationInfo,
  clearVerificationInfo,
  getVerifiedSchool,
  getCampusSchool
};
