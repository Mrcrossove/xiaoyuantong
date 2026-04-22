const { getApiBaseUrl } = require("./runtime-config");

const BASE_URL = getApiBaseUrl();

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || "GET",
      data: options.data,
      header: options.header || {},
      timeout: options.timeout || 8000,
      success(res) {
        const payload = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300 && payload.code === 0) {
          resolve(payload.data);
          return;
        }

        const error = new Error(payload.message || `请求失败：${res.statusCode}`);
        error.statusCode = res.statusCode;
        error.code = payload.code;
        reject(error);
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

module.exports = {
  BASE_URL,
  request
};
