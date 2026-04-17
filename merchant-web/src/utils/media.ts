const COVER_TEXT_MAP: Record<string, string> = {
  poster: "商品图",
  snack: "零食",
  takeout: "餐饮",
  canteen: "食堂",
  fruit: "水果",
  flower: "鲜花",
  study: "学习",
  print: "打印",
  device: "数码",
  secondhand: "二手",
  laundry: "洗护",
  game: "娱乐",
  "store-mini": "店铺",
  "store-canteen": "食堂店铺",
  "store-flower": "鲜花店铺"
};

export function isDisplayImage(value?: string) {
  if (!value) return false;
  return /^(https?:)?\/\//i.test(value) || value.startsWith("/") || value.startsWith("data:image/");
}

export function getMediaLabel(value?: string, fallback = "图片") {
  if (!value) return fallback;
  return COVER_TEXT_MAP[value] || fallback;
}
