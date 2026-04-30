const schools = require("./school-options");
const GUIZHOU_PROVINCE = "\u8d35\u5dde\u7701";

const PROVINCE_STARTERS = [
  ["北京市", "北京大学"],
  ["天津市", "天津科技大学"],
  ["河北省", "河北工程大学"],
  ["山西省", "山西大学"],
  ["内蒙古自治区", "内蒙古大学"],
  ["辽宁省", "辽宁大学"],
  ["吉林省", "吉林大学"],
  ["黑龙江省", "黑龙江大学"],
  ["上海市", "复旦大学"],
  ["江苏省", "东南大学"],
  ["浙江省", "浙江大学"],
  ["安徽省", "安徽大学"],
  ["福建省", "福州大学"],
  ["江西省", "南昌大学"],
  ["山东省", "山东大学"],
  ["河南省", "郑州大学"],
  ["湖北省", "武汉大学"],
  ["湖南省", "湘潭大学"],
  ["广东省", "汕头大学"],
  ["广西壮族自治区", "广西大学"],
  ["海南省", "海南大学"],
  ["重庆市", "重庆大学"],
  ["四川省", "四川大学"],
  ["贵州省", "贵州大学"],
  ["云南省", "昆明理工大学"],
  ["西藏自治区", "西藏大学"],
  ["陕西省", "西安交通大学"],
  ["甘肃省", "兰州大学"],
  ["青海省", "青海师范大学"],
  ["宁夏回族自治区", "宁夏大学"],
  ["新疆维吾尔自治区", "新疆大学"]
];

const starterMap = new Map(PROVINCE_STARTERS.map(([province, school]) => [school, province]));
const groupedMap = new Map();
const schoolProvinceMap = {};
let currentProvince = "其他";

schools.forEach((school) => {
  if (starterMap.has(school)) {
    currentProvince = starterMap.get(school);
  }

  schoolProvinceMap[school] = currentProvince;
  if (!groupedMap.has(currentProvince)) {
    groupedMap.set(currentProvince, []);
  }
  groupedMap.get(currentProvince).push(school);
});

const provinceSchoolGroups = Array.from(groupedMap.entries())
  .map(([province, items]) => ({
    province,
    schools: items.slice()
  }))
  .sort((left, right) => {
    if (left.province === GUIZHOU_PROVINCE) return -1;
    if (right.province === GUIZHOU_PROVINCE) return 1;
    return left.province.localeCompare(right.province, "zh-CN");
  });

function cloneGroups(groups) {
  return groups.map((group) => ({
    province: group.province,
    schools: group.schools.slice()
  }));
}

function getProvinceSchoolGroups() {
  return cloneGroups(provinceSchoolGroups);
}

function normalizeKeyword(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function isSubsequenceMatch(text, keyword) {
  if (!keyword) {
    return true;
  }

  let keywordIndex = 0;
  for (const char of text) {
    if (char === keyword[keywordIndex]) {
      keywordIndex += 1;
      if (keywordIndex >= keyword.length) {
        return true;
      }
    }
  }

  return false;
}

function getSchoolSearchText(school) {
  const aliases = [];

  if (school.includes("财经大学")) aliases.push("财大");
  if (school.includes("师范大学")) aliases.push("师大");
  if (school.includes("师范学院")) aliases.push("师院");
  if (school.includes("医科大学")) aliases.push("医大");
  if (school.includes("中医药大学")) aliases.push("中医大");
  if (school.includes("理工大学")) aliases.push("理工大");
  if (school.includes("工业大学")) aliases.push("工大");
  if (school.includes("农业大学")) aliases.push("农大");
  if (school.includes("民族大学")) aliases.push("民大");
  if (school.includes("交通大学")) aliases.push("交大");
  if (school.includes("外国语大学")) aliases.push("外大");
  if (school.includes("商学院")) aliases.push("商院");

  return normalizeKeyword([school, ...aliases].join(" "));
}

function isSchoolMatched(school, keyword) {
  const normalizedSchool = normalizeKeyword(school);
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) {
    return true;
  }

  return (
    normalizedSchool.includes(normalizedKeyword) ||
    getSchoolSearchText(school).includes(normalizedKeyword) ||
    isSubsequenceMatch(normalizedSchool, normalizedKeyword)
  );
}

function filterProvinceSchoolGroups(keyword) {
  const trimmed = String(keyword || "").trim();
  if (!trimmed) {
    return getProvinceSchoolGroups();
  }

  return provinceSchoolGroups
    .map((group) => ({
      province: group.province,
      schools: group.schools.filter((school) => isSchoolMatched(school, trimmed))
    }))
    .filter((group) => group.schools.length > 0);
}

module.exports = {
  schoolProvinceMap,
  getProvinceSchoolGroups,
  filterProvinceSchoolGroups,
  isSchoolMatched
};
