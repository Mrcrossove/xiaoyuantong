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

module.exports = {
  fetchStoreList,
  fetchStoreDetail
};
