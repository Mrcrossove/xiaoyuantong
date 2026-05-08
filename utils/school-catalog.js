const provinceSchoolGroups = require("./school-groups");

const GUIZHOU_PROVINCE = "贵州省";

const schoolProvinceMap = {};
provinceSchoolGroups.forEach((group) => {
  group.schools.forEach((school) => {
    schoolProvinceMap[school] = group.province;
  });
});

function cloneGroups(groups) {
  return groups.map((group) => ({
    province: group.province,
    schools: group.schools.slice()
  }));
}

function sortProvinceGroups(groups) {
  return groups.slice().sort((left, right) => {
    if (left.province === GUIZHOU_PROVINCE) return -1;
    if (right.province === GUIZHOU_PROVINCE) return 1;
    return left.province.localeCompare(right.province, "zh-CN");
  });
}

function getProvinceSchoolGroups() {
  return cloneGroups(sortProvinceGroups(provinceSchoolGroups));
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

  return sortProvinceGroups(provinceSchoolGroups)
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
