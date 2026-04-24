const { request } = require("./api");

const TOKEN_KEY = "miniToken";
const PROFILE_KEY = "miniProfile";

function getToken() {
  try {
    return wx.getStorageSync(TOKEN_KEY) || "";
  } catch (error) {
    return "";
  }
}

function clearSession() {
  try {
    wx.removeStorageSync(TOKEN_KEY);
    wx.removeStorageSync(PROFILE_KEY);
  } catch (error) {}
}

function setSession(payload) {
  try {
    wx.setStorageSync(TOKEN_KEY, payload.token || "");
    wx.setStorageSync(PROFILE_KEY, payload.profile || {});
  } catch (error) {}
  return payload;
}

function getProfile() {
  try {
    return wx.getStorageSync(PROFILE_KEY) || {};
  } catch (error) {
    return {};
  }
}

function isDevtoolsEnv() {
  try {
    const info = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null;
    return Boolean(info && info.miniProgram && info.miniProgram.envVersion === "develop");
  } catch (error) {
    return false;
  }
}

function getWechatCode() {
  return new Promise((resolve) => {
    if (!wx.login) {
      resolve("");
      return;
    }

    wx.login({
      success(res) {
        resolve((res && res.code) || "");
      },
      fail() {
        resolve("");
      }
    });
  });
}

async function loginWithPayload(data) {
  const session = await request({
    url: "/auth/mini/login",
    method: "POST",
    data
  });

  return setSession(session);
}

async function ensureMiniSession(options = {}) {
  const { forceFreshAccount = false } = options;
  const token = getToken();

  if (token && !forceFreshAccount) {
    return {
      token,
      profile: getProfile()
    };
  }

  if (forceFreshAccount) {
    clearSession();
  }

  const code = await getWechatCode();
  return loginWithPayload({
    code
  });
}

function buildAuthHeader(token) {
  return token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};
}

async function authRequest(options) {
  const session = await ensureMiniSession();

  try {
    return await request({
      ...options,
      header: {
        ...(options.header || {}),
        ...buildAuthHeader(session.token)
      }
    });
  } catch (error) {
    if (error && error.statusCode === 401) {
      clearSession();
      const nextSession = await ensureMiniSession();
      return request({
        ...options,
        header: {
          ...(options.header || {}),
          ...buildAuthHeader(nextSession.token)
        }
      });
    }

    throw error;
  }
}

module.exports = {
  getToken,
  getProfile,
  isDevtoolsEnv,
  ensureMiniSession,
  clearSession,
  buildAuthHeader,
  authRequest
};
