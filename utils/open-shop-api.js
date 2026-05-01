const { authRequest } = require("./mini-auth");

function fetchCurrentShopApply() {
  return authRequest({
    url: "/shop/apply/mini/current",
    method: "GET"
  });
}

function submitShopApply(payload) {
  return authRequest({
    url: "/shop/apply/mini/submit",
    method: "POST",
    data: payload
  });
}

function fetchCurrentMerchantStore() {
  return authRequest({
    url: "/mini/merchant/store/current",
    method: "GET"
  });
}

function updateCurrentMerchantStore(payload) {
  return authRequest({
    url: "/mini/merchant/store/current",
    method: "PUT",
    data: payload
  });
}

function fetchCurrentMerchantOrderBoard() {
  return authRequest({
    url: "/mini/merchant/order/board",
    method: "GET"
  });
}

module.exports = {
  fetchCurrentShopApply,
  submitShopApply,
  fetchCurrentMerchantStore,
  fetchCurrentMerchantOrderBoard,
  updateCurrentMerchantStore
};
