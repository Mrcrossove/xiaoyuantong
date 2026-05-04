const { getToken } = require("./mini-auth");
const { getSelectedSchool } = require("./school-state");
const { fetchMessageUnreadSummary } = require("./messages-api");

function calcUnreadTotal(summary) {
  return Number((summary && summary.system) || 0) + Number((summary && summary.interactive) || 0);
}

function formatBadgeCount(count) {
  const value = Number(count || 0);
  if (value <= 0) {
    return "";
  }
  return value > 99 ? "99+" : String(value);
}

async function refreshMessageBadge(page, options = {}) {
  if (!page || typeof page.setData !== "function") {
    return 0;
  }

  if (!getToken()) {
    page.setData({
      messageBadgeCount: 0,
      messageBadgeText: ""
    });
    return 0;
  }

  try {
    const summary = await fetchMessageUnreadSummary({
      school: options.school || getSelectedSchool()
    });
    const total = calcUnreadTotal(summary);
    page.setData({
      messageBadgeCount: total,
      messageBadgeText: formatBadgeCount(total)
    });
    return total;
  } catch (error) {
    return Number(page.data && page.data.messageBadgeCount) || 0;
  }
}

module.exports = {
  calcUnreadTotal,
  formatBadgeCount,
  refreshMessageBadge
};
