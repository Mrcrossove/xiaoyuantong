import { Prisma } from "@prisma/client";
import type {
  AdminSupplyRequestStatusPayload,
  MerchantSupplyRequestCreatePayload
} from "../controllers/mini-commerce-schemas";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { parsePageParams } from "../utils/pagination";
import { formatDateTime } from "../utils/time";

const SUPPLY_STATUS = {
  pending: "pending",
  delivering: "delivering",
  completed: "completed",
  rejected: "rejected"
} as const;

function buildRequestNo() {
  const date = new Date();
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `SR${stamp}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
}

function mapSupplyRequest(row: any) {
  return {
    id: row.id,
    requestNo: row.requestNo,
    merchantAccountId: row.merchantAccountId,
    storeId: row.storeId,
    storeName: row.storeName,
    ownerName: row.ownerName,
    phone: row.phone,
    school: row.school,
    address: row.address,
    productName: row.productName,
    quantity: row.quantity,
    remark: row.remark || "",
    status: row.status,
    adminNote: row.adminNote || "",
    handlerName: row.handledBy?.name || "",
    handledAt: formatDateTime(row.handledAt),
    createdAt: formatDateTime(row.createdAt),
    updatedAt: formatDateTime(row.updatedAt)
  };
}

async function getMerchantSupplyContext(accountId: number) {
  const account = await prisma.merchantAccount.findUnique({
    where: { id: accountId },
    include: {
      store: true
    }
  });

  if (!account) {
    throw new ApiError("商家账号不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return account;
}

function buildAdminWhere(rawQuery: Record<string, unknown>): Prisma.MerchantSupplyRequestWhereInput {
  const keyword = String(rawQuery.keyword || "").trim();
  const school = String(rawQuery.school || "").trim();
  const status = String(rawQuery.status || "").trim();
  const dateFrom = String(rawQuery.dateFrom || "").trim();
  const dateTo = String(rawQuery.dateTo || "").trim();
  const createdAt: Prisma.DateTimeFilter = {};

  if (dateFrom) {
    const start = new Date(`${dateFrom}T00:00:00.000Z`);
    if (!Number.isNaN(start.getTime())) createdAt.gte = start;
  }

  if (dateTo) {
    const end = new Date(`${dateTo}T23:59:59.999Z`);
    if (!Number.isNaN(end.getTime())) createdAt.lte = end;
  }

  return {
    school: school || undefined,
    status: status || undefined,
    createdAt: Object.keys(createdAt).length ? createdAt : undefined,
    OR: keyword
      ? [
          { requestNo: { contains: keyword, mode: "insensitive" } },
          { storeName: { contains: keyword, mode: "insensitive" } },
          { ownerName: { contains: keyword, mode: "insensitive" } },
          { phone: { contains: keyword, mode: "insensitive" } },
          { productName: { contains: keyword, mode: "insensitive" } }
        ]
      : undefined
  };
}

export async function createMerchantSupplyRequest(accountId: number, payload: MerchantSupplyRequestCreatePayload) {
  const context = await getMerchantSupplyContext(accountId);
  const row = await prisma.merchantSupplyRequest.create({
    data: {
      requestNo: buildRequestNo(),
      merchantAccountId: context.id,
      storeId: context.storeId,
      storeName: payload.storeName || context.store.name,
      ownerName: payload.ownerName || context.name,
      phone: payload.phone || context.phone,
      school: payload.school || context.store.school,
      address: payload.address || context.store.address,
      productName: payload.productName,
      quantity: payload.quantity,
      remark: payload.remark || "",
      status: SUPPLY_STATUS.pending
    }
  });

  return mapSupplyRequest(row);
}

export async function getMerchantSupplyDefaults(accountId: number) {
  const context = await getMerchantSupplyContext(accountId);
  return {
    storeName: context.store.name,
    ownerName: context.name,
    phone: context.phone || context.store.phone || "",
    school: context.store.school,
    address: context.store.address || ""
  };
}

export async function queryMerchantSupplyRequests(accountId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const [total, list] = await prisma.$transaction([
    prisma.merchantSupplyRequest.count({
      where: { merchantAccountId: accountId }
    }),
    prisma.merchantSupplyRequest.findMany({
      where: { merchantAccountId: accountId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize
    })
  ]);

  return {
    list: list.map(mapSupplyRequest),
    page,
    pageSize,
    total
  };
}

export async function queryAdminSupplyRequests(rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const where = buildAdminWhere(rawQuery);
  const [total, list] = await prisma.$transaction([
    prisma.merchantSupplyRequest.count({ where }),
    prisma.merchantSupplyRequest.findMany({
      where,
      include: {
        handledBy: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize
    })
  ]);

  return {
    list: list.map(mapSupplyRequest),
    page,
    pageSize,
    total
  };
}

export async function exportAdminSupplyRequests(rawQuery: Record<string, unknown>) {
  const where = buildAdminWhere(rawQuery);
  const rows = await prisma.merchantSupplyRequest.findMany({
    where,
    include: {
      handledBy: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 5000
  });
  return rows.map(mapSupplyRequest);
}

export async function updateAdminSupplyRequestStatus(
  id: number,
  adminUserId: number,
  payload: AdminSupplyRequestStatusPayload
) {
  const current = await prisma.merchantSupplyRequest.findUnique({
    where: { id }
  });

  if (!current) {
    throw new ApiError("补给申请不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const row = await prisma.merchantSupplyRequest.update({
    where: { id },
    data: {
      status: payload.status,
      adminNote: payload.adminNote || "",
      handledById: adminUserId,
      handledAt: new Date()
    },
    include: {
      handledBy: {
        select: { name: true }
      }
    }
  });

  return mapSupplyRequest(row);
}
