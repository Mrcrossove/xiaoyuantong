const BASE_URL = "http://118.24.104.69:3001";

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

        reject(new Error(payload.message || `请求失败：${res.statusCode}`));
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
