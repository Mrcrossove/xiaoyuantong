import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { parsePageParams } from "../utils/pagination";
import type { MiniWithdrawCreatePayload, MiniWithdrawReviewPayload } from "../controllers/schemas";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";
import { createMiniMessage } from "./mini-message.service";
import {
  createOrSyncMiniWithdrawTransferBill,
  MINI_WITHDRAW_TRANSFER_STATUS,
  syncMiniWithdrawTransferBill,
  validateMiniWithdrawTransferReady
} from "./mini-withdraw-transfer.service";
import { assertSchoolInScope, buildScopedSchoolWhere, getAdminSchoolScope } from "./admin-scope.service";

const WITHDRAW_STATUS = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回"
} as const;

function buildWithdrawNo() {
  return `TX${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

function formatMoney(value: number) {
  return Number(value || 0).toFixed(2);
}

function formatTime(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 16).replace("T", " ");
}

function maskAccountNo(value: string) {
  const text = String(value || "");
  if (text.length <= 7) {
    return text;
  }
  return `${text.slice(0, 3)}****${text.slice(-4)}`;
}

function getDisplayWithdrawStatus(item: {
  status: string;
  transferStatus?: string | null;
}) {
  if (item.transferStatus === MINI_WITHDRAW_TRANSFER_STATUS.processing) {
    return MINI_WITHDRAW_TRANSFER_STATUS.processing;
  }
  if (item.transferStatus === MINI_WITHDRAW_TRANSFER_STATUS.success) {
    return MINI_WITHDRAW_TRANSFER_STATUS.success;
  }
  if (item.transferStatus === MINI_WITHDRAW_TRANSFER_STATUS.failed) {
    return MINI_WITHDRAW_TRANSFER_STATUS.failed;
  }
  return item.status;
}

export async function ensureWalletAccount(userId: number) {
  const user = await prisma.miniUser.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new ApiError("用户不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const accountName = user.nickname || "校园用户";
  const school = user.school || "当前高校";

  return prisma.miniWalletAccount.upsert({
    where: { userId },
    update: {
      school,
      accountName
    },
    create: {
      userId,
      school,
      accountName,
      status: "正常",
      balance: 0,
      frozenAmount: 0,
      withdrawableAmount: 0,
      totalIncome: 0,
      totalWithdrawn: 0
    }
  });
}

function mapRecord(item: any) {
  return {
    id: item.id,
    withdrawNo: item.withdrawNo,
    amount: formatMoney(item.amount),
    accountType: item.accountType,
    accountNo: maskAccountNo(item.accountNo),
    status: getDisplayWithdrawStatus(item),
    reviewStatus: item.status,
    transferStatus: item.transferStatus || "",
    reviewNote: item.reviewNote || "",
    transferFailReason: item.transferFailReason || "",
    applyTime: formatTime(item.applyTime),
    reviewedAt: formatTime(item.reviewedAt),
    transferAppliedAt: formatTime(item.transferAppliedAt),
    transferSuccessAt: formatTime(item.transferSuccessAt)
  };
}

function mapAdminWithdraw(item: any) {
  return {
    id: item.id,
    withdrawNo: item.withdrawNo,
    school: item.school,
    accountName: item.accountName,
    amount: Number(item.amount || 0),
    bankName: item.accountType,
    status: getDisplayWithdrawStatus(item),
    reviewStatus: item.status,
    transferStatus: item.transferStatus || "",
    applyTime: formatTime(item.applyTime),
    reviewedAt: formatTime(item.reviewedAt),
    transferAppliedAt: formatTime(item.transferAppliedAt),
    transferSuccessAt: formatTime(item.transferSuccessAt),
    reviewNote: item.reviewNote || "",
    transferFailReason: item.transferFailReason || ""
  };
}

async function findWithdrawOrThrow(id: number) {
  const row = await prisma.miniWithdrawRecord.findUnique({
    where: { id }
  });

  if (!row) {
    throw new ApiError("提现记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  return row;
}

async function findAdminScopedWithdrawOrThrow(adminUserId: number, id: number) {
  const [record, scope] = await Promise.all([findWithdrawOrThrow(id), getAdminSchoolScope(adminUserId)]);
  assertSchoolInScope(scope, record.school);
  return record;
}

export async function queryMiniWalletSummary(userId: number) {
  const account = await ensureWalletAccount(userId);
  const recentWithdraws = await prisma.miniWithdrawRecord.findMany({
    where: { userId },
    orderBy: { id: "desc" },
    take: 3
  });

  return {
    wallet: {
      total: formatMoney(account.balance),
      frozen: formatMoney(account.frozenAmount),
      available: formatMoney(account.withdrawableAmount),
      totalIncome: formatMoney(account.totalIncome),
      totalWithdrawn: formatMoney(account.totalWithdrawn),
      status: account.status
    },
    withdrawRecords: recentWithdraws.map(mapRecord)
  };
}

export async function queryAdminWalletAccountList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const scope = await getAdminSchoolScope(adminUserId);
  const school = String(rawQuery.school || "").trim();
  const status = String(rawQuery.status || "").trim();

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    status: status || undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.miniWalletAccount.count({ where }),
    prisma.miniWalletAccount.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: pageSize
    })
  ]);

  const mapped = list.map((item: any) => ({
    id: item.id,
    accountName: item.accountName,
    accountType: "微信零钱",
    school: item.school,
    balance: Number(item.balance || 0),
    frozenAmount: Number(item.frozenAmount || 0),
    withdrawableAmount: Number(item.withdrawableAmount || 0),
    status: item.status
  }));

  return {
    list: mapped,
    page,
    pageSize,
    total,
    summary: {
      total,
      balanceTotal: mapped.reduce((sum: number, item: any) => sum + item.balance, 0),
      frozenTotal: mapped.reduce((sum: number, item: any) => sum + item.frozenAmount, 0),
      withdrawableTotal: mapped.reduce((sum: number, item: any) => sum + item.withdrawableAmount, 0),
      schoolOptions: [...new Set(mapped.map((item: any) => item.school))]
    }
  };
}

export async function queryAdminWithdrawList(adminUserId: number, rawQuery: Record<string, unknown>) {
  const { page, pageSize, skip } = parsePageParams(rawQuery);
  const scope = await getAdminSchoolScope(adminUserId);
  const school = String(rawQuery.school || "").trim();
  const status = String(rawQuery.status || "").trim();
  const transferStatus = String(rawQuery.transferStatus || "").trim();
  const keyword = String(rawQuery.keyword || "").trim();

  const where = {
    school: buildScopedSchoolWhere(scope, school),
    status: status || undefined,
    transferStatus: transferStatus || undefined,
    OR: keyword
      ? [
          { withdrawNo: { contains: keyword, mode: "insensitive" as const } },
          { accountName: { contains: keyword, mode: "insensitive" as const } },
          { accountNo: { contains: keyword, mode: "insensitive" as const } }
        ]
      : undefined
  };

  const [total, list] = await prisma.$transaction([
    prisma.miniWithdrawRecord.count({ where }),
    prisma.miniWithdrawRecord.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: pageSize
    })
  ]);

  return {
    list: list.map(mapAdminWithdraw),
    page,
    pageSize,
    total
  };
}

export async function createMiniWithdraw(userId: number, payload: MiniWithdrawCreatePayload) {
  const account = await ensureWalletAccount(userId);
  const amount = Number(Number(payload.amount).toFixed(2));

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError("提现金额无效", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (amount > account.withdrawableAmount) {
    throw new ApiError("可提现余额不足", ERROR_CODES.BAD_REQUEST, 400);
  }

  const [record] = await prisma.$transaction([
    prisma.miniWithdrawRecord.create({
      data: {
        withdrawNo: buildWithdrawNo(),
        userId,
        school: account.school,
        accountName: account.accountName,
        amount,
        accountType: payload.accountType,
        accountNo: payload.accountNo,
        status: WITHDRAW_STATUS.pending,
        reviewNote: payload.remark || ""
      }
    }),
    prisma.miniWalletAccount.update({
      where: { userId },
      data: {
        frozenAmount: {
          increment: amount
        },
        withdrawableAmount: {
          decrement: amount
        }
      }
    })
  ]);

  await createMiniMessage({
    school: account.school,
    type: "system",
    category: "提现通知",
    content: `提现申请 ${record.withdrawNo} 已提交，提现金额 ￥${formatMoney(amount)}`,
    receiverUserId: userId,
    targetType: "withdraw",
    targetId: String(record.id)
  });

  return mapRecord(record);
}

export async function reviewMiniWithdraw(adminUserId: number, id: number, payload: MiniWithdrawReviewPayload) {
  const record = await findAdminScopedWithdrawOrThrow(adminUserId, id);

  if (record.status !== WITHDRAW_STATUS.pending) {
    throw new ApiError("当前提现记录不可审核", ERROR_CODES.BAD_REQUEST, 400);
  }

  const reviewedAt = new Date();

  if (payload.status !== WITHDRAW_STATUS.approved) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.miniWithdrawRecord.update({
        where: { id },
        data: {
          status: payload.status,
          reviewNote: payload.reviewNote || "",
          reviewedAt
        }
      });

      await tx.miniWalletAccount.update({
        where: { userId: record.userId },
        data: {
          frozenAmount: {
            decrement: record.amount
          },
          withdrawableAmount: {
            increment: record.amount
          }
        }
      });
    });

    await createMiniMessage({
      school: record.school,
      type: "system",
      category: "提现通知",
      content: `提现申请 ${record.withdrawNo} 未通过审核，原因：${payload.reviewNote || "请联系管理员"}`,
      receiverUserId: record.userId,
      targetType: "withdraw",
      targetId: String(record.id)
    });

    const nextRejected = await findWithdrawOrThrow(id);
    return mapAdminWithdraw(nextRejected);
  }

  await validateMiniWithdrawTransferReady(id);

  await prisma.miniWithdrawRecord.update({
    where: { id },
    data: {
      status: WITHDRAW_STATUS.approved,
      reviewNote: payload.reviewNote || "",
      reviewedAt,
      transferStatus: MINI_WITHDRAW_TRANSFER_STATUS.pending,
      transferFailReason: null
    }
  });

  await createOrSyncMiniWithdrawTransferBill(id);
  const next = await findWithdrawOrThrow(id);
  return mapAdminWithdraw(next);
}

export async function syncAdminWithdrawTransfer(adminUserId: number, id: number) {
  const record = await findAdminScopedWithdrawOrThrow(adminUserId, id);

  if (record.status !== WITHDRAW_STATUS.approved) {
    throw new ApiError("仅已审核通过的提现记录可查单", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (record.transferStatus === MINI_WITHDRAW_TRANSFER_STATUS.success) {
    return mapAdminWithdraw(record);
  }

  if (record.transferOutBillNo) {
    const bill = await prisma.miniWithdrawTransferBill.findFirst({
      where: {
        outBillNo: record.transferOutBillNo
      }
    });
    if (bill) {
      await syncMiniWithdrawTransferBill(bill.id);
      const latest = await findWithdrawOrThrow(id);
      return mapAdminWithdraw(latest);
    }
  }

  await createOrSyncMiniWithdrawTransferBill(id);
  const latest = await findWithdrawOrThrow(id);
  return mapAdminWithdraw(latest);
}
