const { request } = require("./api");
const { buildAuthHeader, getToken, authRequest } = require("./mini-auth");

function fetchFavoriteList(params) {
  return authRequest({
    url: "/mini/favorite/list",
    method: "GET",
    data: params
  });
}

function fetchFavoriteStatus(params) {
  return request({
    url: "/mini/favorite/status",
    method: "GET",
    data: params,
    header: buildAuthHeader(getToken())
  });
}

function toggleFavorite(payload) {
  return authRequest({
    url: "/mini/favorite/toggle",
    method: "POST",
    data: payload
  });
}

module.exports = {
  fetchFavoriteList,
  fetchFavoriteStatus,
  toggleFavorite
};
