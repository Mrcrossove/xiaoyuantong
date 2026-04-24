const { request } = require("./api");

function fetchHomeBanners(school) {
  return request({
    url: "/mini/operation/banner/list",
    method: "GET",
    data: {
      school
    }
  });
}

module.exports = {
  fetchHomeBanners
};
