const { authRequest } = require("./mini-auth");

function fetchCurrentVerification() {
  return authRequest({
    url: "/verify/mini/current",
    method: "GET"
  });
}

function submitVerification(payload) {
  return authRequest({
    url: "/verify/mini/submit",
    method: "POST",
    data: payload
  });
}

module.exports = {
  fetchCurrentVerification,
  submitVerification
};
