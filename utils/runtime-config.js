const DEFAULT_API_BASE_BY_ENV = {
  develop: "http://118.24.104.69:3001",
  trial: "http://118.24.104.69:3001",
  release: "http://118.24.104.69:3001"
};

const API_BASE_OVERRIDE_KEY = "apiBaseUrlOverride";

function getEnvVersion() {
  try {
    if (wx.getAccountInfoSync) {
      const info = wx.getAccountInfoSync();
      return info.miniProgram.envVersion || "release";
    }
  } catch (error) {}

  return "__devtools__";
}

function getApiBaseUrl() {
  try {
    if (wx.getExtConfigSync) {
      const extConfig = wx.getExtConfigSync();
      if (extConfig && extConfig.apiBaseUrl) {
        return String(extConfig.apiBaseUrl).replace(/\/$/, "");
      }
    }
  } catch (error) {}

  try {
    const app = getApp();
    const globalBaseUrl = app && app.globalData ? app.globalData.apiBaseUrl : "";
    if (globalBaseUrl) {
      return String(globalBaseUrl).replace(/\/$/, "");
    }
  } catch (error) {}

  try {
    const override = wx.getStorageSync(API_BASE_OVERRIDE_KEY);
    if (override) {
      return String(override).replace(/\/$/, "");
    }
  } catch (error) {}

  const envVersion = getEnvVersion();
  const baseUrl = DEFAULT_API_BASE_BY_ENV[envVersion] || DEFAULT_API_BASE_BY_ENV.release;
  return String(baseUrl || "").replace(/\/$/, "");
}

module.exports = {
  API_BASE_OVERRIDE_KEY,
  getApiBaseUrl
};
