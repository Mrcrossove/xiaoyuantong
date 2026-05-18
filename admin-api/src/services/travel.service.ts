import type { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { ERROR_CODES } from "../constants/error-codes";
import { ApiError } from "../utils/api-error";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";
import { createMiniMessage } from "./mini-message.service";
import { createWechatJsapiOrder, queryWechatOrderByOutTradeNo } from "./wechat-pay.service";
import { sendTravelPaymentSubscribeMessage } from "./wechat-subscribe-message.service";

const db = prisma as any;

const ROUTE_STATUS = {
  draft: "draft",
  open: "open",
  paused: "paused",
  offline: "offline"
} as const;

const SCHEDULE_STATUS = {
  open: "open",
  grouped: "grouped",
  payment: "payment",
  full: "full",
  canceled: "canceled",
  completed: "completed"
} as const;

const BOOKING_STATUS = {
  submitted: "submitted",
  confirmed: "confirmed",
  payment: "payment",
  paid: "paid",
  canceled: "canceled",
  rejected: "rejected",
  expired: "expired",
  traveled: "traveled"
} as const;

const BOOKING_STATUS_VALUES = new Set(Object.values(BOOKING_STATUS));

type TravelPayOptions = {
  paymentChannel?: string;
  paymentMode?: string;
  transactionId?: string;
  paymentMeta?: Prisma.InputJsonValue;
  paidAt?: Date;
};

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) return value;
  const text = String(value || "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return text.split(/[,\n，]/).map((item) => item.trim()).filter(Boolean);
  }
}

function parseDate(value: unknown, field: string) {
  const text = String(value || "").trim();
  const date = text ? new Date(text) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new ApiError(`${field}无效`, ERROR_CODES.BAD_REQUEST, 400);
  }
  return date;
}

function optionalDate(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function money(value: unknown) {
  return Number(Number(value || 0).toFixed(2));
}

function moneyText(value: unknown) {
  return Number(value || 0).toFixed(2);
}

function bookingNo() {
  return `LY${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

function orderNo() {
  return `LYP${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

function badRequest(message: string) {
  throw new ApiError(message, ERROR_CODES.BAD_REQUEST, 400);
}

function isTravelOrderNo(value: string) {
  return /^LYP\d+/.test(String(value || ""));
}

async function assertSuperAdmin(adminUserId: number) {
  const admin = await prisma.adminUser.findUniqueOrThrow({
    where: { id: adminUserId },
    include: { role: true }
  });
  if (admin.role.code !== "super_admin") {
    throw new ApiError("仅超级管理员可操作出游管理", ERROR_CODES.FORBIDDEN, 403);
  }
  return admin;
}

function mapProvider(item: any) {
  return {
    id: item.id,
    name: item.name,
    contactName: item.contactName,
    contactPhone: item.contactPhone,
    licenseNo: item.licenseNo || "",
    licenseImages: asArray(item.licenseImages),
    businessLicense: item.businessLicense || null,
    status: item.status,
    remark: item.remark || "",
    createdAt: formatDateTime(item.createdAt),
    updatedAt: formatDateTime(item.updatedAt)
  };
}

function mapRoute(item: any) {
  const schedules = asArray(item.schedules).map(mapSchedule);
  const activeSchedule = schedules.find((schedule: any) => ["open", "grouped", "payment"].includes(schedule.status)) || schedules[0] || null;
  return {
    id: item.id,
    providerId: item.providerId || 0,
    providerName: item.provider?.name || "",
    title: item.title,
    tripType: item.tripType,
    destination: item.destination,
    cover: item.cover,
    banners: asArray(item.banners),
    highlights: asArray(item.highlights),
    itinerary: asArray(item.itinerary),
    feeIncluded: item.feeIncluded,
    feeExcluded: item.feeExcluded,
    notice: item.notice,
    refundRule: item.refundRule,
    serviceSchools: asArray(item.serviceSchools),
    status: item.status,
    sort: item.sort,
    activeSchedule,
    schedules,
    createdAt: formatDateTime(item.createdAt),
    updatedAt: formatDateTime(item.updatedAt)
  };
}

function mapSchedule(item: any) {
  const progress = item.minGroupSize > 0 ? Math.min(100, Math.round((Number(item.confirmedCount || 0) / item.minGroupSize) * 100)) : 0;
  return {
    id: item.id,
    routeId: item.routeId,
    departDate: formatDateTime(item.departDate).slice(0, 10),
    returnDate: item.returnDate ? formatDateTime(item.returnDate).slice(0, 10) : "",
    gatherTime: item.gatherTime,
    gatherPlace: item.gatherPlace,
    price: money(item.price),
    priceText: `￥${money(item.price).toFixed(2)}`,
    minGroupSize: item.minGroupSize,
    maxGroupSize: item.maxGroupSize,
    signupDeadline: formatDateTime(item.signupDeadline),
    paymentDeadline: item.paymentDeadline ? formatDateTime(item.paymentDeadline) : "",
    signupCount: item.signupCount,
    confirmedCount: item.confirmedCount,
    paidCount: item.paidCount,
    progress,
    status: item.status,
    createdAt: formatDateTime(item.createdAt),
    updatedAt: formatDateTime(item.updatedAt)
  };
}

function mapBooking(item: any) {
  return {
    id: item.id,
    bookingNo: item.bookingNo,
    userId: item.userId,
    nickname: item.user?.nickname || "",
    school: item.school,
    routeId: item.routeId,
    scheduleId: item.scheduleId,
    routeTitle: item.route?.title || "",
    destination: item.route?.destination || "",
    cover: item.route?.cover || "",
    departDate: item.schedule?.departDate ? formatDateTime(item.schedule.departDate).slice(0, 10) : "",
    price: item.schedule?.price ? money(item.schedule.price) : 0,
    contactName: item.contactName,
    contactPhone: item.contactPhone,
    participantCount: item.participantCount,
    participants: item.participants || [],
    emergencyName: item.emergencyName || "",
    emergencyPhone: item.emergencyPhone || "",
    remark: item.remark || "",
    status: item.status,
    paymentStatus: item.paymentStatus,
    orderId: item.orderId || 0,
    reviewNote: item.reviewNote || "",
    notifiedAt: item.notifiedAt ? formatDateTime(item.notifiedAt) : "",
    paidAt: item.paidAt ? formatDateTime(item.paidAt) : "",
    canceledAt: item.canceledAt ? formatDateTime(item.canceledAt) : "",
    createdAt: formatDateTime(item.createdAt),
    updatedAt: formatDateTime(item.updatedAt)
  };
}

async function recalcScheduleCounts(scheduleId: number) {
  const rows = await db.travelBooking.findMany({
    where: { scheduleId },
    select: { participantCount: true, status: true, paymentStatus: true }
  });
  const signupCount = rows
    .filter((item: any) => ![BOOKING_STATUS.canceled, BOOKING_STATUS.rejected].includes(item.status))
    .reduce((sum: number, item: any) => sum + Number(item.participantCount || 0), 0);
  const confirmedCount = rows
    .filter((item: any) => [BOOKING_STATUS.confirmed, BOOKING_STATUS.payment, BOOKING_STATUS.paid, BOOKING_STATUS.traveled].includes(item.status))
    .reduce((sum: number, item: any) => sum + Number(item.participantCount || 0), 0);
  const paidCount = rows
    .filter((item: any) => item.paymentStatus === "paid")
    .reduce((sum: number, item: any) => sum + Number(item.participantCount || 0), 0);
  await db.travelSchedule.update({
    where: { id: scheduleId },
    data: { signupCount, confirmedCount, paidCount }
  });
}

async function createOrGetTravelPaymentOrder(booking: any, schedule: any) {
  if (booking.orderId) {
    const existing = await db.travelOrder.findUnique({ where: { id: booking.orderId } });
    if (existing) return existing;
  }

  const existingByBooking = await db.travelOrder.findFirst({
    where: {
      bookingId: booking.id,
      payStatus: {
        in: ["pending", "paid"]
      }
    },
    orderBy: { id: "desc" }
  });
  if (existingByBooking) {
    if (!booking.orderId) {
      await db.travelBooking.update({
        where: { id: booking.id },
        data: { orderId: existingByBooking.id }
      });
    }
    return existingByBooking;
  }

  const totalAmount = money(Number(schedule.price || 0) * Number(booking.participantCount || 1));
  return db.travelOrder.create({
    data: {
      orderNo: orderNo(),
      bookingId: booking.id,
      userId: booking.userId,
      school: booking.school,
      amount: totalAmount,
      status: "pending",
      payStatus: "pending"
    }
  });
}

async function loadTravelPayContext(userId: number, bookingId: number) {
  const booking = await db.travelBooking.findFirst({ where: { id: bookingId, userId } });
  if (!booking) {
    throw new ApiError("报名记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const [route, schedule, user] = await Promise.all([
    db.travelRoute.findUnique({ where: { id: booking.routeId } }),
    db.travelSchedule.findUnique({ where: { id: booking.scheduleId } }),
    prisma.miniUser.findUnique({ where: { id: userId } })
  ]);

  if (!route || !schedule) {
    throw new ApiError("旅游线路或排期不存在", ERROR_CODES.NOT_FOUND, 404);
  }
  if (!user) {
    throw new ApiError("用户不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return { booking, route, schedule, user };
}

async function markTravelOrderPaid(order: any, options?: TravelPayOptions) {
  if (order.payStatus === "paid") {
    return order;
  }

  const paidAt = options?.paidAt || new Date();
  const row = await prisma.$transaction(async (tx) => {
    const updatedOrder = await (tx as any).travelOrder.update({
      where: { id: order.id },
      data: {
        status: "paid",
        payStatus: "paid",
        paymentChannel: options?.paymentChannel || "微信支付",
        paymentMode: options?.paymentMode || "小程序支付",
        transactionId: options?.transactionId || order.transactionId || "",
        paymentMeta: options?.paymentMeta || order.paymentMeta || undefined,
        paidAt
      }
    });

    await (tx as any).travelBooking.update({
      where: { id: order.bookingId },
      data: {
        status: BOOKING_STATUS.paid,
        paymentStatus: "paid",
        orderId: order.id,
        paidAt
      }
    });

    return updatedOrder;
  });

  const booking = await db.travelBooking.findUnique({ where: { id: row.bookingId } });
  if (booking) {
    await recalcScheduleCounts(booking.scheduleId);
    await createMiniMessage({
      school: booking.school,
      type: "system",
      category: "出游缴费",
      content: `你的出游报名 ${booking.bookingNo} 已缴费成功。`,
      receiverUserId: booking.userId,
      targetType: "travel_booking",
      targetId: String(booking.id)
    });
  }

  return row;
}

export async function markTravelOrderPaidByOutTradeNo(outTradeNo: string, options?: TravelPayOptions) {
  if (!isTravelOrderNo(outTradeNo)) {
    return null;
  }

  const order = await db.travelOrder.findUnique({ where: { orderNo: outTradeNo } });
  if (!order) {
    throw new ApiError("旅游支付订单不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return markTravelOrderPaid(order, options);
}

export async function createMiniTravelPayParams(userId: number, bookingId: number) {
  const { booking, route, schedule, user } = await loadTravelPayContext(userId, bookingId);

  if (booking.status === BOOKING_STATUS.paid || booking.paymentStatus === "paid") {
    return {
      mode: "paid",
      bookingId: booking.id,
      orderId: booking.orderId || 0,
      amount: moneyText(Number(schedule.price || 0) * Number(booking.participantCount || 1)),
      payment: null,
      mockMessage: "该报名已完成缴费"
    };
  }

  if (booking.status !== BOOKING_STATUS.payment || booking.paymentStatus !== "pending") {
    throw new ApiError("当前报名暂未开放缴费", ERROR_CODES.BAD_REQUEST, 400);
  }

  const order = await createOrGetTravelPaymentOrder(booking, schedule);
  if (booking.orderId !== order.id) {
    await db.travelBooking.update({ where: { id: booking.id }, data: { orderId: order.id } });
  }

  if (env.payUseMock) {
    return {
      mode: "mock",
      bookingId: booking.id,
      orderId: order.id,
      orderNo: order.orderNo,
      amount: moneyText(order.amount),
      payment: null,
      mockMessage: "当前为本地模拟支付，确认后会直接完成旅游缴费。"
    };
  }

  if (!user.openid) {
    throw new ApiError("当前用户缺少微信 openid，请使用真实微信登录后再支付", ERROR_CODES.BAD_REQUEST, 400);
  }

  const paymentResult = await createWechatJsapiOrder({
    description: `大学生特种兵旅行-${route.title}`.slice(0, 120),
    outTradeNo: order.orderNo,
    amount: Number(order.amount || 0),
    payerOpenid: user.openid,
    subMchId: env.wechatPaySubMchIdFallback
  });

  return {
    mode: "wechat",
    bookingId: booking.id,
    orderId: order.id,
    orderNo: order.orderNo,
    amount: moneyText(order.amount),
    payment: paymentResult.payment,
    mockMessage: "",
    wechatConfig: {
      mchId: env.wechatPaySpMchId,
      notifyUrl: env.wechatPayNotifyUrl,
      serialNo: env.wechatPayMerchantSerialNo
    }
  };
}

export async function confirmMiniTravelPay(userId: number, bookingId: number) {
  const { booking, schedule } = await loadTravelPayContext(userId, bookingId);
  const order = await createOrGetTravelPaymentOrder(booking, schedule);

  if (env.payUseMock) {
    await markTravelOrderPaid(order, {
      paymentChannel: "微信支付",
      paymentMode: "模拟支付",
      paymentMeta: { mode: "mock" }
    });
    const latest = await db.travelBooking.findUnique({ where: { id: booking.id } });
    return mapBooking({ ...latest, schedule });
  }

  const result = await queryWechatOrderByOutTradeNo(order.orderNo, env.wechatPaySubMchIdFallback);
  if (String(result.trade_state || "") !== "SUCCESS") {
    throw new ApiError(result.trade_state_desc || "微信支付尚未完成", ERROR_CODES.BAD_REQUEST, 400);
  }

  await markTravelOrderPaid(order, {
    paymentChannel: "微信支付",
    paymentMode: "小程序支付",
    transactionId: result.transaction_id || "",
    paymentMeta: result as Prisma.InputJsonValue,
    paidAt: result.success_time ? new Date(result.success_time) : new Date()
  });

  const latest = await db.travelBooking.findUnique({ where: { id: booking.id } });
  return mapBooking({ ...latest, schedule });
}

export async function queryMiniTravelRoutes(rawQuery: Record<string, unknown>) {
  const school = String(rawQuery.school || "").trim();
  const rows = await db.travelRoute.findMany({
    where: {
      status: ROUTE_STATUS.open
    },
    orderBy: [{ sort: "asc" }, { id: "desc" }]
  });
  const schedules = await db.travelSchedule.findMany({
    where: {
      routeId: { in: rows.map((item: any) => item.id) },
      status: { in: [SCHEDULE_STATUS.open, SCHEDULE_STATUS.grouped, SCHEDULE_STATUS.payment, SCHEDULE_STATUS.full] }
    },
    orderBy: [{ departDate: "asc" }, { id: "asc" }]
  });
  const scheduleMap = new Map<number, any[]>();
  schedules.forEach((item: any) => {
    scheduleMap.set(item.routeId, [...(scheduleMap.get(item.routeId) || []), item]);
  });
  return {
    list: rows
      .filter((item: any) => {
        const schools = asArray(item.serviceSchools).map(String);
        return !school || !schools.length || schools.includes(school);
      })
      .map((item: any) => mapRoute({ ...item, schedules: scheduleMap.get(item.id) || [] }))
  };
}

export function getMiniTravelSubscribeConfig() {
  return {
    paymentTemplateId: env.wechatTravelPaymentSubscribeTemplateId
  };
}

export async function getMiniTravelRouteDetail(id: number, userId?: number) {
  const route = await db.travelRoute.findFirst({
    where: { id, status: ROUTE_STATUS.open }
  });
  if (!route) {
    throw new ApiError("旅游线路不存在或已下架", ERROR_CODES.NOT_FOUND, 404);
  }
  const schedules = await db.travelSchedule.findMany({
    where: { routeId: id },
    orderBy: [{ departDate: "asc" }, { id: "asc" }]
  });
  const myBookings = userId
    ? await db.travelBooking.findMany({
        where: { userId, routeId: id },
        orderBy: { id: "desc" }
      })
    : [];
  return {
    ...mapRoute({ ...route, schedules }),
    myBookings: myBookings.map(mapBooking)
  };
}

export async function createMiniTravelBooking(userId: number, payload: any) {
  const scheduleId = Number(payload.scheduleId || 0);
  const contactName = String(payload.contactName || "").trim();
  const contactPhone = String(payload.contactPhone || "").trim();
  const school = String(payload.school || "").trim();
  const participantCount = Math.max(1, Number(payload.participantCount || 1));

  if (!contactName) badRequest("请填写报名人姓名");
  if (!/^1\d{10}$/.test(contactPhone)) badRequest("请填写正确的手机号");
  if (!school) badRequest("请填写所在学校");
  if (!Number.isFinite(participantCount) || participantCount < 1 || participantCount > 20) {
    badRequest("出行人数需在 1-20 人之间");
  }

  const schedule = await db.travelSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule || ![SCHEDULE_STATUS.open, SCHEDULE_STATUS.grouped].includes(schedule.status)) {
    throw new ApiError("当前排期暂不可报名", ERROR_CODES.BAD_REQUEST, 400);
  }
  if (new Date(schedule.signupDeadline).getTime() < Date.now()) {
    throw new ApiError("当前排期报名已截止", ERROR_CODES.BAD_REQUEST, 400);
  }
  const route = await db.travelRoute.findFirst({ where: { id: schedule.routeId, status: ROUTE_STATUS.open } });
  if (!route) {
    throw new ApiError("旅游线路不存在或已下架", ERROR_CODES.NOT_FOUND, 404);
  }
  const user = await prisma.miniUser.findUniqueOrThrow({ where: { id: userId } });

  const row = await prisma.$transaction(async (tx) => {
    const claimed = await (tx as any).travelSchedule.updateMany({
      where: {
        id: schedule.id,
        status: { in: [SCHEDULE_STATUS.open, SCHEDULE_STATUS.grouped] },
        signupCount: {
          lte: Number(schedule.maxGroupSize || 0) - participantCount
        }
      },
      data: {
        signupCount: {
          increment: participantCount
        }
      }
    });
    if (!claimed.count) {
      badRequest("当前排期名额不足");
    }
    const created = await (tx as any).travelBooking.create({
      data: {
        bookingNo: bookingNo(),
        userId,
        school: school || String(user.school || ""),
        routeId: route.id,
        scheduleId: schedule.id,
        contactName,
        contactPhone,
        participantCount,
        participants: parseJsonArray(payload.participants),
        emergencyName: String(payload.emergencyName || "").trim(),
        emergencyPhone: String(payload.emergencyPhone || "").trim(),
        remark: String(payload.remark || "").trim(),
        status: BOOKING_STATUS.submitted,
        paymentStatus: "unpaid"
      }
    });
    return created;
  });
  await createMiniMessage({
    school: row.school,
    type: "system",
    category: "出游报名",
    content: `你已提交「${route.title}」报名，平台确认成团后会通知缴费。`,
    receiverUserId: userId,
    targetType: "travel_booking",
    targetId: String(row.id)
  });
  return mapBooking({ ...row, route, schedule });
}

export async function queryMiniTravelBookings(userId: number) {
  const rows = await db.travelBooking.findMany({
    where: { userId },
    orderBy: { id: "desc" }
  });
  const routeIds = [...new Set(rows.map((item: any) => item.routeId))];
  const scheduleIds = [...new Set(rows.map((item: any) => item.scheduleId))];
  const [routes, schedules] = await Promise.all([
    db.travelRoute.findMany({ where: { id: { in: routeIds } } }),
    db.travelSchedule.findMany({ where: { id: { in: scheduleIds } } })
  ]);
  const routeMap = new Map(routes.map((item: any) => [item.id, item]));
  const scheduleMap = new Map(schedules.map((item: any) => [item.id, item]));
  return {
    list: rows.map((item: any) => mapBooking({ ...item, route: routeMap.get(item.routeId), schedule: scheduleMap.get(item.scheduleId) }))
  };
}

export async function cancelMiniTravelBooking(userId: number, id: number) {
  const current = await db.travelBooking.findFirst({ where: { id, userId } });
  if (!current) {
    throw new ApiError("报名记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }
  if (![BOOKING_STATUS.submitted, BOOKING_STATUS.confirmed].includes(current.status)) {
    throw new ApiError("当前状态不可取消", ERROR_CODES.BAD_REQUEST, 400);
  }
  const row = await db.travelBooking.update({
    where: { id },
    data: { status: BOOKING_STATUS.canceled, canceledAt: new Date() }
  });
  await recalcScheduleCounts(row.scheduleId);
  return mapBooking(row);
}

export async function queryAdminTravelProviders(adminUserId: number) {
  await assertSuperAdmin(adminUserId);
  const rows = await db.travelProvider.findMany({ orderBy: { id: "desc" } });
  return { list: rows.map(mapProvider), page: 1, pageSize: rows.length, total: rows.length };
}

export async function saveAdminTravelProvider(adminUserId: number, payload: any, id?: number) {
  await assertSuperAdmin(adminUserId);
  const data = {
    name: String(payload.name || "").trim(),
    contactName: String(payload.contactName || "").trim(),
    contactPhone: String(payload.contactPhone || "").trim(),
    licenseNo: String(payload.licenseNo || "").trim(),
    licenseImages: parseJsonArray(payload.licenseImages),
    businessLicense: payload.businessLicense || null,
    status: String(payload.status || "enabled"),
    remark: String(payload.remark || "").trim()
  };
  const row = id ? await db.travelProvider.update({ where: { id }, data }) : await db.travelProvider.create({ data });
  return mapProvider(row);
}

export async function queryAdminTravelRoutes(adminUserId: number, rawQuery: Record<string, unknown>) {
  await assertSuperAdmin(adminUserId);
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const status = String(rawQuery.status || "").trim();
  const where: any = {};
  if (status) where.status = status;
  if (keyword) where.OR = [{ title: { contains: keyword, mode: "insensitive" } }, { destination: { contains: keyword, mode: "insensitive" } }];
  const [rows, total] = await Promise.all([
    db.travelRoute.findMany({ where, orderBy: [{ sort: "asc" }, { id: "desc" }], skip, take: pageSize }),
    db.travelRoute.count({ where })
  ]);
  const schedules = await db.travelSchedule.findMany({ where: { routeId: { in: rows.map((item: any) => item.id) } }, orderBy: { departDate: "asc" } });
  const scheduleMap = new Map<number, any[]>();
  schedules.forEach((item: any) => scheduleMap.set(item.routeId, [...(scheduleMap.get(item.routeId) || []), item]));
  return { list: rows.map((item: any) => mapRoute({ ...item, schedules: scheduleMap.get(item.id) || [] })), page, pageSize, total };
}

export async function saveAdminTravelRoute(adminUserId: number, payload: any, id?: number) {
  await assertSuperAdmin(adminUserId);
  const data = {
    providerId: Number(payload.providerId || 0) || null,
    title: String(payload.title || "").trim(),
    tripType: String(payload.tripType || "一日游").trim(),
    destination: String(payload.destination || "").trim(),
    cover: String(payload.cover || "").trim(),
    banners: parseJsonArray(payload.banners),
    highlights: parseJsonArray(payload.highlights),
    itinerary: parseJsonArray(payload.itinerary),
    feeIncluded: String(payload.feeIncluded || "").trim(),
    feeExcluded: String(payload.feeExcluded || "").trim(),
    notice: String(payload.notice || "").trim(),
    refundRule: String(payload.refundRule || "").trim(),
    serviceSchools: parseJsonArray(payload.serviceSchools),
    status: String(payload.status || ROUTE_STATUS.draft),
    sort: Number(payload.sort || 0)
  };
  if (!data.title || !data.destination) {
    throw new ApiError("请填写线路标题和目的地", ERROR_CODES.BAD_REQUEST, 400);
  }
  const row = id ? await db.travelRoute.update({ where: { id }, data }) : await db.travelRoute.create({ data });
  return mapRoute({ ...row, schedules: [] });
}

export async function saveAdminTravelSchedule(adminUserId: number, routeId: number, payload: any, id?: number) {
  await assertSuperAdmin(adminUserId);
  const route = await db.travelRoute.findUnique({ where: { id: routeId } });
  if (!route) throw new ApiError("线路不存在", ERROR_CODES.NOT_FOUND, 404);
  const data = {
    routeId,
    departDate: parseDate(payload.departDate, "出发日期"),
    returnDate: optionalDate(payload.returnDate),
    gatherTime: String(payload.gatherTime || "").trim(),
    gatherPlace: String(payload.gatherPlace || "").trim(),
    price: money(payload.price),
    minGroupSize: Number(payload.minGroupSize || 1),
    maxGroupSize: Number(payload.maxGroupSize || 1),
    signupDeadline: parseDate(payload.signupDeadline, "报名截止时间"),
    paymentDeadline: optionalDate(payload.paymentDeadline),
    status: String(payload.status || SCHEDULE_STATUS.open)
  };
  if (!data.gatherTime || !data.gatherPlace) badRequest("请填写集合时间和集合地点");
  if (data.minGroupSize < 1 || data.maxGroupSize < data.minGroupSize) badRequest("人数上限不能小于成团人数");
  if (data.price < 0) badRequest("价格不能小于 0");
  const row = id ? await db.travelSchedule.update({ where: { id }, data }) : await db.travelSchedule.create({ data });
  return mapSchedule(row);
}

export async function queryAdminTravelBookings(adminUserId: number, rawQuery: Record<string, unknown>) {
  await assertSuperAdmin(adminUserId);
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const keyword = String(rawQuery.keyword || "").trim();
  const status = String(rawQuery.status || "").trim();
  const scheduleId = Number(rawQuery.scheduleId || 0);
  const where: any = {};
  if (status) where.status = status;
  if (scheduleId) where.scheduleId = scheduleId;
  if (keyword) where.OR = [
    { bookingNo: { contains: keyword, mode: "insensitive" } },
    { contactName: { contains: keyword, mode: "insensitive" } },
    { contactPhone: { contains: keyword, mode: "insensitive" } },
    { school: { contains: keyword, mode: "insensitive" } }
  ];
  const [rows, total] = await Promise.all([
    db.travelBooking.findMany({ where, orderBy: { id: "desc" }, skip, take: pageSize }),
    db.travelBooking.count({ where })
  ]);
  const routeIds = [...new Set(rows.map((item: any) => item.routeId))];
  const scheduleIds = [...new Set(rows.map((item: any) => item.scheduleId))];
  const userIds = [...new Set(rows.map((item: any) => item.userId))];
  const [routes, schedules, users] = await Promise.all([
    db.travelRoute.findMany({ where: { id: { in: routeIds } } }),
    db.travelSchedule.findMany({ where: { id: { in: scheduleIds } } }),
    prisma.miniUser.findMany({ where: { id: { in: userIds } } })
  ]);
  const routeMap = new Map(routes.map((item: any) => [item.id, item]));
  const scheduleMap = new Map(schedules.map((item: any) => [item.id, item]));
  const userMap = new Map(users.map((item: any) => [item.id, item]));
  return {
    list: rows.map((item: any) => mapBooking({ ...item, route: routeMap.get(item.routeId), schedule: scheduleMap.get(item.scheduleId), user: userMap.get(item.userId) })),
    page,
    pageSize,
    total
  };
}

export async function updateAdminTravelBookingStatus(adminUserId: number, id: number, payload: any) {
  const admin = await assertSuperAdmin(adminUserId);
  const current = await db.travelBooking.findUnique({ where: { id } });
  if (!current) throw new ApiError("报名记录不存在", ERROR_CODES.NOT_FOUND, 404);
  const status = String(payload.status || "").trim();
  if (!BOOKING_STATUS_VALUES.has(status as any)) {
    badRequest("报名状态无效");
  }
  if (current.status === BOOKING_STATUS.canceled || current.status === BOOKING_STATUS.rejected) {
    badRequest("已取消或已驳回的报名不可继续处理");
  }
  const data: any = { status, reviewedById: admin.id, reviewNote: String(payload.reviewNote || "").trim() };
  if (status === BOOKING_STATUS.payment) {
    data.notifiedAt = new Date();
    data.paymentStatus = "pending";
  } else if (status === BOOKING_STATUS.paid) {
    data.paymentStatus = "paid";
    data.paidAt = new Date();
  } else if (status === BOOKING_STATUS.rejected || status === BOOKING_STATUS.canceled || status === BOOKING_STATUS.expired) {
    data.paymentStatus = current.paymentStatus === "paid" ? "paid" : "unpaid";
    if (status === BOOKING_STATUS.canceled) {
      data.canceledAt = new Date();
    }
  }
  const row = await db.travelBooking.update({ where: { id }, data });
  await recalcScheduleCounts(row.scheduleId);
  await db.travelBookingLog.create({
    data: {
      bookingId: id,
      action: "update_status",
      operatorId: admin.id,
      beforeData: current,
      afterData: row,
      remark: data.reviewNote
    }
  });
  const route = await db.travelRoute.findUnique({ where: { id: row.routeId } });
  if (status === BOOKING_STATUS.payment) {
    const schedule = await db.travelSchedule.findUnique({ where: { id: row.scheduleId } });
    const order = await createOrGetTravelPaymentOrder(row, schedule);
    await db.travelBooking.update({ where: { id }, data: { orderId: order.id } });
    if (current.status !== BOOKING_STATUS.payment) {
      await createMiniMessage({
        school: row.school,
        type: "system",
        category: "出游缴费",
        content: `「${route?.title || "出游活动"}」已成团，请在支付截止前完成缴费。`,
        receiverUserId: row.userId,
        targetType: "travel_booking",
        targetId: String(row.id)
      });
      const user = await prisma.miniUser.findUnique({ where: { id: row.userId }, select: { openid: true } });
      await sendTravelPaymentSubscribeMessage({
        openid: user?.openid,
        routeTitle: route?.title || "出游活动",
        amount: Number(order.amount || 0),
        deadline: schedule?.paymentDeadline ? formatDateTime(schedule.paymentDeadline) : ""
      }).catch((error) => {
        console.error("travel subscribe message failed", error);
      });
    }
  }
  const latest = await db.travelBooking.findUnique({ where: { id } });
  return mapBooking({ ...latest, route });
}

export async function notifyAdminTravelSchedulePayment(adminUserId: number, scheduleId: number) {
  await assertSuperAdmin(adminUserId);
  const schedule = await db.travelSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new ApiError("排期不存在", ERROR_CODES.NOT_FOUND, 404);
  await db.travelSchedule.update({ where: { id: scheduleId }, data: { status: SCHEDULE_STATUS.payment } });
  const rows = await db.travelBooking.findMany({ where: { scheduleId, status: { in: [BOOKING_STATUS.submitted, BOOKING_STATUS.confirmed] } } });
  for (const row of rows) {
    await updateAdminTravelBookingStatus(adminUserId, row.id, { status: BOOKING_STATUS.payment, reviewNote: "成团通知缴费" });
  }
  return { updatedCount: rows.length };
}
