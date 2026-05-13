const publishTypeMap = {
  "tree-hole": {
    label: "\u60c5\u611f\u6811\u6d1e",
    submitText: "\u53d1\u5e03",
    categories: [
      "\u60c5\u611f\u503e\u8bc9",
      "\u795e\u79d8\u8868\u767d\u5c40",
      "\u6c42\u52a9\u54a8\u8be2",
      "\u907f\u96f7\u63d0\u9192",
      "\u6821\u56ed\u516b\u5366",
      "\u5b66\u4e1a\u5410\u69fd",
      "\u65e5\u5e38\u788e\u788e\u5ff5",
      "\u597d\u7269\u5b89\u5229",
      "\u5176\u4ed6\u7c7b\u578b"
    ]
  },
  "rent-house": {
    label: "\u623f\u5c4b\u79df\u552e",
    submitText: "\u53d1\u5e03",
    categories: ["\u6c42\u79df\u4fe1\u606f", "\u53d1\u5e03\u623f\u6e90", "\u5176\u4ed6\u623f\u5c4b\u79df\u552e"]
  },
  "job-post": {
    label: "\u517c\u804c\u53d1\u5e03",
    submitText: "\u53d1\u5e03",
    categories: [
      "\u6821\u5185\u5c97\u4f4d",
      "\u5b9e\u4e60\u5c97\u4f4d",
      "\u517c\u804c\u62db\u8058",
      "\u6c42\u804c\u54a8\u8be2",
      "\u5bb6\u6559\u8f85\u5bfc",
      "\u5176\u4ed6\u517c\u804c"
    ]
  },
  partner: {
    label: "\u627e\u642d\u5b50",
    submitText: "\u53d1\u5e03",
    categories: [
      "\u65c5\u6e38\u642d\u5b50",
      "\u5b66\u4e60\u642d\u5b50",
      "\u8d5b\u4e8b\u642d\u5b50",
      "\u8fd0\u52a8\u642d\u5b50",
      "\u7f8e\u98df\u642d\u5b50",
      "\u6e38\u620f\u642d\u5b50",
      "\u51fa\u884c\u642d\u5b50",
      "\u5176\u4ed6\u642d\u5b50"
    ]
  },
  errand: {
    label: "\u8dd1\u817f\u4ee3\u529e",
    submitText: "\u53d1\u5e03",
    categories: [
      "\u5feb\u9012\u4ee3\u53d6",
      "\u5916\u5356\u4ee3\u53d6",
      "\u98df\u5802\u4ee3\u4e70",
      "\u8d85\u5e02\u4ee3\u8d2d",
      "\u6821\u56ed\u8dd1\u817f",
      "\u5176\u4ed6\u4ee3\u529e"
    ]
  },
  market: {
    label: "\u8df3\u86a4\u5e02\u573a",
    submitText: "\u53d1\u5e03",
    categories: [
      "\u56fe\u4e66\u8d44\u6599",
      "\u7535\u5b50\u6570\u7801",
      "\u751f\u6d3b\u7528\u54c1",
      "\u670d\u9970\u978b\u5e3d",
      "\u7f8e\u5986\u62a4\u80a4",
      "\u8fd0\u52a8\u5668\u6750",
      "\u5174\u8da3\u597d\u7269",
      "\u5176\u4ed6\u95f2\u7f6e"
    ]
  }
};

function getPublishType(type) {
  return publishTypeMap[type] || publishTypeMap["tree-hole"];
}

module.exports = {
  publishTypeMap,
  getPublishType
};
