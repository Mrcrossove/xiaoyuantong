const { getToken } = require("./mini-auth");

function openLoginPage() {
  const pages = getCurrentPages();
  const current = pages.length ? `/${pages[pages.length - 1].route}` : "";
  if (current === "/pages/login/login") {
    return false;
  }

  wx.navigateTo({
    url: "/pages/login/login"
  });
  return true;
}

function requireLogin(options = {}) {
  if (getToken()) {
    return Promise.resolve(true);
  }

  const title = options.title || "需要登录";
  const content = options.content || "该操作需要微信授权登录，登录后即可继续。";
  const confirmText = options.confirmText || "去登录";

  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmText,
      cancelText: "稍后再说",
      success(res) {
        if (res.confirm) {
          openLoginPage();
        }
        resolve(false);
      },
      fail() {
        resolve(false);
      }
    });
  });
}

module.exports = {
  openLoginPage,
  requireLogin
};
