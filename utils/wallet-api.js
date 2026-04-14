const { authRequest } = require("./mini-auth");

function fetchWalletSummary() {
  return authRequest({
    url: "/mini/wallet/summary",
    method: "GET"
  });
}

function createWithdraw(payload) {
  return authRequest({
    url: "/mini/wallet/withdraw",
    method: "POST",
    data: payload
  });
}

module.exports = {
  fetchWalletSummary,
  createWithdraw
};
