async function requestSubscribeMessage(tmplIds) {
  const ids = (tmplIds || []).filter(Boolean);
  if (!ids.length || !wx.requestSubscribeMessage) {
    return { skipped: true };
  }

  try {
    return await new Promise((resolve) => {
      wx.requestSubscribeMessage({
        tmplIds: ids,
        success: resolve,
        fail: resolve
      });
    });
  } catch (error) {
    return { skipped: true, error };
  }
}

module.exports = {
  requestSubscribeMessage
};
