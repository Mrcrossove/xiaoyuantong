const REFERRAL_SCENE_KEY = "merchantReferralScene";

function normalizeReferralScene(value) {
  const scene = decodeURIComponent(String(value || "").trim());
  return /^m_\d+$/.test(scene) ? scene : "";
}

function saveReferralScene(scene) {
  const normalized = normalizeReferralScene(scene);
  if (!normalized) return "";

  try {
    wx.setStorageSync(REFERRAL_SCENE_KEY, normalized);
  } catch (error) {}
  return normalized;
}

function getReferralScene() {
  try {
    return normalizeReferralScene(wx.getStorageSync(REFERRAL_SCENE_KEY) || "");
  } catch (error) {
    return "";
  }
}

function clearReferralScene() {
  try {
    wx.removeStorageSync(REFERRAL_SCENE_KEY);
  } catch (error) {}
}

function captureReferralSceneFromOptions(options = {}) {
  const directScene = options.scene;
  if (directScene) {
    return saveReferralScene(directScene);
  }

  const query = options.query || {};
  if (query.scene) {
    return saveReferralScene(query.scene);
  }

  if (query.referralScene) {
    return saveReferralScene(query.referralScene);
  }

  return "";
}

module.exports = {
  captureReferralSceneFromOptions,
  clearReferralScene,
  getReferralScene,
  normalizeReferralScene,
  saveReferralScene
};
