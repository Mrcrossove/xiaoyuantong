const { request } = require("./api");
const { getSelectedSchool } = require("./school-state");

const TOKEN_KEY = "miniToken";
const PROFILE_KEY = "miniProfile";
const DEVICE_KEY = "miniDeviceId";

function getToken() {
  try {
    return wx.getStorageSync(TOKEN_KEY) || "";
  } catch (error) {
    return "";
  }
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

function getDeviceId() {
  try {
    const cached = wx.getStorageSync(DEVICE_KEY);
    if (cached) return cached;
  } catch (error) {}

  const deviceId = `device_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  try {
    wx.setStorageSync(DEVICE_KEY, deviceId);
  } catch (error) {}
  return deviceId;
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

async function ensureMiniSession() {
  const token = getToken();
  if (token) {
    return {
      token,
      profile: getProfile()
    };
  }

  const code = await getWechatCode();
  const session = await request({
    url: "/auth/mini/login",
    method: "POST",
    data: {
      code,
      deviceId: getDeviceId(),
      nickname: "校园用户",
      school: getSelectedSchool()
    }
  });

  return setSession(session);
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
  return request({
    ...options,
    header: {
      ...(options.header || {}),
      ...buildAuthHeader(session.token)
    }
  });
}

module.exports = {
  getToken,
  getProfile,
  ensureMiniSession,
  buildAuthHeader,
  authRequest
};
