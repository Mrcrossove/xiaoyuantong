const schools = require("./school-options");

const STORAGE_KEY = "homeFeedScope";
const HOME_FEED_ALL = "__all__";

function getScopeValue(value) {
  if (value && typeof value === "object") {
    return value.value || "";
  }
  return value;
}

function isManualAllScope(value) {
  return Boolean(value && typeof value === "object" && value.value === HOME_FEED_ALL && value.manual === true);
}

function normalizeScope(value, fallbackSchool, options = {}) {
  const fallback = schools.includes(fallbackSchool) ? fallbackSchool : schools[0];
  const verifiedSchool = schools.includes(options.verifiedSchool) ? options.verifiedSchool : "";
  const scopeValue = getScopeValue(value);

  if (scopeValue === HOME_FEED_ALL && (!verifiedSchool || isManualAllScope(value))) {
    return {
      mode: "all",
      school: "",
      label: "全网"
    };
  }

  if (scopeValue && schools.includes(scopeValue)) {
    return {
      mode: "school",
      school: scopeValue,
      label: scopeValue
    };
  }

  if (verifiedSchool) {
    return {
      mode: "school",
      school: verifiedSchool,
      label: verifiedSchool
    };
  }

  return {
    mode: "all",
    school: "",
    label: "全网"
  };
}

function getHomeFeedScope(fallbackSchool, options = {}) {
  try {
    return normalizeScope(wx.getStorageSync(STORAGE_KEY), fallbackSchool, options);
  } catch (error) {
    return normalizeScope("", fallbackSchool, options);
  }
}

function setHomeFeedScope(value, fallbackSchool, options = {}) {
  const normalized = normalizeScope(value, fallbackSchool, {
    ...options,
    verifiedSchool: ""
  });
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
