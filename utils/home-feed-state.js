const schools = require("./school-options");

const STORAGE_KEY = "homeFeedScope";
const HOME_FEED_ALL = "__all__";

function getScopeValue(value) {
  if (value && typeof value === "object") {
    return value.value || "";
  }
  return value;
}

function normalizeScope(value) {
  const scopeValue = getScopeValue(value);

  if (scopeValue === HOME_FEED_ALL) {
    return {
      mode: "all",
      school: "",
      label: "\u5168\u7f51"
    };
  }

  if (scopeValue && schools.includes(scopeValue)) {
    return {
      mode: "school",
      school: scopeValue,
      label: scopeValue
    };
  }

  return {
    mode: "all",
    school: "",
    label: "\u5168\u7f51"
  };
}

function getHomeFeedScope() {
  try {
    return normalizeScope(wx.getStorageSync(STORAGE_KEY));
  } catch (error) {
    return normalizeScope("");
  }
}

function setHomeFeedScope(value, fallbackSchool, options = {}) {
  const normalized = normalizeScope(value);
  const storedValue =
    normalized.mode === "all"
      ? {
          value: HOME_FEED_ALL,
          manual: options.manual === true
        }
      : normalized.school;

  try {
    wx.setStorageSync(STORAGE_KEY, storedValue);
  } catch (error) {}

  return normalized;
}

module.exports = {
  HOME_FEED_ALL,
  getHomeFeedScope,
  setHomeFeedScope
};
