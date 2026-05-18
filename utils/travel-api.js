const { request } = require("./api");
const { authRequest } = require("./mini-auth");

function fetchTravelRoutes(params) {
  return request({
    url: "/travel/mini/route/list",
    method: "GET",
    data: params
  });
}

function fetchTravelRouteDetail(id) {
  return request({
    url: `/travel/mini/route/${id}`,
    method: "GET"
  });
}

function fetchTravelSubscribeConfig() {
  return request({
    url: "/travel/mini/subscribe-config",
    method: "GET"
  });
}

function createTravelBooking(data) {
  return authRequest({
    url: "/travel/mini/booking",
    method: "POST",
    data
  });
}

function fetchMyTravelBookings() {
  return authRequest({
    url: "/travel/mini/booking/list",
    method: "GET"
  });
}

function cancelTravelBooking(id) {
  return authRequest({
    url: `/travel/mini/booking/${id}/cancel`,
    method: "POST"
  });
}

function createTravelPay(id) {
  return authRequest({
    url: `/travel/mini/booking/${id}/pay/create`,
    method: "POST"
  });
}

function confirmTravelPay(id) {
  return authRequest({
    url: `/travel/mini/booking/${id}/pay/confirm`,
    method: "POST"
  });
}

module.exports = {
  fetchTravelRoutes,
  fetchTravelRouteDetail,
  fetchTravelSubscribeConfig,
  createTravelBooking,
  fetchMyTravelBookings,
  cancelTravelBooking,
  createTravelPay,
  confirmTravelPay
};
