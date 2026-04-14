const { authRequest } = require("./mini-auth");

function fetchFavoriteList(params) {
  return authRequest({
    url: "/mini/favorite/list",
    method: "GET",
    data: params
  });
}

function fetchFavoriteStatus(params) {
  return authRequest({
    url: "/mini/favorite/status",
    method: "GET",
    data: params
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
