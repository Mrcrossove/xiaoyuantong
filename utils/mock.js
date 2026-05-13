const services = [
  { label: "跳蚤市场", icon: "market" },
  { label: "兼职信息", icon: "job" },
  { label: "房屋租赁", icon: "rent" },
  { label: "树洞", icon: "chat" },
  { label: "找搭子", icon: "group" },
  { label: "跑腿代办", icon: "run" }
];

const fabOptions = [
  { label: "树洞", type: "tree-hole", color: "#ff5fa3" },
  { label: "房屋租赁", type: "rent-house", color: "#54b7ff" },
  { label: "兼职发布", type: "job-post", color: "#ffb13c" },
  { label: "找搭子", type: "partner", color: "#ff8b56" },
  { label: "跑腿代办", type: "errand", color: "#8a63f6" },
  { label: "跳蚤市场", type: "market", color: "#67d36e" }
];

const publishTypeMap = {
  "tree-hole": {
    label: "情感树洞",
    submitText: "发布",
    categories: ["情感倾诉", "神秘表白局", "求助咨询", "避雷提醒", "校园八卦", "学业吐槽", "日常碎碎念", "好物安利", "其他类型"]
  },
  "rent-house": {
    label: "房屋租赁",
    submitText: "发布",
    categories: ["求租信息", "发布房源", "其他房屋租赁"]
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

const posts = [
  {
    id: 1,
    author: "校友0942683901",
    school: "六盘水师范学院",
    category: "跳蚤市场",
    time: "2025-12-12 16:26:08",
    title: "平板转让",
    content: "出一台 MatePad SE 2024，8+256G，九成新，自带键盘和触控笔，支持校内当面验货。",
    images: ["style-list", "style-cat", "style-cartoon", "style-device"],
    contact: [
      { label: "手机号", value: "187 8586 2301" },
      { label: "微信号", value: "campus-plate-2301" }
    ]
  },
  {
    id: 2,
    author: "校友0942683901",
    school: "六盘水师范学院",
    category: "跳蚤市场",
    time: "2025-12-12 16:24:49",
    title: "桌子转让",
    content: "闲置书桌一张，宿舍自提优先，桌面平整，适合宿舍学习和临时办公。",
    images: ["style-device", "style-list", "style-cartoon"],
    contact: [
      { label: "手机号", value: "182 7841 6608" },
      { label: "微信号", value: "desk-campus-6608" }
    ]
  }
];

const shopCategories = [
  { key: "student", label: "学生商家", icon: "student" },
  { key: "dorm", label: "宿舍超市", icon: "dorm" },
  { key: "campus", label: "校内商家", icon: "campus" },
  { key: "offCampus", label: "校外商家", icon: "offCampus" }
];

const storefrontBanners = [
  {
    id: 1,
    tag: "平台推荐",
    title: "创业好店入驻计划",
    desc: "展示新店曝光位、限时扶持和校园热卖好物。",
    cta: "查看更多"
  }
];

const storefrontShops = [
  {
    id: 1,
    name: "楼下小卖部",
    rating: 4.7,
    monthlySales: "1.2k",
    distance: "距离 50m",
    delivery: "10分钟达",
    price: "起送 ¥15",
    tags: ["饮料零食", "宿舍常备"],
    badge: "近",
    cover: "store-mini"
  },
  {
    id: 2,
    name: "川味小馆",
    rating: 4.6,
    monthlySales: "3.2k",
    distance: "距离 280m",
    delivery: "满减活动",
    price: "起送 ¥20",
    tags: ["热销简餐", "晚餐热门"],
    badge: "热卖",
    cover: "store-sichuan"
  },
  {
    id: 3,
    name: "梧桐餐厅",
    rating: 4.9,
    monthlySales: "8.7k",
    distance: "校内食堂",
    delivery: "可用校内卡",
    price: "堂食为主",
    tags: ["官方认证", "早餐供应"],
    badge: "认证",
    cover: "store-canteen"
  },
  {
    id: 4,
    name: "小雨花坊",
    rating: 4.8,
    monthlySales: "523",
    distance: "距离 1.1km",
    delivery: "主营鲜花礼品",
    price: "支持预订",
    tags: ["节日花束", "拍照布置"],
    badge: "推荐",
    cover: "store-flower"
  }
];

const merchantCategoryPages = {
  student: {
    title: "学生商家",
    sections: [
      {
        key: "study",
        label: "学习资料",
        shops: [
          { id: "student-study-1", name: "考研资料铺", subtitle: "历年真题 / 笔记整理", rating: 4.9, distance: "距宿舍 120m", tags: ["学生优惠", "资料齐全"], cover: "study", hasRecommendedProduct: true, recommendedProductName: "考研专享面授券", recommendedProductPrice: "¥6800" },
          { id: "student-study-2", name: "论文排版屋", subtitle: "格式修改 / 打印装订", rating: 4.7, distance: "距图书馆 80m", tags: ["急单可做", "支持打印"], cover: "print" }
        ]
      },
      {
        key: "secondhand",
        label: "二手交易",
        shops: [
          { id: "student-second-1", name: "闲置交换站", subtitle: "二手数码 / 宿舍好物", rating: 4.8, distance: "距操场 260m", tags: ["免配送费", "可自提"], cover: "secondhand" }
        ]
      },
      {
        key: "errand",
        label: "跑腿代购",
        shops: [
          { id: "student-errand-1", name: "小食堂", subtitle: "美食外卖", rating: 4.8, distance: "距宿舍 200m", tags: ["学生优惠", "免配送费"], cover: "snack", hasRecommendedProduct: true, recommendedProductName: "招牌套餐饭", recommendedProductPrice: "¥22" }
        ]
      },
      {
        key: "life",
        label: "生活服务",
        shops: [
          { id: "student-life-1", name: "宿舍洗护角", subtitle: "洗衣 / 清洁 / 日化", rating: 4.6, distance: "距宿舍 60m", tags: ["晚间营业", "平价服务"], cover: "laundry" }
        ]
      },
      {
        key: "entertainment",
        label: "娱乐休闲",
        shops: [
          { id: "student-game-1", name: "桌游轻社", subtitle: "剧本 / 桌游 / 轻饮", rating: 4.7, distance: "距北门 430m", tags: ["好友拼团", "周末活动"], cover: "game" }
        ]
      },
      {
        key: "food",
        label: "美食外卖",
        shops: [
          { id: "student-food-1", name: "夜猫子轻食", subtitle: "沙拉 / 三明治 / 饮品", rating: 4.8, distance: "距公寓 160m", tags: ["深夜营业", "低脂推荐"], cover: "takeout", hasRecommendedProduct: true, recommendedProductName: "深夜轻食套餐", recommendedProductPrice: "¥88" }
        ]
      }
    ]
  },
  dorm: {
    title: "宿舍超市",
    sections: [
      {
        key: "snacks",
        label: "零食饮料",
        shops: [
          { id: "dorm-snacks-1", name: "楼下小卖部", subtitle: "饮料零食 / 日常补给", rating: 4.7, distance: "距宿舍 50m", tags: ["10分钟达", "宿舍常备"], cover: "snack" }
        ]
      },
      {
        key: "daily",
        label: "日用百货",
        shops: [
          { id: "dorm-daily-1", name: "寝室便利仓", subtitle: "纸巾 / 洗护 / 插座", rating: 4.6, distance: "距公寓 90m", tags: ["满减活动", "支持送寝"], cover: "laundry" }
        ]
      },
      {
        key: "fruit",
        label: "水果鲜食",
        shops: [
          { id: "dorm-fruit-1", name: "鲜果到寝", subtitle: "水果切盒 / 酸奶杯", rating: 4.8, distance: "距南苑 180m", tags: ["当日现切", "宿舍配送"], cover: "fruit" }
        ]
      }
    ]
  },
  campus: {
    title: "校内商家",
    sections: [
      {
        key: "canteen",
        label: "食堂餐饮",
        shops: [
          { id: "campus-food-1", name: "梧桐餐厅", subtitle: "早餐 / 简餐 / 盖饭", rating: 4.9, distance: "校内食堂", tags: ["官方认证", "可用校内卡"], cover: "canteen" }
        ]
      },
      {
        key: "service",
        label: "校园服务",
        shops: [
          { id: "campus-service-1", name: "快印中心", subtitle: "打印复印 / 装订扫描", rating: 4.7, distance: "行政楼旁", tags: ["急件优先", "支持电子稿"], cover: "print" }
        ]
      },
      {
        key: "sports",
        label: "运动休闲",
        shops: [
          { id: "campus-sports-1", name: "羽球补给站", subtitle: "球拍穿线 / 配件零售", rating: 4.6, distance: "体育馆 70m", tags: ["器材租借", "学生价"], cover: "game" }
        ]
      }
    ]
  },
  offCampus: {
    title: "校外商家",
    sections: [
      {
        key: "restaurant",
        label: "餐饮美食",
        shops: [
          { id: "off-food-1", name: "川味小馆", subtitle: "冒菜 / 炒饭 / 小炒", rating: 4.6, distance: "距校门 280m", tags: ["热卖", "满减活动"], cover: "canteen", hasRecommendedProduct: true, recommendedProductName: "双人川味套餐", recommendedProductPrice: "¥58" }
        ]
      },
      {
        key: "flower",
        label: "鲜花礼品",
        shops: [
          { id: "off-flower-1", name: "小雨花坊", subtitle: "花束 / 礼盒 / 布置", rating: 4.8, distance: "距校门 1.1km", tags: ["节日预订", "拍照布置"], cover: "flower" }
        ]
      },
      {
        key: "market",
        label: "生活百货",
        shops: [
          { id: "off-market-1", name: "友邻超市", subtitle: "零食百货 / 冷藏饮品", rating: 4.5, distance: "距西门 650m", tags: ["整箱优惠", "晚间配送"], cover: "fruit" }
        ]
      }
    ]
  }
};

const merchantShopDetails = {
  "student-study-1": { title: "店铺主页", storeName: "考研资料铺", notice: "店铺提供考研真题、笔记整理和冲刺资料，支持电子版与打印版。", phone: "18985580188", address: "贵州省贵阳市花溪区大学城数字经济产业园2号楼6层", stats: { sold: "26份", amount: "6800.00", count: 1 }, banners: ["study", "print", "study"], products: [{ id: "p1", name: "考研专享面授券", desc: "课程 / 冲刺班 / 资料包", price: "¥6800", cover: "poster" }] },
  "student-study-2": { title: "店铺主页", storeName: "论文排版屋", notice: "论文排版、打印装订和查重辅导均可预约，适合毕业季急件处理。", phone: "18760231291", address: "贵州省贵阳市花溪区大学城学生活动中心旁", stats: { sold: "18份", amount: "980.00", count: 1 }, banners: ["print", "study", "print"], products: [{ id: "p1", name: "论文排版加急服务", desc: "格式检查 / 目录生成 / 装订", price: "¥98", cover: "poster" }] },
  "student-second-1": { title: "店铺主页", storeName: "闲置交换站", notice: "主营二手数码、宿舍闲置与教材交换，支持线下验货。", phone: "18685012233", address: "贵州省贵阳市花溪区大学城商业街A区12号", stats: { sold: "43件", amount: "1280.00", count: 1 }, banners: ["secondhand", "study", "secondhand"], products: [{ id: "p1", name: "二手平板寄售", desc: "验机上架 / 校内面交", price: "¥1280", cover: "device" }] },
  "student-errand-1": { title: "店铺主页", storeName: "小食堂", notice: "学生自营轻食外卖，主打宿舍配送和学生优惠套餐。", phone: "18985580188", address: "贵州省贵阳市花溪区大学城东区宿舍楼下商铺", stats: { sold: "26份", amount: "6800.00", count: 1 }, banners: ["takeout", "snack", "takeout"], products: [{ id: "p1", name: "街事考专面授券", desc: "课程 / 事业单位联考钻石班", price: "¥6800", cover: "poster" }] },
  "student-life-1": { title: "店铺主页", storeName: "宿舍洗护角", notice: "提供洗衣、清洁与宿舍应急日化用品，支持晚间配送。", phone: "18860237722", address: "贵州省贵阳市花溪区大学城南苑公寓1栋侧门", stats: { sold: "12单", amount: "168.00", count: 1 }, banners: ["laundry", "laundry", "snack"], products: [{ id: "p1", name: "宿舍洗护套餐", desc: "洗衣液 / 消毒液 / 清洁巾", price: "¥168", cover: "poster" }] },
  "student-game-1": { title: "店铺主页", storeName: "桌游轻社", notice: "聚会桌游、剧本杀和轻饮套餐均可预约，周末场次较满。", phone: "18685551120", address: "贵州省贵阳市花溪区大学城北门商业街2层", stats: { sold: "9场", amount: "299.00", count: 1 }, banners: ["game", "game", "snack"], products: [{ id: "p1", name: "双人桌游体验券", desc: "限周末使用 / 含饮品", price: "¥299", cover: "poster" }] },
  "student-food-1": { title: "店铺主页", storeName: "夜猫子轻食", notice: "夜宵和轻食套餐可提前预订，适合宿舍配送。", phone: "18985003317", address: "贵州省贵阳市花溪区大学城西区商业步行街", stats: { sold: "31份", amount: "88.00", count: 1 }, banners: ["takeout", "fruit", "takeout"], products: [{ id: "p1", name: "深夜轻食套餐", desc: "沙拉 / 三明治 / 饮品", price: "¥88", cover: "poster" }] },
  "dorm-snacks-1": { title: "店铺主页", storeName: "楼下小卖部", notice: "宿舍近场补给，饮料零食与日用品均可送寝。", phone: "18985583660", address: "贵州省贵阳市花溪区大学城东苑2栋楼下", stats: { sold: "52单", amount: "39.90", count: 1 }, banners: ["snack", "fruit", "snack"], products: [{ id: "p1", name: "宿舍补给组合", desc: "饮料 / 薯片 / 纸巾", price: "¥39.9", cover: "poster" }] },
  "dorm-daily-1": { title: "店铺主页", storeName: "寝室便利仓", notice: "寝室清洁和日用百货齐全，适合临时补货。", phone: "18786002412", address: "贵州省贵阳市花溪区大学城南苑生活区", stats: { sold: "24单", amount: "59.00", count: 1 }, banners: ["laundry", "snack", "laundry"], products: [{ id: "p1", name: "宿舍日用套装", desc: "纸品 / 洗护 / 插座", price: "¥59", cover: "poster" }] },
  "dorm-fruit-1": { title: "店铺主页", storeName: "鲜果到寝", notice: "水果切盒和酸奶杯支持宿舍即时配送。", phone: "18785061988", address: "贵州省贵阳市花溪区大学城南苑水果档口", stats: { sold: "16份", amount: "29.90", count: 1 }, banners: ["fruit", "fruit", "snack"], products: [{ id: "p1", name: "鲜果切盒套餐", desc: "当日现切 / 宿舍配送", price: "¥29.9", cover: "poster" }] },
  "campus-food-1": { title: "店铺主页", storeName: "梧桐餐厅", notice: "校内餐饮官方认证，可用校园卡结算，早餐到晚餐均供应。", phone: "0851-88997766", address: "贵州省贵阳市花溪区大学城梧桐食堂1层", stats: { sold: "81份", amount: "22.00", count: 1 }, banners: ["canteen", "takeout", "canteen"], products: [{ id: "p1", name: "招牌套餐饭", desc: "热菜 / 米饭 / 例汤", price: "¥22", cover: "poster" }] },
  "campus-service-1": { title: "店铺主页", storeName: "快印中心", notice: "支持打印、复印、扫描和论文装订，急件优先。", phone: "0851-88661123", address: "贵州省贵阳市花溪区大学城行政楼旁服务点", stats: { sold: "15份", amount: "35.00", count: 1 }, banners: ["print", "study", "print"], products: [{ id: "p1", name: "论文打印装订", desc: "黑白打印 / 胶装 / 骑马钉", price: "¥35", cover: "poster" }] },
  "campus-sports-1": { title: "店铺主页", storeName: "羽球补给站", notice: "球拍穿线、配件零售和器材租借服务一站式提供。", phone: "18785510082", address: "贵州省贵阳市花溪区大学城体育馆东侧", stats: { sold: "8次", amount: "66.00", count: 1 }, banners: ["game", "game", "study"], products: [{ id: "p1", name: "球拍穿线服务", desc: "含线材 / 当日完成", price: "¥66", cover: "poster" }] },
  "off-food-1": { title: "店铺主页", storeName: "川味小馆", notice: "校外热卖川菜小馆，适合聚餐与外卖点单。", phone: "0851-88551220", address: "贵州省贵阳市花溪区大学城北门外商业街16号", stats: { sold: "46份", amount: "58.00", count: 1 }, banners: ["canteen", "takeout", "snack"], products: [{ id: "p1", name: "双人川味套餐", desc: "冒菜 / 炒饭 / 凉菜", price: "¥58", cover: "poster" }] },
  "off-flower-1": { title: "店铺主页", storeName: "小雨花坊", notice: "鲜花花束、礼盒和活动布置均支持提前预订。", phone: "18786690021", address: "贵州省贵阳市花溪区大学城西门外花艺街9号", stats: { sold: "11束", amount: "199.00", count: 1 }, banners: ["flower", "flower", "study"], products: [{ id: "p1", name: "节日花束礼盒", desc: "鲜花 / 贺卡 / 包装", price: "¥199", cover: "poster" }] },
  "off-market-1": { title: "店铺主页", storeName: "友邻超市", notice: "校外百货商超，适合整箱采购与晚间配送。", phone: "0851-88236619", address: "贵州省贵阳市花溪区大学城西门外生活广场B1", stats: { sold: "20单", amount: "89.00", count: 1 }, banners: ["snack", "fruit", "laundry"], products: [{ id: "p1", name: "零食百货组合", desc: "饮料 / 纸品 / 速食", price: "¥89", cover: "poster" }] }
};

function getPostById(id) {
  return posts.find((post) => String(post.id) === String(id)) || posts[0];
}

function getPublishType(type) {
  return publishTypeMap[type] || publishTypeMap["tree-hole"];
}

function getMerchantCategoryPage(key) {
  return merchantCategoryPages[key] || merchantCategoryPages.student;
}

function getMerchantShopDetail(id) {
  return merchantShopDetails[id] || merchantShopDetails["student-errand-1"];
}

module.exports = {
  services,
  fabOptions,
  posts,
  shopCategories,
  storefrontBanners,
  storefrontShops,
  merchantCategoryPages,
  merchantShopDetails,
  publishTypeMap,
  getPostById,
  getPublishType,
  getMerchantCategoryPage,
  getMerchantShopDetail
};
