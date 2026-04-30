const DEFAULT_AVATAR_COUNT = 8;

function getDefaultAvatarClass(avatarUrl) {
  const matched = String(avatarUrl || "").match(/^default-avatar-(\d+)$/);
  const index = matched ? Number(matched[1]) : 1;
  const safeIndex = Math.min(Math.max(index || 1, 1), DEFAULT_AVATAR_COUNT);
  return `default-avatar-${safeIndex}`;
}

function isDefaultAvatar(avatarUrl) {
  return /^default-avatar-\d+$/.test(String(avatarUrl || ""));
}

function buildAvatarView(avatarUrl) {
  const normalizedAvatarUrl = avatarUrl || "default-avatar-1";
  return {
    avatarUrl: normalizedAvatarUrl,
    isDefaultAvatar: isDefaultAvatar(normalizedAvatarUrl),
    defaultAvatarClass: getDefaultAvatarClass(normalizedAvatarUrl)
  };
}

module.exports = {
  buildAvatarView,
  getDefaultAvatarClass,
  isDefaultAvatar
};
