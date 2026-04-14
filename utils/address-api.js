const { authRequest } = require("./mini-auth");

function fetchAddressList() {
  return authRequest({
    url: "/mini/address/list",
    method: "GET"
  });
}

function createAddress(payload) {
  return authRequest({
    url: "/mini/address",
    method: "POST",
    data: payload
  });
}

function updateAddress(id, payload) {
  return authRequest({
    url: `/mini/address/${id}`,
    method: "PUT",
    data: payload
  });
}

function deleteAddress(id) {
  return authRequest({
    url: `/mini/address/${id}`,
    method: "DELETE"
  });
}

function setDefaultAddress(id) {
  return authRequest({
    url: `/mini/address/${id}/default`,
    method: "POST"
  });
}

module.exports = {
  fetchAddressList,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};
