const { authRequest } = require("./mini-auth");

function fetchOrderList(params) {
  return authRequest({
    url: "/mini/order/list",
    method: "GET",
    data: params
  });
}

function fetchOrderDetail(id) {
  return authRequest({
    url: `/mini/order/detail/${id}`,
    method: "GET"
  });
}

function createOrder(payload) {
  return authRequest({
    url: "/mini/order",
    method: "POST",
    data: payload
  });
}

function payOrder(id) {
  return authRequest({
    url: `/mini/order/${id}/pay`,
    method: "POST"
  });
}

function createOrderPay(id) {
  return authRequest({
    url: `/mini/pay/order/${id}/create`,
    method: "POST"
  });
}

function confirmOrderPay(id) {
  return authRequest({
    url: `/mini/pay/order/${id}/confirm`,
    method: "POST"
  });
}

function cancelOrder(id) {
  return authRequest({
    url: `/mini/order/${id}/cancel`,
    method: "POST"
  });
}

function finishOrder(id) {
  return authRequest({
    url: `/mini/order/${id}/finish`,
    method: "POST"
  });
}

function applyOrderRefund(id, payload) {
  return authRequest({
    url: `/mini/order/${id}/refund`,
    method: "POST",
    data: payload
  });
}

module.exports = {
  fetchOrderList,
  fetchOrderDetail,
  createOrder,
  createOrderPay,
  confirmOrderPay,
  payOrder,
  cancelOrder,
  finishOrder,
  applyOrderRefund
};
