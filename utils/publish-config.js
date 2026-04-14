const publishTypeMap = {
  "tree-hole": {
    label: "情感树洞",
    submitText: "发布",
    categories: ["情感倾诉", "匿名表白", "求助咨询", "避雷提醒", "校园八卦", "学业吐槽", "日常碎碎念", "好物安利", "其他类型"]
  },
  "rent-house": {
    label: "房屋租售",
    submitText: "发布",
    categories: ["求租信息", "发布房源", "其他房屋租售"]
  },
  "job-post": {
    label: "兼职发布",
    submitText: "发布",
    categories: ["校内岗位", "实习岗位", "兼职招聘", "求职咨询", "家教辅导", "其他兼职"]
  },
  partner: {
    label: "找搭子",
    submitText: "发布",
    categories: ["旅游搭子", "学习搭子", "赛事搭子", "运动搭子", "美食搭子", "游戏搭子", "出行搭子", "其他搭子"]
  },
  errand: {
    label: "跑腿代办",
    submitText: "发布",
    categories: ["快递代取", "外卖代取", "食堂代买", "超市代购", "校园跑腿", "其他代办"]
  },
  market: {
    label: "跳蚤市场",
    submitText: "发布",
    categories: ["图书资料", "电子数码", "生活用品", "服饰鞋帽", "美妆护肤", "运动器材", "兴趣好物", "其他闲置"]
  }
};

function getPublishType(type) {
  return publishTypeMap[type] || publishTypeMap["tree-hole"];
}

module.exports = {
  publishTypeMap,
  getPublishType
};
