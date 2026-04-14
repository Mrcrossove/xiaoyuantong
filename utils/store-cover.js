const GROUP_COVER_MAP = {
  student: "store-mini",
  dorm: "store-mini",
  campus: "store-canteen",
  offCampus: "store-flower"
};

const SECTION_COVER_MAP = {
  study: "study",
  secondhand: "secondhand",
  errand: "takeout",
  life: "laundry",
  entertainment: "game",
  food: "takeout",
  snacks: "snack",
  daily: "laundry",
  fruit: "fruit",
  canteen: "canteen",
  service: "print",
  sports: "game",
  restaurant: "canteen",
  flower: "flower",
  market: "fruit"
};

function isRemoteImage(value) {
  const text = String(value || "").trim();
  return /^https?:\/\//.test(text);
}

function pickStoreFallback(item) {
  return (
    String(item.cover || "").trim() ||
    SECTION_COVER_MAP[item.sectionKey] ||
    GROUP_COVER_MAP[item.groupKey] ||
    "store-mini"
  );
}

function pickGoodsFallback(item, storeCover) {
  return String(item.cover || "").trim() || String(storeCover || "").trim() || "poster";
}

function toBannerItem(value) {
  return {
    value,
    mode: isRemoteImage(value) ? "image" : "class"
  };
}

function normalizeStoreList(list) {
  return (list || []).map((item) => {
    const cover = pickStoreFallback(item);
    return {
      ...item,
      cover,
      coverMode: isRemoteImage(cover) ? "image" : "class"
    };
  });
}

function normalizeStoreDetail(detail) {
  if (!detail) return detail;

  const cover = pickStoreFallback(detail);
  const rawBanners = (detail.banners || []).filter(Boolean);
  const banners = (rawBanners.length ? rawBanners : [cover]).map(toBannerItem);

  const products = (detail.products || []).map((item) => {
    const productCover = pickGoodsFallback(item, cover);
    return {
      ...item,
      cover: productCover,
      coverMode: isRemoteImage(productCover) ? "image" : "class"
    };
  });

  return {
    ...detail,
    cover,
    coverMode: isRemoteImage(cover) ? "image" : "class",
    banners,
    products
  };
}

module.exports = {
  isRemoteImage,
  normalizeStoreList,
  normalizeStoreDetail
};
