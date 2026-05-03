const schools = require("./school-options");

const STORAGE_KEY = "selectedSchool";
const STORE_FRONT_STORAGE_KEY = "storefrontSchool";
const FALLBACK_SCHOOL = "\u516d\u76d8\u6c34\u5e08\u8303\u5b66\u9662";
const DEFAULT_SCHOOL = schools.includes(FALLBACK_SCHOOL) ? FALLBACK_SCHOOL : schools[0];

function getSelectedSchool() {
  try {
    const stored = wx.getStorageSync(STORAGE_KEY);
    if (stored && schools.includes(stored)) {
      return stored;
    }
  } catch (error) {}
  return DEFAULT_SCHOOL;
}

function setSelectedSchool(school) {
  const selectedSchool = schools.includes(school) ? school : DEFAULT_SCHOOL;
  try {
    wx.setStorageSync(STORAGE_KEY, selectedSchool);
  } catch (error) {}

  const app = typeof getApp === "function" ? getApp() : null;
  if (app && app.globalData) {
    app.globalData.selectedSchool = selectedSchool;
  }

  return selectedSchool;
}

function getStorefrontSchool() {
  try {
    const stored = wx.getStorageSync(STORE_FRONT_STORAGE_KEY);
    if (stored && schools.includes(stored)) {
      return stored;
    }
  } catch (error) {}
  return getSelectedSchool();
}

function setStorefrontSchool(school) {
  const selectedSchool = schools.includes(school) ? school : getSelectedSchool();
  try {
    wx.setStorageSync(STORE_FRONT_STORAGE_KEY, selectedSchool);
  } catch (error) {}
  return selectedSchool;
}

module.exports = {
  DEFAULT_SCHOOL,
  getSelectedSchool,
  setSelectedSchool,
  getStorefrontSchool,
  setStorefrontSchool
};
