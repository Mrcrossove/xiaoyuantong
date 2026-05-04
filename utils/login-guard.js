const { getToken } = require("./mini-auth");

function redirectToLoginIfNeeded() {
  if (getToken()) {
    return false;
  }

  const pages = getCurrentPages();
  const current = pages.length ? `/${pages[pages.length - 1].route}` : "";
  if (current === "/pages/login/login") {
    return false;
  }

  wx.reLaunch({
    url: "/pages/login/login"
  });
  return true;
}

module.exports = {
  redirectToLoginIfNeeded
};
