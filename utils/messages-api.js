const { authRequest } = require("./mini-auth");

function fetchMessageList(params) {
  return authRequest({
    url: "/mini/message/list",
    method: "GET",
    data: params
  });
}

function fetchMessageUnreadSummary(params) {
  return authRequest({
    url: "/mini/message/unread-summary",
    method: "GET",
    data: params
  });
}

function markMessageRead(id) {
  return authRequest({
    url: `/mini/message/${id}/read`,
    method: "POST"
  });
}

function markAllMessagesRead(payload, params) {
  const school = params && params.school ? `?school=${encodeURIComponent(params.school)}` : "";
  return authRequest({
    url: `/mini/message/read-all${school}`,
    method: "POST",
    data: payload
  });
}

module.exports = {
  fetchMessageList,
  fetchMessageUnreadSummary,
  markMessageRead,
  markAllMessagesRead
};
