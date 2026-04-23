import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { getAdminSchoolScope } from "./admin-scope.service";

function paginateList<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
}

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

export async function queryAdminProductList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const category = String(rawQuery.category || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scope = await getAdminSchoolScope(adminUserId);

  const stores = await prisma.miniStore.findMany({
    where: {
      school: buildSchoolWhere(scope, school)
    },
    orderBy: { id: "desc" }
  });

  const mapped = stores.flatMap((store: any) =>
    toArray(store.products).map((product: any) => ({
      id: `${store.id}-${product.id}`,
      storeId: store.id,
      storeDetailId: store.detailId,
      productId: String(product.id || ""),
      name: String(product.name || ""),
      storeName: store.name,
      school: store.school,
      category: store.sectionLabel,
      price: Number(String(product.price || "").replace(/[^\d.]/g, "") || 0),
      stock: Number(product.stock || 0),
      sales: Number(store.monthlySales || 0),
      status: String(product.status || "已上架")
    }))
  );

  const filtered = mapped.filter((item: any) => {
    const matchKeyword = !keyword || item.name.includes(keyword) || item.storeName.includes(keyword);
    const matchCategory = !category || item.category === category;
    const matchStatus = !status || item.status === status;
    return matchKeyword && matchCategory && matchStatus;
  });

  return {
    list: paginateList(filtered, page, pageSize),
    page,
    pageSize,
    total: filtered.length,
    summary: {
      total: filtered.length,
      onSaleCount: filtered.filter((item: any) => item.status === "已上架").length,
      pendingCount: filtered.filter((item: any) => item.status === "待审核").length,
      totalSales: filtered.reduce((sum: number, item: any) => sum + item.sales, 0),
      schoolOptions: [...new Set(mapped.map((item: any) => item.school))],
      categoryOptions: [...new Set(mapped.map((item: any) => item.category))]
    }
  };
}
