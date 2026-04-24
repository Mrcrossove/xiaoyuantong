import { prisma } from "../lib/prisma";

function normalizeSchool(value: unknown) {
  return String(value || "").trim();
}

export async function queryMiniHomeBannerList(rawQuery: Record<string, unknown>) {
  const school = normalizeSchool(rawQuery.school);

  if (!school) {
    return {
      list: []
    };
  }

  const rows = await prisma.adminBannerConfig.findMany({
    where: {
      school,
      position: "mini_home_top",
      status: "启用"
    },
    orderBy: [{ sort: "asc" }, { id: "desc" }]
  });

  return {
    list: rows.map((item) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.imageUrl || "",
      linkUrl: item.linkUrl || "",
      sort: item.sort
    }))
  };
}
