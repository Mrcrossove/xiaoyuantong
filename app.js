const { getSelectedSchool } = require("./utils/school-state");
const { captureReferralSceneFromOptions } = require("./utils/referral-scene");

App({
  globalData: {
    appName: "校院通",
    selectedSchool: getSelectedSchool()
  },

  onLaunch(options) {
    captureReferralSceneFromOptions(options);
    // Allow anonymous browsing. Login is requested only before protected actions.
  },

  onShow(options) {
    captureReferralSceneFromOptions(options);
  }
});
