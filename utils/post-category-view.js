const PRIMARY_CATEGORY_BY_TYPE = {
  market: "跳蚤市场",
  "job-post": "兼职信息",
  "rent-house": "房屋租售",
  "tree-hole": "树洞",
  partner: "找搭子",
  errand: "跑腿代办"
};

const THEME_BY_PRIMARY_CATEGORY = {
  跳蚤市场: "market",
  兼职信息: "job",
  房屋租售: "rent",
  树洞: "tree",
  找搭子: "partner",
  跑腿代办: "errand"
};

const SECONDARY_CATEGORY_BY_PRIMARY_CATEGORY = {
  树洞: ["情感倾诉", "匿名表白", "求助咨询", "避雷提醒", "校园八卦", "学业吐槽", "日常碎碎念", "好物安利", "其他类型"],
  房屋租售: ["求租信息", "发布房源", "其他房屋租售"],
  兼职信息: ["校内岗位", "实习岗位", "兼职招聘", "求职咨询", "家教辅导", "其他兼职"],
  找搭子: ["旅游搭子", "学习搭子", "赛事搭子", "运动搭子", "美食搭子", "游戏搭子", "出行搭子", "其他搭子"],
  跑腿代办: ["快递代取", "外卖代取", "食堂代买", "超市代购", "校园跑腿", "其他代办"],
  跳蚤市场: ["图书资料", "电子数码", "生活用品", "服饰鞋帽", "美妆护肤", "运动器材", "兴趣好物", "其他闲置"]
};

function getPrimaryCategoryByType(type) {
  return PRIMARY_CATEGORY_BY_TYPE[type] || "";
}

function inferPrimaryCategory(category) {
  const normalized = String(category || "").trim();
  if (!normalized) return "";

  for (const [primaryCategory, categories] of Object.entries(SECONDARY_CATEGORY_BY_PRIMARY_CATEGORY)) {
    if (primaryCategory === normalized || categories.includes(normalized)) {
      return primaryCategory;
    }
  }

  return "";
}

function buildPostCategoryView(post) {
  const secondaryLabel = String((post && post.category) || "").trim();
  const primaryLabel = String((post && post.primaryCategory) || "").trim() || inferPrimaryCategory(secondaryLabel) || "其他";
  const theme = THEME_BY_PRIMARY_CATEGORY[primaryLabel] || "default";

  return {
    primaryLabel,
    secondaryLabel,
    theme
  };
}

module.exports = {
  PRIMARY_CATEGORY_BY_TYPE,
  getPrimaryCategoryByType,
  inferPrimaryCategory,
  buildPostCategoryView
};
