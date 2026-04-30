const baseSchools = require("./schools");

const GUIZHOU_EXTRA_SCHOOLS = [
  "贵州师范大学",
  "贵州财经大学",
  "贵州医科大学",
  "贵州警察学院",
  "贵州师范学院",
  "贵阳学院",
  "安顺学院",
  "铜仁学院",
  "凯里学院",
  "兴义民族师范学院",
  "贵州工程应用技术学院"
];

function buildSchoolOptions() {
  const result = baseSchools.slice();
  const insertIndex = result.indexOf("贵州大学");
  const targetIndex = insertIndex >= 0 ? insertIndex + 1 : result.length;
  const missingSchools = GUIZHOU_EXTRA_SCHOOLS.filter((school) => !result.includes(school));

  result.splice(targetIndex, 0, ...missingSchools);
  return result;
}

module.exports = buildSchoolOptions();
