const { request } = require("./api");

function fetchStoreList(params) {
  return request({
    url: "/mini/store/list",
    method: "GET",
    data: params
  });
}

function fetchStoreDetail(detailId) {
  return request({
    url: `/mini/store/detail/${detailId}`,
    method: "GET"
  });
}

function resolveStoreReferralScene(scene) {
  return request({
    url: "/mini/store/referral/resolve",
    method: "GET",
    data: {
      scene
    }
  });
}

module.exports = {
  fetchStoreList,
  fetchStoreDetail,
  resolveStoreReferralScene
};
