import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import type { MiniPostCommentCreatePayload, MiniPostPayload } from "../controllers/schemas";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { createMiniMessage } from "./mini-message.service";
import { assertRiskPassed } from "./risk-control.service";

const LABELS = {
  anonymousUser: "\u533f\u540d\u7528\u6237",
  campusUser: "\u6821\u56ed\u7528\u6237",
  pending: "\u5f85\u5ba1\u6838",
  published: "\u5df2\u53d1\u5e03"
};

const HOT_POST_FETCH_LIMIT = 240;
const HOT_POST_POOL_LIMIT = 120;

function toLikeText(value?: string) {
  if (!value) return undefined;
  return { contains: value, mode: "insensitive" as const };
}

function toArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function mapComment(item: any) {
  return {
    id: item.id,
    userId: item.userId,
    author: item.user?.nickname || LABELS.campusUser,
    content: item.content,
    time: formatDateTime(item.createdAt),
    createdAt: item.createdAt.toISOString()
  };
}

function mapPost(item: any, options?: { liked?: boolean; comments?: any[] }) {
  const comments = options?.comments || [];
  const authorAvatar = item.isAnonymous ? "" : item.user?.avatarUrl || "";
  return {
    id: item.id,
    userId: item.userId,
    author: item.isAnonymous ? LABELS.anonymousUser : item.authorName,
    authorName: item.authorName,
    authorAvatar,
    school: item.school,
    category: item.category,
    title: item.title,
    content: item.content,
    images: toArray(item.images).map((entry) => String(entry)),
    contact: toArray(item.contacts),
    anonymous: item.isAnonymous,
    onlyCampus: item.onlyCampus,
    status: item.status,
    time: formatDateTime(item.createdAt),
    createdAt: item.createdAt.toISOString(),
    likeCount: item.likeCount || 0,
    commentCount: item.commentCount || 0,
    viewCount: item.viewCount || 0,
    liked: !!options?.liked,
    comments
  };
}

function calcHeatScore(item: any) {
  const likeCount = Number(item.likeCount || 0);
  const commentCount = Number(item.commentCount || 0);
  const viewCount = Number(item.viewCount || 0);
  const createdAt = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt || Date.now());
  const ageHours = Math.max(0, (Date.now() - createdAt.getTime()) / 36e5);
  const freshnessWeight = Math.max(0.35, 1.2 - ageHours / (24 * 21));
  const baseScore = likeCount * 4 + commentCount * 6 + viewCount * 0.08;
  return Number((baseScore * freshnessWeight + Math.max(0, 24 - ageHours) * 0.6).toFixed(4));
}

function shuffleArray<T>(list: T[]) {
  const next = list.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
}

async function queryAllNetworkHotPosts(rawQuery: Record<string, unknown>, page: number, pageSize: number, skip: number) {
  const keyword = String(rawQuery.keyword || "").trim();
  const excludeSchool = String(rawQuery.excludeSchool || "").trim();
  const keywordWhere = keyword
    ? [{ title: toLikeText(keyword) }, { content: toLikeText(keyword) }, { category: toLikeText(keyword) }]
    : undefined;
  const baseWhere = {
    status: {
      in: [LABELS.published]
    },
    OR: keywordWhere
  };
  const primaryWhere = excludeSchool
    ? {
        ...baseWhere,
        school: {
          not: excludeSchool
        }
      }
    : baseWhere;

  const [primaryTotal, primaryList] = await prisma.$transaction([
    prisma.miniPost.count({ where: primaryWhere }),
    prisma.miniPost.findMany({
      where: primaryWhere,
      include: { user: { select: { avatarUrl: true } } },
      orderBy: [{ likeCount: "desc" }, { commentCount: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }],
      take: HOT_POST_FETCH_LIMIT
    })
  ]);

  let candidates = primaryList;
  let total = primaryTotal;

  if (excludeSchool && primaryList.length < pageSize) {
    const fallbackList = await prisma.miniPost.findMany({
      where: baseWhere,
      include: { user: { select: { avatarUrl: true } } },
      orderBy: [{ likeCount: "desc" }, { commentCount: "desc" }, { viewCount: "desc" }, { createdAt: "desc" }],
      take: HOT_POST_FETCH_LIMIT
    });
    const mergedMap = new Map<number, any>();
    primaryList.forEach((item: any) => mergedMap.set(item.id, item));
    fallbackList.forEach((item: any) => {
      if (!mergedMap.has(item.id)) {
        mergedMap.set(item.id, item);
      }
    });
    candidates = Array.from(mergedMap.values());
    total = mergedMap.size;
  }

  const rankedPool = candidates
    .map((item: any) => ({
      item,
      score: calcHeatScore(item)
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return right.item.id - left.item.id;
    })
    .slice(0, HOT_POST_POOL_LIMIT)
    .map((entry) => entry.item);

  return {
    list: shuffleArray(rankedPool).slice(skip, skip + pageSize).map((item: any) => mapPost(item)),
    page,
    pageSize,
    total
  };
}

async function findPostOrThrow(id: number) {
  const row = await prisma.miniPost.findUnique({
    where: { id }
  });
  if (!row) {
    throw new ApiError("\u5e16\u5b50\u4e0d\u5b58\u5728", ERROR_CODES.NOT_FOUND, 404);
  }
  return row;
}

export async function queryMiniPosts(rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const scope = String(rawQuery.scope || "school").trim() === "all" ? "all" : "school";
  const school = String(rawQuery.school || "");
  const keyword = String(rawQuery.keyword || "");

  if (scope === "all") {
    return queryAllNetworkHotPosts(rawQuery, page, pageSize, skip);
  }

  const where = {
    school: school || undefined,
    status: {
      in: [LABELS.published]
    },
    OR: keyword
      ? [{ title: toLikeText(keyword) }, { content: toLikeText(keyword) }, { category: toLikeText(keyword) }]
      : undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.miniPost.count({ where }),
    prisma.miniPost.findMany({
      where,
      include: { user: { select: { avatarUrl: true } } },
      orderBy: { id: "desc" },
      skip,
      take: pageSize
    })
  ]);

  return {
    list: list.map((item: any) => mapPost(item)),
    page,
    pageSize,
    total
  };
}

export async function getMiniPostDetail(id: number, userId?: number) {
  await prisma.miniPost.update({
    where: { id },
    data: {
      viewCount: {
        increment: 1
      }
    }
  });

  const [row, liked, comments] = await Promise.all([
    prisma.miniPost.findUnique({
      where: { id },
      include: { user: { select: { avatarUrl: true } } }
    }),
    userId
      ? prisma.miniPostLike.findUnique({
          where: {
            postId_userId: {
              postId: id,
              userId
            }
          }
        })
      : Promise.resolve(null),
    prisma.miniPostComment.findMany({
      where: { postId: id },
      include: {
        user: true
      },
      orderBy: { id: "asc" }
    })
  ]);

  if (!row) {
    throw new ApiError("\u5e16\u5b50\u4e0d\u5b58\u5728", ERROR_CODES.NOT_FOUND, 404);
  }

  return mapPost(row, {
    liked: !!liked,
    comments: comments.map(mapComment)
  });
}

export async function createMiniPost(userId: number, payload: MiniPostPayload) {
  await assertRiskPassed({
    userId,
    scene: "post_create",
    texts: [
      payload.school,
      payload.category,
      payload.title,
      payload.content,
      ...(payload.contacts || []).flatMap((item) => [item.label, item.value])
    ]
  });

  const user = await prisma.miniUser.findUniqueOrThrow({ where: { id: userId } });
  const row = await prisma.miniPost.create({
    data: {
      userId,
      school: payload.school,
      authorName: user.nickname || LABELS.campusUser,
      category: payload.category,
      title: payload.title,
      content: payload.content,
      images: payload.images,
      contacts: payload.contacts,
      isAnonymous: payload.anonymous,
      onlyCampus: payload.onlyCampus,
      status: LABELS.pending
    }
  });
  return mapPost(row);
}

export async function queryMyMiniPosts(userId: number) {
  const list = await prisma.miniPost.findMany({
    where: { userId },
    include: { user: { select: { avatarUrl: true } } },
    orderBy: { id: "desc" }
  });
  return list.map((item: any) => ({
    ...mapPost(item),
    statusText: item.status
  }));
}

export async function toggleMiniPostLike(userId: number, id: number) {
  const post = await findPostOrThrow(id);

  const existing = await prisma.miniPostLike.findUnique({
    where: {
      postId_userId: {
        postId: id,
        userId
      }
    }
  });

  if (existing) {
    await prisma.$transaction([
      prisma.miniPostLike.delete({
        where: { id: existing.id }
      }),
      prisma.miniPost.update({
        where: { id },
        data: {
          likeCount: {
            decrement: 1
          }
        }
      })
    ]);

    const row = await prisma.miniPost.findUniqueOrThrow({ where: { id } });
    return {
      liked: false,
      likeCount: row.likeCount
    };
  }

  await prisma.$transaction([
    prisma.miniPostLike.create({
      data: {
        postId: id,
        userId
      }
    }),
    prisma.miniPost.update({
      where: { id },
      data: {
        likeCount: {
          increment: 1
        }
      }
    })
  ]);

  const row = await prisma.miniPost.findUniqueOrThrow({ where: { id } });
  if (post.userId !== userId) {
    await createMiniMessage({
      school: post.school,
      type: "interactive",
      category: "\u5e16\u5b50\u70b9\u8d5e",
      content: `\u4f60\u7684\u5e16\u5b50\u300a${post.title}\u300b\u6536\u5230\u4e86\u65b0\u7684\u70b9\u8d5e`,
      receiverUserId: post.userId,
      targetType: "post",
      targetId: String(post.id)
    });
  }
  return {
    liked: true,
    likeCount: row.likeCount
  };
}

export async function queryMiniPostComments(id: number) {
  await findPostOrThrow(id);
  const list = await prisma.miniPostComment.findMany({
    where: { postId: id },
    include: {
      user: true
    },
    orderBy: { id: "asc" }
  });

  return list.map(mapComment);
}

export async function createMiniPostComment(userId: number, id: number, payload: MiniPostCommentCreatePayload) {
  await assertRiskPassed({
    userId,
    scene: "post_comment",
    texts: [payload.content]
  });

  const targetPost = await findPostOrThrow(id);
  const [row] = await prisma.$transaction([
    prisma.miniPostComment.create({
      data: {
        postId: id,
        userId,
        content: payload.content
      },
      include: {
        user: true
      }
    }),
    prisma.miniPost.update({
      where: { id },
      data: {
        commentCount: {
          increment: 1
        }
      }
    })
  ]);

  const post = await prisma.miniPost.findUniqueOrThrow({ where: { id } });
  if (targetPost.userId !== userId) {
    await createMiniMessage({
      school: targetPost.school,
      type: "interactive",
      category: "\u5e16\u5b50\u8bc4\u8bba",
      content: `\u4f60\u7684\u5e16\u5b50\u300a${targetPost.title}\u300b\u6536\u5230\u4e86\u65b0\u8bc4\u8bba\uff1a${payload.content}`,
      receiverUserId: targetPost.userId,
      targetType: "post",
      targetId: String(targetPost.id)
    });
  }
  return {
    comment: mapComment(row),
    commentCount: post.commentCount
  };
}
