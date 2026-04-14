import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { getAdminSchoolScope } from "./admin-scope.service";

interface BannerItem {
  id: number;
  tag: string;
  title: string;
  desc: string;
  cta: string;
}

const SCHOOLS = {
  current: "当前高校",
  liupanshui: "六盘水师范学院",
  pku: "北京大学",
  tsinghua: "清华大学",
  fudan: "复旦大学",
  gzu: "贵州大学"
};

const STATUS = {
  open: "营业中"
};

const PRODUCT_STATUS = {
  onSale: "已上架"
};

function toArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function buildSchoolWhere(scope: Awaited<ReturnType<typeof getAdminSchoolScope>>, school: string) {
  if (scope.isAll) {
    return school || undefined;
  }

  if (school) {
    return scope.schools.includes(school) ? school : "__no_school__";
  }

  return {
    in: scope.schools
  };
}

function mapStoreListItem(item: any) {
  const products = toArray(item.products);
  const recommendedProduct = products.find(
    (entry: any) => !!entry?.recommended && String(entry.status || PRODUCT_STATUS.onSale) === PRODUCT_STATUS.onSale
  ) as any;

  return {
    id: item.id,
    detailId: item.detailId,
    name: item.name,
    school: item.school,
    rating: item.rating,
    monthlySales: item.monthlySales,
    distance: item.distance,
    delivery: item.delivery,
    price: item.priceText,
    tags: toArray(item.tags).map((entry) => String(entry)),
    badge: item.badge,
    cover: item.cover,
    subtitle: item.subtitle,
    hasRecommendedProduct: products.some(
      (entry: any) => !!entry?.recommended && String(entry.status || PRODUCT_STATUS.onSale) === PRODUCT_STATUS.onSale
    ),
    recommendedProductName: recommendedProduct ? String(recommendedProduct.name || "") : "",
    recommendedProductPrice: recommendedProduct ? String(recommendedProduct.price || "") : "",
    groupKey: item.groupKey,
    groupLabel: item.groupLabel,
    sectionKey: item.sectionKey,
    sectionLabel: item.sectionLabel
  };
}

function mapStoreDetail(item: any) {
  const cover = item.cover || "";
  const products = toArray(item.products)
    .filter((entry: any) => (entry?.status ? String(entry.status) === PRODUCT_STATUS.onSale : true))
    .map((entry: any) => ({
      id: entry.id,
      name: entry.name,
      desc: entry.desc,
      price: entry.price,
      cover: entry.cover,
      stock: Number(entry.stock || 0),
      dailyLimit: Number(entry.dailyLimit || 0),
      recommended: !!entry.recommended
    }));

  return {
    title: item.title,
    storeName: item.name,
    cover,
    notice: item.notice,
    phone: item.phone,
    address: item.address,
    stats: {
      sold: item.soldText,
      amount: item.amountText,
      count: products.length
    },
    banners: (cover ? [cover] : []).concat(toArray(item.banners).map((entry) => String(entry))),
    products
  };
}

function mapAdminStoreItem(item: any) {
  const products = toArray(item.products);
  const recommendedCount = products.filter((entry: any) => !!entry?.recommended).length;

  return {
    id: item.id,
    detailId: item.detailId,
    storeName: item.name,
    owner: item.ownerUser?.nickname || "-",
    ownerPhone: item.ownerUser?.phone || "",
    school: item.school,
    category: item.groupLabel,
    section: item.sectionLabel,
    status: item.status,
    recommend: recommendedCount > 0 ? "推荐中" : "未推荐",
    goodsCount: products.length,
    rating: item.rating,
    createdAt: item.createdAt
  };
}

function buildBannerList(school: string) {
  const fallback: BannerItem = {
    id: 1,
    tag: "平台推荐",
    title: `${school}创业店铺推荐`,
    desc: "精选学生商家、宿舍超市、校内商家和校外商家，优先展示当前高校的创业店铺。",
    cta: "查看更多"
  };

  const schoolMap: Record<string, BannerItem> = {
    [SCHOOLS.liupanshui]: {
      id: 1,
      tag: "本校推荐",
      title: "六盘水师范学院创业店铺推荐",
      desc: "围绕宿舍配送、校内餐饮和学生服务，优先展示本校热门创业店铺。",
      cta: "查看本校热榜"
    },
    [SCHOOLS.pku]: {
      id: 1,
      tag: "燕园精选",
      title: "北京大学创业店铺热榜",
      desc: "优先展示学习资料、轻食咖啡和校内文创等热门创业店铺。",
      cta: "查看燕园推荐"
    },
    [SCHOOLS.tsinghua]: {
      id: 1,
      tag: "清华推荐",
      title: "清华大学创业店铺优选",
      desc: "围绕宿舍补给、校内餐饮和跑腿代取的热门店铺推荐。",
      cta: "查看清华热卖"
    },
    [SCHOOLS.fudan]: {
      id: 1,
      tag: "复旦推荐",
      title: "复旦大学创业店铺精选",
      desc: "优先展示校外餐饮、生活服务和学生自营店铺。",
      cta: "查看复旦精选"
    },
    [SCHOOLS.gzu]: {
      id: 1,
      tag: "贵大推荐",
      title: "贵州大学创业店铺推荐",
      desc: "优先展示校园餐饮、宿舍补给和校外生活服务热门商家。",
      cta: "查看贵大热卖"
    }
  };

  return [schoolMap[school] || fallback];
}

export async function queryMiniStores(rawQuery: Record<string, unknown>) {
  const school = String(rawQuery.school || "");
  const keyword = String(rawQuery.keyword || "").trim();
  const groupKey = String(rawQuery.groupKey || "");
  const sectionKey = String(rawQuery.sectionKey || "");

  const where = {
    school: school || undefined,
    groupKey: groupKey || undefined,
    sectionKey: sectionKey || undefined,
    status: STATUS.open,
    OR: keyword
      ? [
          { name: { contains: keyword, mode: "insensitive" as const } },
          { subtitle: { contains: keyword, mode: "insensitive" as const } },
          { notice: { contains: keyword, mode: "insensitive" as const } }
        ]
      : undefined
  };

  const list = await prisma.miniStore.findMany({
    where,
    orderBy: [{ groupKey: "asc" }, { id: "asc" }]
  });

  return {
    banners: buildBannerList(school || SCHOOLS.current),
    list: list.map(mapStoreListItem)
  };
}

export async function getMiniStoreDetail(detailId: string) {
  const row = await prisma.miniStore.findUniqueOrThrow({
    where: { detailId }
  });
  return mapStoreDetail(row);
}

export async function queryAdminStoreList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const category = String(rawQuery.category || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const where = {
    school: buildSchoolWhere(scope, school),
    groupLabel: category || undefined,
    OR: keyword
      ? [
          { name: { contains: keyword, mode: "insensitive" as const } },
          { ownerUser: { is: { nickname: { contains: keyword, mode: "insensitive" as const } } } }
        ]
      : undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.miniStore.count({ where }),
    prisma.miniStore.findMany({
      where,
      include: {
        ownerUser: {
          select: {
            nickname: true,
            phone: true
          }
        }
      },
      orderBy: { id: "desc" },
      skip,
      take: pageSize
    })
  ]);

  return {
    list: list.map(mapAdminStoreItem),
    page,
    pageSize,
    total
  };
}
