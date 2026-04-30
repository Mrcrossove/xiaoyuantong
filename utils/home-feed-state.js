const schools = require("./school-options");

const STORAGE_KEY = "homeFeedScope";
const HOME_FEED_ALL = "__all__";

function normalizeScope(value, fallbackSchool) {
  const fallback = schools.includes(fallbackSchool) ? fallbackSchool : schools[0];
  if (value === HOME_FEED_ALL) {
    return {
      mode: "all",
      school: "",
      label: "全网"
    };
  }

  if (value && schools.includes(value)) {
    return {
      mode: "school",
      school: value,
      label: value
    };
  }

  return {
    mode: "school",
    school: fallback,
    label: fallback
  };
}

function getHomeFeedScope(fallbackSchool) {
  try {
    return normalizeScope(wx.getStorageSync(STORAGE_KEY), fallbackSchool);
  } catch (error) {
    return normalizeScope("", fallbackSchool);
  }
}

function setHomeFeedScope(value, fallbackSchool) {
  const normalized = normalizeScope(value, fallbackSchool);
  const storedValue = normalized.mode === "all" ? HOME_FEED_ALL : normalized.school;

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
