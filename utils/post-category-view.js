const PRIMARY_CATEGORY_BY_TYPE = {
  market: "\u8df3\u86a4\u5e02\u573a",
  "job-post": "\u517c\u804c\u4fe1\u606f",
  "rent-house": "\u623f\u5c4b\u79df\u552e",
  "tree-hole": "\u6811\u6d1e",
  partner: "\u627e\u642d\u5b50",
  errand: "\u8dd1\u817f\u4ee3\u529e"
};

const THEME_BY_PRIMARY_CATEGORY = {
  "\u8df3\u86a4\u5e02\u573a": "market",
  "\u517c\u804c\u4fe1\u606f": "job",
  "\u623f\u5c4b\u79df\u552e": "rent",
  "\u6811\u6d1e": "tree",
  "\u627e\u642d\u5b50": "partner",
  "\u8dd1\u817f\u4ee3\u529e": "errand"
};

const SECONDARY_CATEGORY_BY_PRIMARY_CATEGORY = {
  "\u6811\u6d1e": [
    "\u60c5\u611f\u503e\u8bc9",
    "\u795e\u79d8\u8868\u767d\u5c40",
    "\u6c42\u52a9\u54a8\u8be2",
    "\u907f\u96f7\u63d0\u9192",
    "\u6821\u56ed\u516b\u5366",
    "\u5b66\u4e1a\u5410\u69fd",
    "\u65e5\u5e38\u788e\u788e\u5ff5",
    "\u597d\u7269\u5b89\u5229",
    "\u5176\u4ed6\u7c7b\u578b"
  ],
  "\u623f\u5c4b\u79df\u552e": ["\u6c42\u79df\u4fe1\u606f", "\u53d1\u5e03\u623f\u6e90", "\u5176\u4ed6\u623f\u5c4b\u79df\u552e"],
  "\u517c\u804c\u4fe1\u606f": [
    "\u6821\u5185\u5c97\u4f4d",
    "\u5b9e\u4e60\u5c97\u4f4d",
    "\u517c\u804c\u62db\u8058",
    "\u6c42\u804c\u54a8\u8be2",
    "\u5bb6\u6559\u8f85\u5bfc",
    "\u5176\u4ed6\u517c\u804c"
  ],
  "\u627e\u642d\u5b50": [
    "\u65c5\u6e38\u642d\u5b50",
    "\u5b66\u4e60\u642d\u5b50",
    "\u8d5b\u4e8b\u642d\u5b50",
    "\u8fd0\u52a8\u642d\u5b50",
    "\u7f8e\u98df\u642d\u5b50",
    "\u6e38\u620f\u642d\u5b50",
    "\u51fa\u884c\u642d\u5b50",
    "\u5176\u4ed6\u642d\u5b50"
  ],
  "\u8dd1\u817f\u4ee3\u529e": [
    "\u5feb\u9012\u4ee3\u53d6",
    "\u5916\u5356\u4ee3\u53d6",
    "\u98df\u5802\u4ee3\u4e70",
    "\u8d85\u5e02\u4ee3\u8d2d",
    "\u6821\u56ed\u8dd1\u817f",
    "\u5176\u4ed6\u4ee3\u529e"
  ],
  "\u8df3\u86a4\u5e02\u573a": [
    "\u56fe\u4e66\u8d44\u6599",
    "\u7535\u5b50\u6570\u7801",
    "\u751f\u6d3b\u7528\u54c1",
    "\u670d\u9970\u978b\u5e3d",
    "\u7f8e\u5986\u62a4\u80a4",
    "\u8fd0\u52a8\u5668\u6750",
    "\u5174\u8da3\u597d\u7269",
    "\u5176\u4ed6\u95f2\u7f6e"
  ]
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
  const primaryLabel = String((post && post.primaryCategory) || "").trim() || inferPrimaryCategory(secondaryLabel) || "\u5176\u4ed6";
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
