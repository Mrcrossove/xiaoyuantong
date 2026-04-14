import { prisma } from "../lib/prisma";

type FavoriteTargetType = "post" | "store";

interface ToggleFavoritePayload {
  targetType: FavoriteTargetType;
  targetId: string;
  school: string;
}

function normalizeTargetId(targetType: FavoriteTargetType, targetId: string) {
  return targetType === "post" ? String(Number(targetId)) : String(targetId);
}

export async function toggleMiniFavorite(userId: number, payload: ToggleFavoritePayload) {
  const targetId = normalizeTargetId(payload.targetType, payload.targetId);
  const existing = await prisma.miniFavorite.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType: payload.targetType,
        targetId
      }
    }
  });

  if (existing) {
    await prisma.miniFavorite.delete({
      where: { id: existing.id }
    });

    return {
      favorite: false
    };
  }

  await prisma.miniFavorite.create({
    data: {
      userId,
      targetType: payload.targetType,
      targetId,
      school: payload.school
    }
  });

  return {
    favorite: true
  };
}

export async function getMiniFavoriteStatus(userId: number, targetType: FavoriteTargetType, rawTargetId: string) {
  const targetId = normalizeTargetId(targetType, rawTargetId);
  const existing = await prisma.miniFavorite.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType,
        targetId
      }
    }
  });

  return {
    favorite: !!existing
  };
}

export async function queryMiniFavoriteList(userId: number, rawQuery: Record<string, unknown>) {
  const targetType = String(rawQuery.targetType || "");
  const where = {
    userId,
    targetType: targetType || undefined
  };

  const list = await prisma.miniFavorite.findMany({
    where,
    orderBy: { id: "desc" }
  });

  const postIds = list.filter((item: any) => item.targetType === "post").map((item: any) => Number(item.targetId));
  const storeIds = list.filter((item: any) => item.targetType === "store").map((item: any) => String(item.targetId));

  const [posts, stores] = await Promise.all([
    postIds.length
      ? prisma.miniPost.findMany({
          where: { id: { in: postIds } }
        })
      : Promise.resolve([]),
    storeIds.length
      ? prisma.miniStore.findMany({
          where: { detailId: { in: storeIds } }
        })
      : Promise.resolve([])
  ]);

  const postMap = new Map(posts.map((item: any) => [String(item.id), item]));
  const storeMap = new Map(stores.map((item: any) => [String(item.detailId), item]));

  const favoritePosts = list
    .filter((item: any) => item.targetType === "post")
    .map((item: any) => {
      const post: any = postMap.get(String(item.targetId));
      if (!post) return null;
      return {
        id: post.id,
        title: post.title,
        school: post.school,
        tag: post.category,
        time: item.createdAt.toISOString().slice(0, 16).replace("T", " ")
      };
    })
    .filter(Boolean);

  const favoriteShops = list
    .filter((item: any) => item.targetType === "store")
    .map((item: any) => {
      const store: any = storeMap.get(String(item.targetId));
      if (!store) return null;
      return {
        id: store.detailId,
        name: store.name,
        school: store.school,
        tags: Array.isArray(store.tags) ? store.tags : [],
        status: store.status
      };
    })
    .filter(Boolean);

  return {
    favoritePosts,
    favoriteShops
  };
}
