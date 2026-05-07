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
const DISPLAY_NAME_BLOCKED_WORDS = ["官方", "管理员", "客服", "校院通", "平台", "系统"];
const POST_CATEGORY_GROUPS: Record<string, string[]> = {
  "\u6811\u6d1e": [
    "\u6811\u6d1e",
    "\u60c5\u611f\u6811\u6d1e",
    "\u60c5\u611f\u503e\u8bc9",
    "\u533f\u540d\u8868\u767d",
    "\u6c42\u52a9\u54a8\u8be2",
    "\u907f\u96f7\u63d0\u9192",
    "\u6821\u56ed\u516b\u5366",
    "\u5b66\u4e1a\u5410\u69fd",
    "\u65e5\u5e38\u788e\u788e\u5ff5",
    "\u597d\u7269\u5b89\u5229",
    "\u5176\u4ed6\u7c7b\u578b"
  ],
  "\u623f\u5c4b\u79df\u552e": ["\u623f\u5c4b\u79df\u552e", "\u6c42\u79df\u4fe1\u606f", "\u53d1\u5e03\u623f\u6e90", "\u5176\u4ed6\u623f\u5c4b\u79df\u552e"],
  "\u517c\u804c\u4fe1\u606f": [
    "\u517c\u804c\u4fe1\u606f",
    "\u517c\u804c\u53d1\u5e03",
    "\u6821\u5185\u5c97\u4f4d",
    "\u5b9e\u4e60\u5c97\u4f4d",
    "\u517c\u804c\u62db\u8058",
    "\u6c42\u804c\u54a8\u8be2",
    "\u5bb6\u6559\u8f85\u5bfc",
    "\u5176\u4ed6\u517c\u804c"
  ],
  "\u627e\u642d\u5b50": [
    "\u627e\u642d\u5b50",
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
    "\u8dd1\u817f\u4ee3\u529e",
    "\u5feb\u9012\u4ee3\u53d6",
    "\u5916\u5356\u4ee3\u53d6",
    "\u98df\u5802\u4ee3\u4e70",
    "\u8d85\u5e02\u4ee3\u8d2d",
    "\u6821\u56ed\u8dd1\u817f",
    "\u5176\u4ed6\u4ee3\u529e"
  ],
  "\u8df3\u86a4\u5e02\u573a": [
    "\u8df3\u86a4\u5e02\u573a",
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
const PRIMARY_CATEGORY_ALIASES: Record<string, string> = {
  "\u6811\u6d1e": "\u6811\u6d1e",
  "\u60c5\u611f\u6811\u6d1e": "\u6811\u6d1e",
  "\u8df3\u86a4\u5e02\u573a": "\u8df3\u86a4\u5e02\u573a",
  "\u517c\u804c\u4fe1\u606f": "\u517c\u804c\u4fe1\u606f",
  "\u623f\u5c4b\u79df\u552e": "\u623f\u5c4b\u79df\u552e",
  "\u627e\u642d\u5b50": "\u627e\u642d\u5b50",
  "\u8dd1\u817f\u4ee3\u529e": "\u8dd1\u817f\u4ee3\u529e"
};

function toLikeText(value?: string) {
  if (!value) return undefined;
  return { contains: value, mode: "insensitive" as const };
}

function buildCategoryWhere(category: string) {
  if (!category) return undefined;
  const categoryGroup = POST_CATEGORY_GROUPS[category];
  return categoryGroup ? { in: categoryGroup } : category;
}

function inferPrimaryCategory(category: string) {
  const normalized = String(category || "").trim();
  if (!normalized) return "";
  if (PRIMARY_CATEGORY_ALIASES[normalized]) return PRIMARY_CATEGORY_ALIASES[normalized];

  for (const [primaryCategory, categoryGroup] of Object.entries(POST_CATEGORY_GROUPS)) {
    if (categoryGroup.includes(normalized)) {
      return PRIMARY_CATEGORY_ALIASES[primaryCategory] || primaryCategory;
    }
  }

  return "";
}

function toArray(value: Prisma.JsonValue | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function normalizePostDisplayName(rawValue: unknown, fallback: string) {
  const value = String(rawValue || "").trim();
  if (!value) return fallback;
  if (/(\d{5,}|1\d{10}|[a-zA-Z][-_a-zA-Z0-9]{5,})/.test(value)) {
    throw new ApiError("展示昵称不能包含手机号、账号或联系方式", ERROR_CODES.BAD_REQUEST, 400);
  }
  if (DISPLAY_NAME_BLOCKED_WORDS.some((word) => value.includes(word))) {
    throw new ApiError("展示昵称不能使用官方、管理员等易误导身份的词", ERROR_CODES.BAD_REQUEST, 400);
  }
  return value;
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
  const publicAuthor = String(item.displayName || item.authorName || LABELS.campusUser);
  const authorAvatar = item.user?.avatarUrl || "";
  return {
    id: item.id,
    userId: item.userId,
    author: publicAuthor,
    authorName: item.authorName,
    displayName: item.displayName || "",
    authorAvatar,
    school: item.school,
    primaryCategory: item.primaryCategory || inferPrimaryCategory(item.category) || "",
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
  const category = String(rawQuery.category || "").trim();
  const keywordWhere = keyword
    ? [{ title: toLikeText(keyword) }, { content: toLikeText(keyword) }, { category: toLikeText(keyword) }]
    : undefined;
  const baseWhere = {
    status: {
      in: [LABELS.published]
    },
    category: buildCategoryWhere(category),
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
  const category = String(rawQuery.category || "").trim();

  if (scope === "all") {
    return queryAllNetworkHotPosts(rawQuery, page, pageSize, skip);
  }

  const where = {
    school: school || undefined,
    category: buildCategoryWhere(category),
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
  const user = await prisma.miniUser.findUniqueOrThrow({ where: { id: userId } });
  const authorName = user.nickname || LABELS.campusUser;
  const displayName = normalizePostDisplayName(payload.displayName, authorName);

  await assertRiskPassed({
    userId,
    scene: "post_create",
    texts: [
      payload.school,
      payload.primaryCategory,
      payload.category,
      payload.title,
      payload.content,
      displayName,
      ...(payload.contacts || []).flatMap((item) => [item.label, item.value])
    ]
  });

  const row = await prisma.miniPost.create({
    data: {
      userId,
      school: payload.school,
      authorName,
      displayName,
      primaryCategory: payload.primaryCategory || inferPrimaryCategory(payload.category) || "",
      category: payload.category,
      title: payload.title,
      content: payload.content,
      images: payload.images,
      contacts: payload.contacts,
      isAnonymous: false,
      onlyCampus: payload.onlyCampus,
      status: LABELS.published,
      reviewNote: "系统风控通过，自动发布",
      reviewedAt: new Date()
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

export async function deleteMiniPost(userId: number, id: number) {
  const post = await findPostOrThrow(id);
  if (post.userId !== userId) {
    throw new ApiError("\u53ea\u80fd\u5220\u9664\u81ea\u5df1\u53d1\u5e03\u7684\u5e16\u5b50", ERROR_CODES.FORBIDDEN, 403);
  }

  await prisma.$transaction([
    prisma.miniPostLike.deleteMany({ where: { postId: id } }),
    prisma.miniPostComment.deleteMany({ where: { postId: id } }),
    prisma.miniPostReport.deleteMany({ where: { postId: id } }),
    prisma.miniMessageRead.deleteMany({
      where: {
        message: {
          targetType: "post",
          targetId: String(id)
        }
      }
    }),
    prisma.miniMessageDelete.deleteMany({
      where: {
        message: {
          targetType: "post",
          targetId: String(id)
        }
      }
    }),
    prisma.miniMessage.deleteMany({
      where: {
        targetType: "post",
        targetId: String(id)
      }
    }),
    prisma.miniPost.delete({ where: { id } })
  ]);

  return {
    id,
    deleted: true
  };
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
