const orderTabs = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待付款" },
  { key: "processing", label: "进行中" },
  { key: "finished", label: "已完成" }
];

const orderList = [
  {
    id: "order-001",
    displayNo: "订单编号 20260408001",
    status: "processing",
    statusText: "进行中",
    title: "梧桐轻食屋 双人轻食套餐",
    amount: "36.00",
    time: "2026-04-08 12:10",
    desc: "预计 12:30 送达南苑宿舍 3 栋"
  },
  {
    id: "order-002",
    displayNo: "订单编号 20260406002",
    status: "finished",
    statusText: "已完成",
    title: "云上花坊 毕业花束预订",
    amount: "88.00",
    time: "2026-04-06 18:40",
    desc: "已完成到店自取"
  },
  {
    id: "order-003",
    displayNo: "订单编号 20260405003",
    status: "pending",
    statusText: "待付款",
    title: "未名资料社 论文打印装订",
    amount: "19.90",
    time: "2026-04-05 20:15",
    desc: "订单已生成，请在 15 分钟内完成支付"
  }
];

const favoriteTabs = [
  { key: "posts", label: "收藏帖子" },
  { key: "shops", label: "收藏店铺" }
];

const favoritePosts = [
  {
    id: 101,
    title: "计算机等级考试资料转让",
    school: "六盘水师范学院",
    tag: "跳蚤市场",
    time: "昨天 18:26"
  },
  {
    id: 202,
    title: "晨跑搭子招募",
    school: "北京大学",
    tag: "找搭子",
    time: "4 月 6 日"
  }
];

const favoriteShops = [
  {
    id: "student-study-1",
    name: "未名资料社",
    school: "北京大学",
    tags: ["考研资料", "论文打印"],
    status: "营业中"
  },
  {
    id: "dorm-snacks-1",
    name: "师院小卖部",
    school: "六盘水师范学院",
    tags: ["宿舍配送", "夜宵常备"],
    status: "可配送"
  }
];

const addressList = [
  {
    id: "addr-001",
    name: "李超杰",
    phone: "175****0715",
    address: "贵州大学 东区宿舍 5 栋 302",
    tag: "默认地址"
  },
  {
    id: "addr-002",
    name: "李超杰",
    phone: "175****0715",
    address: "贵州大学 图书馆自提点",
    tag: "自提地址"
  }
];

const helpCards = [
  {
    title: "账户与认证",
    desc: "校园认证、资料修改、账号安全相关问题"
  },
  {
    title: "订单与退款",
    desc: "订单进度、退款时效、售后处理说明"
  },
  {
    title: "商家入驻",
    desc: "开店申请、资料提交、审核进度查询"
  }
];

const contactList = [
  { label: "平台客服", value: "工作日 09:00 - 18:00" },
  { label: "客服微信", value: "校院通客服小助手" },
  { label: "客服邮箱", value: "平台服务邮箱已开通，可联系在线客服获取" }
];

const aboutInfo = {
  name: "校院通",
  version: "当前版本 1.0.0",
  intro:
    "校院通聚合校园帖子、创业店铺、消息通知与认证服务，帮助学生更方便地完成校内生活与交易。",
  sections: [
    {
      title: "我们在做什么",
      content: "连接校园用户、学生商家和本地服务，把分散的信息整合到一个统一入口。"
    },
    {
      title: "适用场景",
      content: "二手交易、宿舍配送、找搭子、活动通知、校园认证和店铺管理。"
    },
    {
      title: "后续规划",
      content: "继续完善订单、收藏、搜索、商家入驻和消息联动能力。"
    }
  ]
};

module.exports = {
  aboutInfo,
  addressList,
  contactList,
  favoritePosts,
  favoriteShops,
  favoriteTabs,
  helpCards,
  orderList,
  orderTabs
};
