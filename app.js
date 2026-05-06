const { getSelectedSchool } = require("./utils/school-state");

App({
  globalData: {
    appName: "校园通",
    selectedSchool: getSelectedSchool()
  },

  onLaunch() {
    // Allow anonymous browsing. Login is requested only before protected actions.
  }
});
