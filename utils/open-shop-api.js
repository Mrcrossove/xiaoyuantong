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

function createMerchantProduct(payload) {
  return authRequest({
    url: "/mini/merchant/product",
    method: "POST",
    data: payload
  });
}

function updateMerchantProduct(id, payload) {
  return authRequest({
    url: `/mini/merchant/product/${id}`,
    method: "PUT",
    data: payload
  });
}

function moveMerchantProduct(id, direction) {
  return authRequest({
    url: `/mini/merchant/product/${id}/move`,
    method: "POST",
    data: { direction }
  });
}

function batchDownMerchantProducts(ids) {
  return authRequest({
    url: "/mini/merchant/product/batch-down",
    method: "POST",
    data: { ids }
  });
}

function batchDeleteMerchantProducts(ids) {
  return authRequest({
    url: "/mini/merchant/product/batch-delete",
    method: "POST",
    data: { ids }
  });
}

function toggleMerchantProductStatus(id) {
  return authRequest({
    url: `/mini/merchant/product/${id}/status`,
    method: "POST"
  });
}

function deleteMerchantProduct(id) {
  return authRequest({
    url: `/mini/merchant/product/${id}`,
    method: "DELETE"
  });
}

module.exports = {
  fetchCurrentShopApply,
  submitShopApply,
  fetchCurrentMerchantStore,
  fetchCurrentMerchantOrderBoard,
  updateCurrentMerchantStore,
  createMerchantProduct,
  updateMerchantProduct,
  moveMerchantProduct,
  batchDownMerchantProducts,
  batchDeleteMerchantProducts,
  toggleMerchantProductStatus,
  deleteMerchantProduct
};
