const { getSelectedSchool } = require("./utils/school-state");

App({
  globalData: {
    appName: "校园通",
    selectedSchool: getSelectedSchool()
  }
});
