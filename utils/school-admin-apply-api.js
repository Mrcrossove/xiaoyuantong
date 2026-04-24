const { authRequest } = require("./mini-auth");

function fetchCurrentSchoolAdminApply() {
  return authRequest({
    url: "/school-admin/apply/mini/current",
    method: "GET"
  });
}

function submitSchoolAdminApply(payload) {
  return authRequest({
    url: "/school-admin/apply/mini/submit",
    method: "POST",
    data: payload
  });
}

module.exports = {
  fetchCurrentSchoolAdminApply,
  submitSchoolAdminApply
};
