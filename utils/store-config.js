const shopCategories = [
  { key: "student", label: "学生商家", icon: "student" },
  { key: "dorm", label: "宿舍超市", icon: "dorm" },
  { key: "campus", label: "校内商家", icon: "campus" },
  { key: "offCampus", label: "校外商家", icon: "offCampus" }
];

const storeGroupTitleMap = {
  student: "学生商家",
  dorm: "宿舍超市",
  campus: "校内商家",
  offCampus: "校外商家"
};

function getStoreGroupTitle(groupKey) {
  return storeGroupTitleMap[groupKey] || "创业店铺";
}

module.exports = {
  shopCategories,
  storeGroupTitleMap,
  getStoreGroupTitle
};
