import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEXT = {
  superAdmin: "\u8d85\u7ea7\u7ba1\u7406\u5458",
  auditAdmin: "\u5ba1\u6838\u7ba1\u7406\u5458",
  operationAdmin: "\u8fd0\u8425\u4e13\u5458",
  enabled: "\u542f\u7528",
  disabled: "\u505c\u7528",
  miniProgram: "\u5c0f\u7a0b\u5e8f",
  verified: "\u5df2\u8ba4\u8bc1",
  approved: "\u5df2\u901a\u8fc7",
  published: "\u5df2\u53d1\u5e03",
  onSale: "\u5df2\u4e0a\u67b6",
  pending: "\u5f85\u5ba1\u6838",
  open: "\u8425\u4e1a\u4e2d",
  officialNotice: "\u5b98\u65b9\u901a\u77e5",
  interactiveMessage: "\u4e92\u52a8\u6d88\u606f",
  studentStore: "\u5b66\u751f\u5546\u5bb6",
  dormStore: "\u5bbf\u820d\u8d85\u5e02",
  campusStore: "\u6821\u5185\u5546\u5bb6",
  offCampusStore: "\u6821\u5916\u5546\u5bb6"
};

const SCHOOLS = {
  tsinghua: "\u6e05\u534e\u5927\u5b66",
  pku: "\u5317\u4eac\u5927\u5b66",
  fudan: "\u590d\u65e6\u5927\u5b66",
  liupanshui: "\u516d\u76d8\u6c34\u5e08\u8303\u5b66\u9662",
  gzu: "\u8d35\u5dde\u5927\u5b66"
};

async function main() {
  await prisma.adminDictItem.deleteMany();
  await prisma.adminDictType.deleteMany();
  await prisma.adminSystemConfig.deleteMany();
  await prisma.adminRecommendConfig.deleteMany();
  await prisma.adminBannerConfig.deleteMany();
  await prisma.adminHelpArticle.deleteMany();
  await prisma.adminSearchWord.deleteMany();
  await prisma.adminMessageTemplate.deleteMany();
  await prisma.miniRefundRecord.deleteMany();
  await prisma.miniPostReport.deleteMany();
  await prisma.miniMessageRead.deleteMany();
  await prisma.miniPostComment.deleteMany();
  await prisma.miniPostLike.deleteMany();
  await prisma.miniWithdrawRecord.deleteMany();
  await prisma.miniWalletAccount.deleteMany();
  await prisma.miniOrder.deleteMany();
  await prisma.miniAddress.deleteMany();
  await prisma.miniFavorite.deleteMany();
  await prisma.miniMessage.deleteMany();
  await prisma.miniShopApply.deleteMany();
  await prisma.miniStore.deleteMany();
  await prisma.miniPost.deleteMany();
  await prisma.userVerification.deleteMany();
  await prisma.miniUser.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.adminRole.deleteMany();
  await prisma.schoolContent.deleteMany();
  await prisma.userPublishRecord.deleteMany();
  await prisma.productSpec.deleteMany();

  const superRole = await prisma.adminRole.create({
    data: {
      code: "super_admin",
      name: TEXT.superAdmin,
      scopeType: "all",
      status: TEXT.enabled,
      permissions: ["*"],
      menuPaths: [
        "/dashboard/overview",
        "/school/list",
        "/school/content",
        "/user/list",
        "/user/publish",
        "/verify/list",
        "/post/list",
        "/post/category",
        "/post/report",
        "/store/apply",
        "/store/list",
        "/store/category",
        "/product/list",
        "/product/spec",
        "/product/category",
        "/message/system",
        "/message/interactive",
        "/message/send",
        "/message/template",
        "/operation/banner",
        "/operation/recommend",
        "/operation/search-word",
        "/operation/help",
        "/trade/order",
        "/trade/refund",
        "/trade/wallet",
        "/trade/withdraw",
        "/stat/user",
        "/stat/post",
        "/stat/store",
        "/stat/order",
        "/system/basic",
        "/system/dict",
        "/system/log",
        "/system/version",
        "/auth/admin",
        "/auth/role",
        "/auth/menu"
      ]
    }
  });

  const auditRole = await prisma.adminRole.create({
    data: {
      code: "audit_admin",
      name: TEXT.auditAdmin,
      scopeType: "all",
      status: TEXT.enabled,
      permissions: [
        "verify:view",
        "verify:approve",
        "verify:reject",
        "store:apply:view",
        "store:apply:approve",
        "store:apply:reject",
        "post:report:review",
        "refund:review",
        "withdraw:review"
      ],
      menuPaths: ["/dashboard/overview", "/verify/list", "/post/list", "/post/report", "/store/apply", "/trade/refund", "/trade/withdraw"]
    }
  });

  const operationRole = await prisma.adminRole.create({
    data: {
      code: "operation_admin",
      name: TEXT.operationAdmin,
      scopeType: "assigned",
      status: TEXT.enabled,
      permissions: ["school:content:view", "school:content:edit", "user:publish:view", "product:spec:view", "product:spec:edit"],
      menuPaths: ["/dashboard/overview", "/school/content", "/user/publish", "/product/spec"]
    }
  });

  const serviceRole = await prisma.adminRole.create({
    data: {
      code: "service_admin",
      name: "\u5ba2\u670d\u4e3b\u7ba1",
      scopeType: "assigned",
      status: TEXT.enabled,
      permissions: ["order:view", "order:export", "wallet:view", "wallet:export", "refund:review", "withdraw:review"],
      menuPaths: ["/dashboard/overview", "/trade/order", "/trade/refund", "/trade/wallet", "/trade/withdraw"]
    }
  });

  const superAdmin = await prisma.adminUser.create({
    data: {
      account: "admin",
      password: "JP@admin",
      name: "\u5f20\u654f",
      status: TEXT.enabled,
      schools: [],
      roleId: superRole.id
    }
  });

  await prisma.adminUser.createMany({
    data: [
      {
        account: "audit",
        password: "JP@audit",
        name: "\u738b\u51ef",
        status: TEXT.enabled,
        schools: [],
        roleId: auditRole.id
      },
      {
        account: "operate",
        password: "JP@operate",
        name: "\u674e\u60f3",
        status: TEXT.enabled,
        schools: [SCHOOLS.tsinghua],
        roleId: operationRole.id
      },
      {
        account: "service",
        password: "JP@service",
        name: "\u9648\u6668",
        status: TEXT.enabled,
        schools: [SCHOOLS.pku],
        roleId: serviceRole.id
      }
    ]
  });

  const miniUser = await prisma.miniUser.create({
    data: {
      deviceId: "seed-device-001",
      nickname: "\u6821\u56ed\u7528\u6237",
      phone: "13800010001",
      school: SCHOOLS.tsinghua,
      verifyStatus: TEXT.verified,
      verifiedAt: new Date("2026-04-08T10:00:00+08:00")
    }
  });

  await prisma.userVerification.create({
    data: {
      userId: miniUser.id,
      realName: "\u6797\u77e5\u590f",
      phone: "13800010001",
      school: SCHOOLS.tsinghua,
      status: TEXT.approved,
      reviewerId: superAdmin.id,
      reviewNote: "\u7cfb\u7edf\u81ea\u52a8\u8ba4\u8bc1\u901a\u8fc7",
      reviewedAt: new Date("2026-04-08T10:00:00+08:00")
    }
  });

  await prisma.miniPost.createMany({
    data: [
      {
        userId: miniUser.id,
        school: SCHOOLS.tsinghua,
        authorName: "\u6797\u77e5\u590f",
        category: "\u6821\u56ed\u4e92\u52a9",
        title: "\u6e05\u534e\u98df\u5802\u665a\u9910\u62fc\u996d",
        content: "\u4eca\u665a\u4e1c\u533a\u98df\u5802\u4e00\u8d77\u62fc\u996d\uff0c\u4e24\u4eba\u4ee5\u4e0a\u53ef\u4ee5\u51cf\u514d\u914d\u9001\uff0c\u60f3\u4e00\u8d77\u7684\u540c\u5b66\u7559\u8a00\u3002",
        images: ["style-list", "style-cat"],
        contacts: [
          { label: "\u624b\u673a\u53f7", value: "13800010001" },
          { label: "\u6821\u56ed\u901a\u79c1\u4fe1", value: "\u53ef\u76f4\u63a5\u79c1\u4fe1\u8054\u7cfb" }
        ],
        isAnonymous: false,
        onlyCampus: true,
        status: TEXT.published
      },
      {
        userId: miniUser.id,
        school: SCHOOLS.pku,
        authorName: "\u5468\u4ee5\u5b89",
        category: "\u4e8c\u624b\u4ea4\u6613",
        title: "\u5317\u5927\u56db\u6708\u8df3\u86a4\u5e02\u573a\u62db\u52df\u644a\u4e3b",
        content: "\u672c\u5468\u672b\u6821\u5185\u8df3\u86a4\u5e02\u573a\u5f00\u653e\u62a5\u540d\uff0c\u4e8c\u624b\u4e66\u3001\u7535\u5b50\u4ea7\u54c1\u3001\u6587\u521b\u5468\u8fb9\u5747\u53ef\u62a5\u540d\u6446\u644a\u3002",
        images: ["style-device", "style-cartoon"],
        contacts: [
          { label: "\u624b\u673a\u53f7", value: "13800010002" },
          { label: "\u6821\u56ed\u901a\u79c1\u4fe1", value: "\u5907\u6ce8\u644a\u4e3b\u62a5\u540d" }
        ],
        isAnonymous: false,
        onlyCampus: true,
        status: TEXT.published
      },
      {
        userId: miniUser.id,
        school: SCHOOLS.fudan,
        authorName: "\u9648\u9e3f\u7fbd",
        category: "\u6821\u56ed\u793e\u4ea4",
        title: "\u590d\u65e6\u5357\u533a\u8dd1\u6b65\u642d\u5b50\u96c6\u5408",
        content: "\u6bcf\u665a\u516b\u70b9\u5357\u533a\u64cd\u573a\u6162\u8dd1\u4e94\u516c\u91cc\uff0c\u6b22\u8fce\u957f\u671f\u7a33\u5b9a\u7684\u540c\u5b66\u4e00\u8d77\u6253\u5361\u3002",
        images: ["style-cartoon"],
        contacts: [
          { label: "\u624b\u673a\u53f7", value: "13800010003" },
          { label: "\u6821\u56ed\u901a\u79c1\u4fe1", value: "\u8bf4\u660e\u8dd1\u6b65\u642d\u5b50" }
        ],
        isAnonymous: false,
        onlyCampus: true,
        status: TEXT.published
      }
    ]
  });

  await prisma.miniStore.createMany({
    data: [
      {
        detailId: "student-study-1",
        school: SCHOOLS.pku,
        name: "\u8003\u7814\u8d44\u6599\u94fa",
        groupKey: "student",
        groupLabel: TEXT.studentStore,
        sectionKey: "study",
        sectionLabel: "\u5b66\u4e60\u8d44\u6599",
        subtitle: "\u5386\u5e74\u771f\u9898 / \u7b14\u8bb0\u6574\u7406",
        rating: 4.9,
        monthlySales: "980",
        distance: "\u8ddd\u56fe\u4e66\u9986 120m",
        delivery: "\u8d44\u6599\u6253\u5370",
        priceText: "\u652f\u6301\u9884\u7ea6",
        tags: ["\u5b66\u751f\u4f18\u60e0", "\u8d44\u6599\u9f50\u5168"],
        badge: "\u5b66\u9738\u63a8\u8350",
        cover: "study",
        title: "\u5e97\u94fa\u4e3b\u9875",
        notice: "\u5e97\u94fa\u63d0\u4f9b\u8003\u7814\u771f\u9898\u3001\u7b14\u8bb0\u6574\u7406\u548c\u51b2\u523a\u8d44\u6599\uff0c\u652f\u6301\u7535\u5b50\u7248\u4e0e\u6253\u5370\u7248\u3002",
        phone: "18985580188",
        address: "\u5317\u4eac\u5e02\u6d77\u6dc0\u533a\u6821\u5185\u521b\u65b0\u4e2d\u5fc3 2 \u5c42",
        soldText: "26\u4ef6",
        amountText: "6800.00",
        productCount: 1,
        banners: ["study", "print", "study"],
        products: [{ id: "p1", name: "\u8003\u7814\u4e13\u9879\u9762\u6388\u73ed", desc: "\u8bfe\u7a0b / \u51b2\u523a\u73ed / \u8d44\u6599\u5305", price: "\u00a56800", cover: "poster" }],
        status: TEXT.open
      },
      {
        detailId: "student-food-1",
        school: SCHOOLS.pku,
        name: "\u591c\u732b\u5b50\u8f7b\u98df",
        groupKey: "student",
        groupLabel: TEXT.studentStore,
        sectionKey: "food",
        sectionLabel: "\u7f8e\u98df\u5916\u5356",
        subtitle: "\u6c99\u62c9 / \u4e09\u660e\u6cbb / \u996e\u54c1",
        rating: 4.8,
        monthlySales: "1700",
        distance: "\u8ddd\u5bbf\u820d\u533a 210m",
        delivery: "\u6df1\u591c\u8425\u4e1a",
        priceText: "\u8d77\u9001 20\u5143",
        tags: ["\u8f7b\u98df\u996e\u54c1", "\u6df1\u591c\u8425\u4e1a"],
        badge: "\u70ed\u5356",
        cover: "takeout",
        title: "\u5e97\u94fa\u4e3b\u9875",
        notice: "\u591c\u5bb5\u548c\u8f7b\u98df\u5957\u9910\u53ef\u63d0\u524d\u9884\u7ea6\uff0c\u9002\u5408\u5bbf\u820d\u914d\u9001\u3002",
        phone: "18985003317",
        address: "\u5317\u4eac\u5e02\u6d77\u6dc0\u533a\u6821\u5185\u5546\u4e1a\u6b65\u884c\u8857",
        soldText: "31\u4ef6",
        amountText: "88.00",
        productCount: 1,
        banners: ["takeout", "fruit", "takeout"],
        products: [{ id: "p1", name: "\u6df1\u591c\u8f7b\u98df\u5957\u9910", desc: "\u6c99\u62c9 / \u4e09\u660e\u6cbb / \u996e\u54c1", price: "\u00a588", cover: "poster" }],
        status: TEXT.open
      },
      {
        detailId: "dorm-snacks-1",
        school: SCHOOLS.liupanshui,
        name: "\u5e08\u9662\u5c0f\u5356\u90e8",
        groupKey: "dorm",
        groupLabel: TEXT.dormStore,
        sectionKey: "snacks",
        sectionLabel: "\u96f6\u98df\u996e\u6599",
        subtitle: "\u996e\u6599\u96f6\u98df / \u65e5\u5e38\u8865\u7ed9",
        rating: 4.7,
        monthlySales: "1200",
        distance: "\u8ddd\u79bb 50m",
        delivery: "10\u5206\u949f\u9001\u8fbe",
        priceText: "\u8d77\u9001 15\u5143",
        tags: ["\u996e\u6599\u96f6\u98df", "\u5bbf\u820d\u5e38\u5907"],
        badge: "\u8fd1",
        cover: "store-mini",
        title: "\u5e97\u94fa\u4e3b\u9875",
        notice: "\u5bbf\u820d\u8fd1\u573a\u8865\u7ed9\uff0c\u996e\u6599\u96f6\u98df\u4e0e\u65e5\u7528\u54c1\u5747\u53ef\u9001\u8d27\u3002",
        phone: "18985583660",
        address: "\u8d35\u5dde\u7701\u516d\u76d8\u6c34\u5e02\u949f\u5c71\u533a\u4e1c\u82d1\u5bbf\u820d\u697c\u4e0b",
        soldText: "52\u5355",
        amountText: "39.90",
        productCount: 1,
        banners: ["snack", "fruit", "snack"],
        products: [{ id: "p1", name: "\u5bbf\u820d\u8865\u7ed9\u7ec4\u5408", desc: "\u996e\u6599 / \u8584\u7247 / \u7eb8\u5dfe", price: "\u00a539.9", cover: "poster" }],
        status: TEXT.open
      },
      {
        detailId: "campus-food-1",
        ownerUserId: miniUser.id,
        school: SCHOOLS.tsinghua,
        name: "\u68a7\u6850\u98df\u5802",
        groupKey: "campus",
        groupLabel: TEXT.campusStore,
        sectionKey: "canteen",
        sectionLabel: "\u98df\u5802\u9910\u996e",
        subtitle: "\u65e9\u9910 / \u7b80\u9910 / \u76d6\u996d",
        rating: 4.9,
        monthlySales: "8700",
        distance: "\u6821\u5185\u98df\u5802",
        delivery: "\u53ef\u7528\u6821\u56ed\u5361",
        priceText: "\u5802\u98df\u4e3a\u4e3b",
        tags: ["\u5b98\u65b9\u8ba4\u8bc1", "\u65e9\u9910\u4f9b\u5e94"],
        badge: "\u8ba4\u8bc1",
        cover: "store-canteen",
        title: "\u5e97\u94fa\u4e3b\u9875",
        notice: "\u6821\u5185\u9910\u996e\u5b98\u65b9\u8ba4\u8bc1\uff0c\u53ef\u7528\u6821\u56ed\u5361\u7ed3\u7b97\uff0c\u4ece\u65e9\u9910\u5230\u665a\u9910\u5747\u4f9b\u5e94\u3002",
        phone: "010-88997766",
        address: "\u5317\u4eac\u5e02\u6d77\u6dc0\u533a\u6e05\u534e\u5927\u5b66\u68a7\u6850\u98df\u5802 1 \u5c42",
        soldText: "81\u4ef6",
        amountText: "22.00",
        productCount: 1,
        banners: ["canteen", "takeout", "canteen"],
        products: [{ id: "p1", name: "\u62db\u724c\u5957\u9910\u996d", desc: "\u70ed\u83dc / \u7c73\u996d / \u4f8b\u6c64", price: "\u00a522", cover: "poster" }],
        status: TEXT.open
      },
      {
        detailId: "off-food-1",
        school: SCHOOLS.gzu,
        name: "\u82b1\u6eaa\u5c0f\u9986",
        groupKey: "offCampus",
        groupLabel: TEXT.offCampusStore,
        sectionKey: "restaurant",
        sectionLabel: "\u9910\u996e\u7f8e\u98df",
        subtitle: "\u76d6\u996d / \u7092\u996d / \u5c0f\u7092",
        rating: 4.6,
        monthlySales: "3200",
        distance: "\u8ddd\u79bb 280m",
        delivery: "\u6ee1\u51cf\u6d3b\u52a8",
        priceText: "\u8d77\u9001 20\u5143",
        tags: ["\u70ed\u5356\u7b80\u9910", "\u665a\u9910\u70ed\u95e8"],
        badge: "\u70ed\u5356",
        cover: "store-sichuan",
        title: "\u5e97\u94fa\u4e3b\u9875",
        notice: "\u6821\u5916\u70ed\u5356\u5bb6\u5e38\u83dc\u5c0f\u9986\uff0c\u9002\u5408\u805a\u9910\u548c\u5916\u5356\u70b9\u5355\u3002",
        phone: "0851-88551220",
        address: "\u8d35\u5dde\u7701\u8d35\u9633\u5e02\u82b1\u6eaa\u533a\u5927\u5b66\u57ce\u5546\u4e1a\u8857 16 \u53f7",
        soldText: "46\u4ef6",
        amountText: "58.00",
        productCount: 1,
        banners: ["canteen", "takeout", "snack"],
        products: [{ id: "p1", name: "\u53cc\u4eba\u5957\u9910", desc: "\u76d6\u996d / \u7092\u996d / \u5c0f\u7092", price: "\u00a558", cover: "poster" }],
        status: TEXT.open
      },
      {
        detailId: "off-flower-1",
        school: SCHOOLS.liupanshui,
        name: "\u4e91\u4e0a\u82b1\u574a",
        groupKey: "offCampus",
        groupLabel: TEXT.offCampusStore,
        sectionKey: "flower",
        sectionLabel: "\u9c9c\u82b1\u793c\u54c1",
        subtitle: "\u9c9c\u82b1 / \u793c\u76d2 / \u5e03\u7f6e",
        rating: 4.8,
        monthlySales: "523",
        distance: "\u8ddd\u79bb 1.1km",
        delivery: "\u652f\u6301\u9884\u7ea6",
        priceText: "\u9c9c\u82b1\u793c\u76d2",
        tags: ["\u6bd5\u4e1a\u82b1\u675f", "\u8282\u65e5\u793c\u7269"],
        badge: "\u7cbe\u9009",
        cover: "store-flower",
        title: "\u5e97\u94fa\u4e3b\u9875",
        notice: "\u9c9c\u82b1\u82b1\u675f\u3001\u793c\u76d2\u548c\u6d3b\u52a8\u5e03\u7f6e\u5747\u652f\u6301\u63d0\u524d\u9884\u7ea6\u3002",
        phone: "18786690021",
        address: "\u8d35\u5dde\u7701\u516d\u76d8\u6c34\u5e02\u949f\u5c71\u533a\u5b66\u9662\u8def\u82b1\u827a\u8857 9 \u53f7",
        soldText: "11\u6761",
        amountText: "199.00",
        productCount: 1,
        banners: ["flower", "flower", "study"],
        products: [{ id: "p1", name: "\u8282\u65e5\u82b1\u675f\u793c\u76d2", desc: "\u9c9c\u82b1 / \u8d3a\u5361 / \u5305\u88c5", price: "\u00a5199", cover: "poster" }],
        status: TEXT.open
      }
    ]
  });

  await prisma.miniMessage.createMany({
    data: [
      {
        school: SCHOOLS.liupanshui,
        type: "system",
        category: TEXT.officialNotice,
        content: "\u516d\u76d8\u6c34\u5e08\u8303\u5b66\u9662\u521b\u4e1a\u5e97\u94fa\u6d3b\u52a8\u5468\u5df2\u5f00\u542f\uff0c\u672c\u5468\u65b0\u5e97\u63a8\u8350\u4f4d\u5df2\u4e0a\u7ebf\u3002",
        status: "\u5df2\u53d1\u9001",
        receiverUserId: null
      },
      {
        school: SCHOOLS.liupanshui,
        type: "system",
        category: TEXT.officialNotice,
        content: "\u516d\u76d8\u6c34\u5e08\u8303\u5b66\u9662\u5bbf\u820d\u8d85\u5e02\u665a\u95f4\u914d\u9001\u65f6\u6bb5\u8c03\u6574\u4e3a 22:30 \u524d\u3002",
        status: "\u5df2\u53d1\u9001",
        receiverUserId: null
      },
      {
        school: SCHOOLS.liupanshui,
        type: "interactive",
        category: TEXT.interactiveMessage,
        content: "\u516d\u76d8\u6c34\u5e08\u8303\u5b66\u9662\u6709 3 \u5bb6\u65b0\u5e97\u8fdb\u5165\u4f60\u5e38\u770b\u7684\u5206\u7c7b\u3002",
        status: "\u5df2\u53d1\u9001",
        receiverUserId: null
      },
      {
        school: SCHOOLS.pku,
        type: "system",
        category: TEXT.officialNotice,
        content: "\u5317\u4eac\u5927\u5b66\u5b66\u4e60\u8d44\u6599\u7c7b\u5e97\u94fa\u65b0\u589e\u6253\u5370\u670d\u52a1\u4e13\u533a\u3002",
        status: "\u5df2\u53d1\u9001",
        receiverUserId: null
      },
      {
        school: SCHOOLS.pku,
        type: "interactive",
        category: TEXT.interactiveMessage,
        content: "\u5317\u4eac\u5927\u5b66\u4f60\u5e38\u770b\u7684\u6587\u521b\u5e97\u94fa\u53d1\u5e03\u4e86\u65b0\u54c1\u901a\u77e5\u3002",
        status: "\u5df2\u53d1\u9001",
        receiverUserId: null
      },
      {
        school: SCHOOLS.tsinghua,
        type: "system",
        category: TEXT.officialNotice,
        content: "\u6e05\u534e\u5927\u5b66\u5bbf\u820d\u8865\u7ed9\u7ad9\u672c\u5468\u65b0\u589e\u65e9\u9910\u914d\u9001\u670d\u52a1\u3002",
        status: "\u5df2\u53d1\u9001",
        receiverUserId: null
      },
      {
        school: SCHOOLS.tsinghua,
        type: "interactive",
        category: TEXT.interactiveMessage,
        content: "\u6e05\u534e\u5927\u5b66\u4f60\u6536\u85cf\u7684\u6821\u5185\u9910\u5385\u53d1\u5e03\u4e86\u65b0\u7684\u5957\u9910\u6d3b\u52a8\u3002",
        status: "\u5df2\u53d1\u9001",
        receiverUserId: null
      },
      {
        school: SCHOOLS.gzu,
        type: "system",
        category: TEXT.officialNotice,
        content: "\u8d35\u5dde\u5927\u5b66\u6821\u5185\u9910\u996e\u5546\u5bb6\u672c\u5468\u5f00\u542f\u6ee1\u51cf\u6d3b\u52a8\u3002",
        status: "\u5df2\u53d1\u9001",
        receiverUserId: null
      },
      {
        school: SCHOOLS.gzu,
        type: "interactive",
        category: TEXT.interactiveMessage,
        content: "\u8d35\u5dde\u5927\u5b66\u4f60\u6536\u85cf\u7684\u4fbf\u5229\u5e97\u53d1\u5e03\u4e86\u65b0\u7684\u591c\u95f4\u8865\u8d27\u63d0\u9192\u3002",
        status: "\u5df2\u53d1\u9001",
        receiverUserId: null
      }
    ]
  });

  await prisma.miniShopApply.createMany({
    data: [
      {
        userId: miniUser.id,
        school: SCHOOLS.tsinghua,
        storeName: "梧桐餐厅",
        category: "校内商家",
        contactName: "林知夏",
        contactPhone: "13800010001",
        description: "主营校内餐饮、早餐套餐和堂食取餐服务，支持校园卡结算。",
        status: "已通过",
        reviewNote: "已通过审核，可进入商家中心管理店铺和商品。",
        reviewedAt: new Date("2026-04-09T15:30:00+08:00")
      }
    ]
  });

  await prisma.miniFavorite.createMany({
    data: [
      {
        userId: miniUser.id,
        targetType: "post",
        targetId: "1",
        school: SCHOOLS.tsinghua
      },
      {
        userId: miniUser.id,
        targetType: "store",
        targetId: "campus-food-1",
        school: SCHOOLS.tsinghua
      }
    ]
  });

  await prisma.miniPostLike.createMany({
    data: [
      {
        postId: 1,
        userId: miniUser.id
      },
      {
        postId: 2,
        userId: miniUser.id
      }
    ]
  });

  await prisma.miniPostComment.createMany({
    data: [
      {
        postId: 1,
        userId: miniUser.id,
        content: "\u6211\u4e5f\u5728\u4e1c\u533a\uff0c\u53ef\u4ee5\u4e00\u8d77\u62fc\u996d\u3002"
      },
      {
        postId: 1,
        userId: miniUser.id,
        content: "\u5df2\u7ecf\u79c1\u4fe1\u4f60\u4e86\uff0c\u665a\u4e0a\u89c1\u3002"
      },
      {
        postId: 2,
        userId: miniUser.id,
        content: "\u6211\u6709\u4e00\u4e9b\u4e8c\u624b\u4e66\u548c\u8003\u7814\u8d44\u6599\uff0c\u53ef\u4ee5\u4e00\u8d77\u6446\u6454\u3002"
      }
    ]
  });

  await prisma.miniPost.update({
    where: { id: 1 },
    data: {
      likeCount: 1,
      commentCount: 2,
      viewCount: 36
    }
  });

  await prisma.miniPost.update({
    where: { id: 2 },
    data: {
      likeCount: 1,
      commentCount: 1,
      viewCount: 18
    }
  });

  await prisma.miniPost.update({
    where: { id: 3 },
    data: {
      likeCount: 0,
      commentCount: 0,
      viewCount: 12
    }
  });

  const seededPosts = await prisma.miniPost.findMany({
    where: {
      userId: miniUser.id
    },
    orderBy: {
      id: "asc"
    }
  });

  await prisma.miniPostReport.createMany({
    data: [
      {
        reportNo: "JB202604130001",
        postId: seededPosts[0]?.id || 1,
        reporterUserId: miniUser.id,
        school: SCHOOLS.tsinghua,
        reason: "疑似广告",
        detail: "标题和正文重复引流信息，疑似营销内容。",
        status: "待处理",
        createdAt: new Date("2026-04-13T09:30:00+08:00")
      },
      {
        reportNo: "JB202604120014",
        postId: seededPosts[1]?.id || 2,
        reporterUserId: miniUser.id,
        school: SCHOOLS.pku,
        reason: "信息不实",
        detail: "活动时间与实际通知不一致，存在误导。",
        status: "已处理",
        reviewNote: "已核实并下架相关内容。",
        reviewerId: superAdmin.id,
        reviewedAt: new Date("2026-04-12T18:20:00+08:00"),
        createdAt: new Date("2026-04-12T17:05:00+08:00")
      },
      {
        reportNo: "JB202604110003",
        postId: seededPosts[2]?.id || 3,
        reporterUserId: miniUser.id,
        school: SCHOOLS.fudan,
        reason: "重复发帖",
        detail: "同一内容短时间内重复发布，影响浏览体验。",
        status: "已驳回",
        reviewNote: "经核查为不同活动招募，保留内容。",
        reviewerId: superAdmin.id,
        reviewedAt: new Date("2026-04-11T15:40:00+08:00"),
        createdAt: new Date("2026-04-11T14:20:00+08:00")
      }
    ]
  });

  await prisma.miniAddress.createMany({
    data: [
      {
        userId: miniUser.id,
        school: SCHOOLS.tsinghua,
        receiverName: "林知夏",
        phone: "13800010001",
        detail: "清华大学 东区宿舍 8 号楼 302",
        tag: "默认地址",
        isDefault: true
      },
      {
        userId: miniUser.id,
        school: SCHOOLS.tsinghua,
        receiverName: "林知夏",
        phone: "13800010001",
        detail: "清华大学 图书馆南门自提点",
        tag: "自提地址",
        isDefault: false
      }
    ]
  });

  await prisma.miniOrder.createMany({
    data: [
      {
        orderNo: "202604120001",
        userId: miniUser.id,
        school: SCHOOLS.tsinghua,
        storeDetailId: "campus-food-1",
        storeName: "\u68a7\u6850\u98df\u5802",
        productId: "p1",
        productName: "\u62db\u724c\u5957\u9910\u996d",
        productDesc: "\u70ed\u83dc / \u7c73\u996d / \u4f8b\u6c64",
        productCover: "poster",
        unitPrice: 22,
        quantity: 1,
        amount: 22,
        status: "\u8fdb\u884c\u4e2d",
        payStatus: "\u5df2\u652f\u4ed8",
        receiverName: "\u6797\u77e5\u590f",
        receiverPhone: "13800010001",
        receiverAddress: "\u6e05\u534e\u5927\u5b66 \u4e1c\u533a\u5bbf\u820d 8 \u53f7\u697c 302",
        addressTag: "\u9ed8\u8ba4\u5730\u5740",
        paidAt: new Date("2026-04-12T11:20:00+08:00")
      },
      {
        orderNo: "202604120002",
        userId: miniUser.id,
        school: SCHOOLS.tsinghua,
        storeDetailId: "campus-food-1",
        storeName: "\u68a7\u6850\u98df\u5802",
        productId: "p1",
        productName: "\u62db\u724c\u5957\u9910\u996d",
        productDesc: "\u70ed\u83dc / \u7c73\u996d / \u4f8b\u6c64",
        productCover: "poster",
        unitPrice: 22,
        quantity: 1,
        amount: 22,
        status: "\u5f85\u652f\u4ed8",
        payStatus: "\u5f85\u652f\u4ed8",
        receiverName: "\u6797\u77e5\u590f",
        receiverPhone: "13800010001",
        receiverAddress: "\u6e05\u534e\u5927\u5b66 \u56fe\u4e66\u9986\u5357\u95e8\u81ea\u63d0\u70b9",
        addressTag: "\u81ea\u63d0\u5730\u5740"
      },
      {
        orderNo: "202604120003",
        userId: miniUser.id,
        school: SCHOOLS.tsinghua,
        storeDetailId: "campus-food-1",
        storeName: "\u68a7\u6850\u98df\u5802",
        productId: "p1",
        productName: "\u62db\u724c\u5957\u9910\u996d",
        productDesc: "\u70ed\u83dc / \u7c73\u996d / \u4f8b\u6c64",
        productCover: "poster",
        unitPrice: 22,
        quantity: 2,
        amount: 44,
        status: "\u5df2\u5b8c\u6210",
        payStatus: "\u5df2\u652f\u4ed8",
        receiverName: "\u6797\u77e5\u590f",
        receiverPhone: "13800010001",
        receiverAddress: "\u6e05\u534e\u5927\u5b66 \u4e1c\u533a\u5bbf\u820d 8 \u53f7\u697c 302",
        addressTag: "\u9ed8\u8ba4\u5730\u5740",
        paidAt: new Date("2026-04-11T18:30:00+08:00"),
        finishedAt: new Date("2026-04-11T19:00:00+08:00")
      }
    ]
  });

  const seededOrders = await prisma.miniOrder.findMany({
    where: {
      userId: miniUser.id
    },
    orderBy: {
      id: "asc"
    }
  });

  await prisma.miniRefundRecord.createMany({
    data: [
      {
        refundNo: "TK202604130001",
        orderId: seededOrders[0]?.id || 1,
        userId: miniUser.id,
        school: SCHOOLS.tsinghua,
        amount: 22,
        reason: "商家缺货未发货",
        status: "待审核",
        applyTime: new Date("2026-04-13T09:40:00+08:00")
      },
      {
        refundNo: "TK202604120014",
        orderId: seededOrders[2]?.id || 3,
        userId: miniUser.id,
        school: SCHOOLS.tsinghua,
        amount: 44,
        reason: "用户下单后申请退款",
        status: "已通过",
        reviewNote: "已同意退款，等待原路返回。",
        reviewerId: superAdmin.id,
        applyTime: new Date("2026-04-12T19:10:00+08:00"),
        reviewedAt: new Date("2026-04-12T20:00:00+08:00")
      }
    ]
  });

  await prisma.miniWalletAccount.create({
    data: {
      userId: miniUser.id,
      school: SCHOOLS.tsinghua,
      accountName: "\u6797\u77e5\u590f",
      status: "\u6b63\u5e38",
      balance: 328.5,
      frozenAmount: 88,
      withdrawableAmount: 240.5,
      totalIncome: 1260,
      totalWithdrawn: 931.5
    }
  });

  await prisma.miniWithdrawRecord.createMany({
    data: [
      {
        withdrawNo: "TX202604120001",
        userId: miniUser.id,
        school: SCHOOLS.tsinghua,
        accountName: "\u6797\u77e5\u590f",
        amount: 120,
        accountType: "\u5fae\u4fe1\u96f6\u94b1",
        accountNo: "13800010001",
        status: "\u5df2\u901a\u8fc7",
        reviewNote: "\u5df2\u6253\u6b3e",
        applyTime: new Date("2026-04-10T10:00:00+08:00"),
        reviewedAt: new Date("2026-04-10T11:00:00+08:00")
      },
      {
        withdrawNo: "TX202604120002",
        userId: miniUser.id,
        school: SCHOOLS.tsinghua,
        accountName: "\u6797\u77e5\u590f",
        amount: 88,
        accountType: "\u5fae\u4fe1\u96f6\u94b1",
        accountNo: "13800010001",
        status: "\u5f85\u5ba1\u6838",
        applyTime: new Date("2026-04-12T09:30:00+08:00")
      }
    ]
  });

  await prisma.schoolContent.createMany({
    data: [
      { school: SCHOOLS.tsinghua, userCount: 2360, postCount: 1280, storeCount: 42, orderCount: 1386, gmv: 86520, verifyPassRate: "84.6%", status: TEXT.enabled },
      { school: SCHOOLS.pku, userCount: 2140, postCount: 1156, storeCount: 39, orderCount: 1222, gmv: 79260, verifyPassRate: "82.3%", status: TEXT.enabled },
      { school: SCHOOLS.fudan, userCount: 1985, postCount: 1046, storeCount: 37, orderCount: 1088, gmv: 68410, verifyPassRate: "81.2%", status: TEXT.disabled }
    ]
  });

  await prisma.userPublishRecord.createMany({
    data: [
      { school: SCHOOLS.tsinghua, user: "\u6797\u77e5\u590f", type: "\u5e16\u5b50", title: "\u6e05\u534e\u98df\u5802\u665a\u9910\u62fc\u996d", status: TEXT.published },
      { school: SCHOOLS.pku, user: "\u5468\u4ee5\u5b89", type: "\u5546\u54c1", title: "\u71d5\u56ed\u591c\u5bb5\u5957\u9910", status: TEXT.onSale },
      { school: SCHOOLS.fudan, user: "\u9648\u9e3f\u7fbd", type: "\u5e97\u94fa", title: "\u65e6\u82d1\u624b\u4f5c\u5496\u5561", status: TEXT.pending }
    ]
  });

  await prisma.productSpec.createMany({
    data: [
      { school: SCHOOLS.tsinghua, storeName: "\u6e05\u56ed\u9c9c\u679c\u94fa", productName: "\u9c9c\u5207\u897f\u74dc\u676f", specGroup: "\u89c4\u683c", specValue: "\u5927\u676f", price: 12.8, stock: 68, status: TEXT.enabled },
      { school: SCHOOLS.tsinghua, storeName: "\u6e05\u56ed\u9c9c\u679c\u94fa", productName: "\u9c9c\u5207\u897f\u74dc\u676f", specGroup: "\u89c4\u683c", specValue: "\u5c0f\u676f", price: 9.9, stock: 98, status: TEXT.enabled },
      { school: SCHOOLS.pku, storeName: "\u672a\u540d\u591c\u5bb5\u7ad9", productName: "\u537f\u5473\u591c\u5bb5\u5957\u9910", specGroup: "\u8fa3\u5ea6", specValue: "\u5fae\u8fa3", price: 26.0, stock: 35, status: TEXT.disabled }
    ]
  });

  await prisma.adminMessageTemplate.createMany({
    data: [
      {
        code: "system_store_notice",
        name: "店铺通知模板",
        school: "全部高校",
        channel: "小程序站内信",
        status: TEXT.enabled,
        content: "您的店铺申请状态已更新，请前往店铺中心查看详情。",
        remark: "用于店铺申请与店铺状态变更通知"
      },
      {
        code: "system_order_notice",
        name: "订单通知模板",
        school: "全部高校",
        channel: "小程序站内信",
        status: TEXT.enabled,
        content: "您的订单状态已更新，请及时关注配送与收货信息。",
        remark: "用于下单、支付、配送、完成等节点提醒"
      },
      {
        code: "system_wallet_notice",
        name: "钱包提现模板",
        school: "全部高校",
        channel: "小程序站内信",
        status: TEXT.enabled,
        content: "您的提现申请结果已更新，请前往钱包页查看明细。",
        remark: "用于提现申请与审核结果通知"
      },
      {
        code: "system_verify_notice",
        name: "校园认证模板",
        school: "全部高校",
        channel: "小程序站内信",
        status: TEXT.disabled,
        content: "您的校园认证结果已更新，请前往认证中心查看。",
        remark: "用于学生认证审核结果通知"
      }
    ]
  });

  await prisma.adminSearchWord.createMany({
    data: [
      { school: SCHOOLS.tsinghua, keyword: "宿舍零食", searchCount: 1820, sort: 1, status: TEXT.enabled },
      { school: SCHOOLS.pku, keyword: "考研资料", searchCount: 1650, sort: 2, status: TEXT.enabled },
      { school: SCHOOLS.fudan, keyword: "校园跑腿", searchCount: 1430, sort: 3, status: TEXT.enabled },
      { school: SCHOOLS.liupanshui, keyword: "宿舍超市", searchCount: 980, sort: 4, status: TEXT.disabled }
    ]
  });

  await prisma.adminHelpArticle.createMany({
    data: [
      {
        category: "新手指南",
        title: "如何完成校园认证",
        school: "全部高校",
        status: "发布中",
        content: "进入小程序我的页面，点击去认证，填写姓名、手机号和学校即可完成认证。",
        sort: 1
      },
      {
        category: "商家入驻",
        title: "如何提交店铺入驻申请",
        school: "全部高校",
        status: "发布中",
        content: "进入创业店铺页，点击申请开店，填写店铺名称、分类、联系人和经营说明后提交审核。",
        sort: 2
      },
      {
        category: "订单售后",
        title: "订单取消与退款说明",
        school: "全部高校",
        status: "发布中",
        content: "待支付订单可直接取消，已支付订单请在订单详情中申请退款并填写原因。",
        sort: 3
      },
      {
        category: "钱包提现",
        title: "提现审核规则说明",
        school: "全部高校",
        status: "草稿",
        content: "钱包余额满足最低提现金额后可申请提现，平台将在 1-3 个工作日内完成审核。",
        sort: 4
      }
    ]
  });

  await prisma.adminBannerConfig.createMany({
    data: [
      {
        title: "新生认证季活动",
        position: "首页顶部",
        school: SCHOOLS.tsinghua,
        imageUrl: "https://example.com/banner/auth-season.png",
        linkUrl: "/pages/verify/verify",
        sort: 1,
        status: TEXT.enabled,
        remark: "首页顶部轮播"
      },
      {
        title: "创业店铺招募令",
        position: "店铺频道",
        school: SCHOOLS.pku,
        imageUrl: "https://example.com/banner/store-recruit.png",
        linkUrl: "/pages/shop-apply/shop-apply",
        sort: 2,
        status: TEXT.enabled,
        remark: "创业店铺频道活动图"
      },
      {
        title: "校园跑腿服务周",
        position: "消息页弹层",
        school: SCHOOLS.fudan,
        imageUrl: "https://example.com/banner/errand-week.png",
        linkUrl: "/pages/message/message",
        sort: 3,
        status: TEXT.disabled,
        remark: "消息页活动弹层"
      }
    ]
  });

  await prisma.adminRecommendConfig.createMany({
    data: [
      {
        title: "春季热销零食合集",
        type: "商品推荐",
        school: SCHOOLS.tsinghua,
        targetName: "梧桐食堂热销专区",
        targetId: "campus-food-1",
        sort: 1,
        status: TEXT.enabled,
        remark: "首页商品推荐位"
      },
      {
        title: "认证用户优选店铺",
        type: "店铺推荐",
        school: SCHOOLS.pku,
        targetName: "考研资料铺",
        targetId: "student-study-1",
        sort: 2,
        status: TEXT.enabled,
        remark: "店铺频道推荐位"
      },
      {
        title: "校园活动精选帖子",
        type: "帖子推荐",
        school: SCHOOLS.fudan,
        targetName: "复旦南区跑步搭子集合",
        targetId: "3",
        sort: 3,
        status: TEXT.disabled,
        remark: "首页帖子推荐位"
      }
    ]
  });

  await prisma.adminSystemConfig.createMany({
    data: [
      {
        sectionKey: "platform",
        sectionTitle: "平台信息",
        configKey: "platform_name",
        label: "平台名称",
        value: "校园通",
        valueType: "text",
        sort: 1,
        status: TEXT.enabled
      },
      {
        sectionKey: "platform",
        sectionTitle: "平台信息",
        configKey: "service_phone",
        label: "客服电话",
        value: "400-800-2026",
        valueType: "text",
        sort: 2,
        status: TEXT.enabled
      },
      {
        sectionKey: "platform",
        sectionTitle: "平台信息",
        configKey: "service_wechat",
        label: "客服微信",
        value: "xiaoyuantongkf",
        valueType: "text",
        sort: 3,
        status: TEXT.enabled
      },
      {
        sectionKey: "business",
        sectionTitle: "业务开关",
        configKey: "post_review",
        label: "帖子发布审核",
        value: "true",
        valueType: "switch",
        sort: 1,
        status: TEXT.enabled
      },
      {
        sectionKey: "business",
        sectionTitle: "业务开关",
        configKey: "store_review",
        label: "店铺入驻审核",
        value: "true",
        valueType: "switch",
        sort: 2,
        status: TEXT.enabled
      },
      {
        sectionKey: "business",
        sectionTitle: "业务开关",
        configKey: "product_review",
        label: "商品上架审核",
        value: "true",
        valueType: "switch",
        sort: 3,
        status: TEXT.enabled
      },
      {
        sectionKey: "business",
        sectionTitle: "业务开关",
        configKey: "message_notice",
        label: "站内消息通知",
        value: "true",
        valueType: "switch",
        sort: 4,
        status: TEXT.enabled
      },
      {
        sectionKey: "trade",
        sectionTitle: "交易规则",
        configKey: "withdraw_min",
        label: "最低提现金额",
        value: "100",
        valueType: "text",
        suffix: "元",
        sort: 1,
        status: TEXT.enabled
      },
      {
        sectionKey: "trade",
        sectionTitle: "交易规则",
        configKey: "service_rate",
        label: "平台服务费率",
        value: "2",
        valueType: "text",
        suffix: "%",
        sort: 2,
        status: TEXT.enabled
      },
      {
        sectionKey: "trade",
        sectionTitle: "交易规则",
        configKey: "auto_close_minute",
        label: "订单自动关闭",
        value: "15",
        valueType: "text",
        suffix: "分钟",
        sort: 3,
        status: TEXT.enabled
      }
    ]
  });

  const storeType = await prisma.adminDictType.create({
    data: {
      name: "店铺分类",
      code: "store_category",
      status: TEXT.enabled,
      remark: "创业店铺一级分类",
      sort: 1
    }
  });

  const postType = await prisma.adminDictType.create({
    data: {
      name: "帖子分类",
      code: "post_category",
      status: TEXT.enabled,
      remark: "首页帖子业务分类",
      sort: 2
    }
  });

  const channelType = await prisma.adminDictType.create({
    data: {
      name: "消息渠道",
      code: "message_channel",
      status: TEXT.enabled,
      remark: "后台消息发送渠道",
      sort: 3
    }
  });

  await prisma.adminDictItem.createMany({
    data: [
      { typeId: storeType.id, label: "学生商家", value: "student_store", sort: 1, status: TEXT.enabled, remark: "学生个人经营" },
      { typeId: storeType.id, label: "宿舍超市", value: "dorm_store", sort: 2, status: TEXT.enabled, remark: "宿舍便利零售" },
      { typeId: storeType.id, label: "校内商家", value: "campus_store", sort: 3, status: TEXT.enabled, remark: "校内门店或档口" },
      { typeId: storeType.id, label: "校外商家", value: "offcampus_store", sort: 4, status: TEXT.enabled, remark: "校外商家配送入校" },
      { typeId: postType.id, label: "校园互助", value: "campus_help", sort: 1, status: TEXT.enabled, remark: "求助、跑腿、拼单" },
      { typeId: postType.id, label: "二手交易", value: "used_market", sort: 2, status: TEXT.enabled, remark: "闲置、转卖、求购" },
      { typeId: postType.id, label: "校园社交", value: "campus_social", sort: 3, status: TEXT.enabled, remark: "交友、活动、招募" },
      { typeId: channelType.id, label: "站内信", value: "site", sort: 1, status: TEXT.enabled, remark: "仅站内消息" },
      { typeId: channelType.id, label: "短信", value: "sms", sort: 2, status: TEXT.enabled, remark: "仅短信通知" },
      { typeId: channelType.id, label: "站内信+短信", value: "site_sms", sort: 3, status: TEXT.enabled, remark: "双通道通知" }
    ]
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
