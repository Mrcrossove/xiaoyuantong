const { authRequest } = require("./mini-auth");

function fetchMiniProfile() {
  return authRequest({
    url: "/auth/mini/profile",
    method: "GET"
  });
}

function updateMiniProfile(payload) {
  return authRequest({
    url: "/auth/mini/profile",
    method: "PUT",
    data: payload
  });
}

module.exports = {
  fetchMiniProfile,
  updateMiniProfile
};
