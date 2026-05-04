const { getSelectedSchool } = require("./utils/school-state");
const { getToken } = require("./utils/mini-auth");

App({
  globalData: {
    appName: "校园通",
    selectedSchool: getSelectedSchool()
  },

  onLaunch() {
    if (getToken()) {
      return;
    }

    wx.reLaunch({
      url: "/pages/login/login"
    });
  }
});
