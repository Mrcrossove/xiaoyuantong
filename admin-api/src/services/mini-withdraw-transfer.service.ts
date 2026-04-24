import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { ERROR_CODES } from "../constants/error-codes";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/api-error";
import { ensureMerchantWithdrawProfileReady } from "./merchant-withdraw-profile.service";
import { createMiniMessage } from "./mini-message.service";
import { createWechatTransferBill, queryWechatTransferBill } from "./wechat-pay.service";

export const MINI_WITHDRAW_TRANSFER_STATUS = {
  pending: "待打款",
  processing: "打款中",
  success: "打款成功",
  failed: "打款失败"
} as const;

function buildTransferOutBillNo(withdrawNo: string) {
  return `WT${String(withdrawNo || "").trim()}`;
}

function getLocalTransferStatus(wechatStatus: string) {
  if (wechatStatus === "SUCCESS") return MINI_WITHDRAW_TRANSFER_STATUS.success;
  if (
    wechatStatus === "ACCEPTED" ||
    wechatStatus === "PROCESSING" ||
    wechatStatus === "WAIT_USER_CONFIRM" ||
    wechatStatus === "TRANSFERING"
  ) {
    return MINI_WITHDRAW_TRANSFER_STATUS.processing;
  }
  if (wechatStatus === "FAILED" || wechatStatus === "CANCELLED" || wechatStatus === "CANCELING") {
    return MINI_WITHDRAW_TRANSFER_STATUS.failed;
  }
  return MINI_WITHDRAW_TRANSFER_STATUS.pending;
}

async function getWithdrawTransferContext(withdrawRecordId: number) {
  const record = await prisma.miniWithdrawRecord.findUnique({
    where: { id: withdrawRecordId },
    include: {
      user: true
    }
  });

  if (!record) {
    throw new ApiError("提现记录不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const merchantAccount = await prisma.merchantAccount.findFirst({
    where: {
      miniUserId: record.userId
    },
    include: {
      store: true
    }
  });

  if (!merchantAccount?.store) {
    throw new ApiError("当前商家未绑定店铺，无法发起微信提现", ERROR_CODES.BAD_REQUEST, 400);
  }

  await ensureMerchantWithdrawProfileReady(merchantAccount.id);

  if (!record.user?.openid) {
    throw new ApiError("当前商家缺少微信 openid，无法发起微信提现", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (String(record.accountType || "").trim() && !String(record.accountType).includes("微信")) {
    throw new ApiError("当前版本仅支持微信提现到零钱", ERROR_CODES.BAD_REQUEST, 400);
  }

  const subMchId = String(merchantAccount.store.wechatSubMchId || env.wechatPaySubMchIdFallback || "").trim();
  if (!subMchId) {
    throw new ApiError("当前店铺未配置微信子商户号，无法发起提现打款", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (!env.payUseMock && !env.wechatPayTransferSceneId) {
    throw new ApiError("未配置微信提现场景ID，无法发起真实打款", ERROR_CODES.BAD_REQUEST, 400);
  }

  if (!env.payUseMock && Number(record.amount || 0) >= 2000) {
    throw new ApiError("当前版本未接入实名校验，暂只支持 2000 元以下微信零钱打款", ERROR_CODES.BAD_REQUEST, 400);
  }

  return {
    record,
    merchantAccount,
    store: merchantAccount.store,
    subMchId,
    openid: record.user.openid
  };
}

export async function validateMiniWithdrawTransferReady(withdrawRecordId: number) {
  await getWithdrawTransferContext(withdrawRecordId);
}

async function sendTransferMessage(
  record: {
    id: number;
    userId: number;
    school: string;
    withdrawNo: string;
  },
  status: string,
  failReason?: string | null
) {
  let content = `提现申请 ${record.withdrawNo} 状态已更新`;
  if (status === MINI_WITHDRAW_TRANSFER_STATUS.processing) {
    content = `提现申请 ${record.withdrawNo} 已发起打款，请留意微信收款进度`;
  } else if (status === MINI_WITHDRAW_TRANSFER_STATUS.success) {
    content = `提现申请 ${record.withdrawNo} 已打款成功，请到微信零钱核实到账`;
  } else if (status === MINI_WITHDRAW_TRANSFER_STATUS.failed) {
    content = `提现申请 ${record.withdrawNo} 打款失败：${failReason || "请联系平台管理员"}`;
  }

  await createMiniMessage({
    school: record.school,
    type: "system",
    category: "提现通知",
    content,
    receiverUserId: record.userId,
    targetType: "withdraw",
    targetId: String(record.id)
  });
}

async function finalizeWithdrawTransferSuccess(
  transferBillId: number,
  payload: {
    wechatStatus?: string;
    transferBillNo?: string;
    packageInfo?: string;
    responsePayload?: Prisma.InputJsonValue | null;
    successAt?: Date | null;
  }
) {
  const updated = await prisma.$transaction(async (tx) => {
    const bill = await tx.miniWithdrawTransferBill.findUnique({
      where: { id: transferBillId },
      include: {
        withdrawRecord: true
      }
    });

    if (!bill) {
      throw new ApiError("提现打款单不存在", ERROR_CODES.NOT_FOUND, 404);
    }

    if (
      bill.status === MINI_WITHDRAW_TRANSFER_STATUS.success &&
      bill.withdrawRecord.transferStatus === MINI_WITHDRAW_TRANSFER_STATUS.success
    ) {
      return bill.withdrawRecord;
    }

    await tx.miniWithdrawTransferBill.update({
      where: { id: transferBillId },
      data: {
        status: MINI_WITHDRAW_TRANSFER_STATUS.success,
        wechatStatus: payload.wechatStatus || "SUCCESS",
        transferBillNo: payload.transferBillNo || bill.transferBillNo || null,
        packageInfo: payload.packageInfo || bill.packageInfo || null,
        responsePayload: payload.responsePayload ?? undefined,
        successAt: payload.successAt || new Date(),
        acceptedAt: bill.acceptedAt || new Date(),
        lastSyncAt: new Date(),
        syncAttempts: {
          increment: 1
        },
        failReason: null
      }
    });

    const updatedRecord = await tx.miniWithdrawRecord.update({
      where: { id: bill.withdrawRecordId },
      data: {
        transferStatus: MINI_WITHDRAW_TRANSFER_STATUS.success,
        transferBillNo: payload.transferBillNo || bill.transferBillNo || null,
        transferFailReason: null,
        transferSuccessAt: payload.successAt || new Date()
      }
    });

    await tx.miniWalletAccount.update({
      where: { userId: bill.withdrawRecord.userId },
      data: {
        balance: {
          decrement: bill.withdrawRecord.amount
        },
        frozenAmount: {
          decrement: bill.withdrawRecord.amount
        },
        totalWithdrawn: {
          increment: bill.withdrawRecord.amount
        }
      }
    });

    return updatedRecord;
  });

  await sendTransferMessage(updated, MINI_WITHDRAW_TRANSFER_STATUS.success);
  return prisma.miniWithdrawTransferBill.findUniqueOrThrow({
    where: { id: transferBillId }
  });
}

async function finalizeWithdrawTransferFailed(
  transferBillId: number,
  payload: {
    wechatStatus?: string;
    transferBillNo?: string;
    failReason?: string;
    responsePayload?: Prisma.InputJsonValue | null;
  }
) {
  const updated = await prisma.$transaction(async (tx) => {
    const bill = await tx.miniWithdrawTransferBill.findUnique({
      where: { id: transferBillId },
      include: {
        withdrawRecord: true
      }
    });

    if (!bill) {
      throw new ApiError("提现打款单不存在", ERROR_CODES.NOT_FOUND, 404);
    }

    await tx.miniWithdrawTransferBill.update({
      where: { id: transferBillId },
      data: {
        status: MINI_WITHDRAW_TRANSFER_STATUS.failed,
        wechatStatus: payload.wechatStatus || bill.wechatStatus || null,
        transferBillNo: payload.transferBillNo || bill.transferBillNo || null,
        failReason: payload.failReason || "微信提现失败",
        responsePayload: payload.responsePayload ?? undefined,
        lastSyncAt: new Date(),
        syncAttempts: {
          increment: 1
        }
      }
    });

    const record = await tx.miniWithdrawRecord.update({
      where: { id: bill.withdrawRecordId },
      data: {
        transferStatus: MINI_WITHDRAW_TRANSFER_STATUS.failed,
        transferBillNo: payload.transferBillNo || bill.transferBillNo || null,
        transferFailReason: payload.failReason || "微信提现失败"
      }
    });

    if (
      bill.withdrawRecord.transferStatus !== MINI_WITHDRAW_TRANSFER_STATUS.failed &&
      bill.withdrawRecord.transferStatus !== MINI_WITHDRAW_TRANSFER_STATUS.success
    ) {
      await tx.miniWalletAccount.update({
        where: { userId: bill.withdrawRecord.userId },
        data: {
          frozenAmount: {
            decrement: bill.withdrawRecord.amount
          },
          withdrawableAmount: {
            increment: bill.withdrawRecord.amount
          }
        }
      });
    }

    return record;
  });

  await sendTransferMessage(updated, MINI_WITHDRAW_TRANSFER_STATUS.failed, payload.failReason || "微信提现失败");
  return prisma.miniWithdrawTransferBill.findUniqueOrThrow({
    where: { id: transferBillId }
  });
}

async function updateWithdrawTransferProcessing(
  transferBillId: number,
  payload: {
    wechatStatus?: string;
    transferBillNo?: string;
    packageInfo?: string;
    responsePayload?: Prisma.InputJsonValue | null;
  }
) {
  const bill = await prisma.miniWithdrawTransferBill.update({
    where: { id: transferBillId },
    data: {
      status: MINI_WITHDRAW_TRANSFER_STATUS.processing,
      wechatStatus: payload.wechatStatus || null,
      transferBillNo: payload.transferBillNo || null,
      packageInfo: payload.packageInfo || null,
      responsePayload: payload.responsePayload ?? undefined,
      acceptedAt: new Date(),
      lastSyncAt: new Date(),
      syncAttempts: {
        increment: 1
      },
      failReason: null
    },
    include: {
      withdrawRecord: true
    }
  });

  await prisma.miniWithdrawRecord.update({
    where: { id: bill.withdrawRecordId },
    data: {
      transferStatus: MINI_WITHDRAW_TRANSFER_STATUS.processing,
      transferBillNo: payload.transferBillNo || null,
      transferFailReason: null,
      transferAppliedAt: bill.acceptedAt || new Date()
    }
  });

  await sendTransferMessage(bill.withdrawRecord, MINI_WITHDRAW_TRANSFER_STATUS.processing);
  return bill;
}

export async function createOrSyncMiniWithdrawTransferBill(withdrawRecordId: number) {
  const context = await getWithdrawTransferContext(withdrawRecordId);
  const { record, subMchId, openid } = context;
  const outBillNo = record.transferOutBillNo || buildTransferOutBillNo(record.withdrawNo);

  const existing = await prisma.miniWithdrawTransferBill.findUnique({
    where: { outBillNo }
  });

  if (existing?.status === MINI_WITHDRAW_TRANSFER_STATUS.success) {
    return existing;
  }

  if (
    existing &&
    [MINI_WITHDRAW_TRANSFER_STATUS.pending, MINI_WITHDRAW_TRANSFER_STATUS.processing].includes(existing.status)
  ) {
    return syncMiniWithdrawTransferBill(existing.id);
  }

  const requestPayload = {
    outBillNo,
    subMchId,
    openid,
    amount: Number(record.amount || 0),
    remark: `withdraw_${record.withdrawNo}`,
    sceneId: env.wechatPayTransferSceneId,
    userRecvPerception: env.wechatPayTransferUserRecvPerception
  };

  const bill = existing
    ? await prisma.miniWithdrawTransferBill.update({
        where: { id: existing.id },
        data: {
          school: record.school,
          userId: record.userId,
          subMchId,
          openid,
          amount: Number(record.amount || 0),
          status: MINI_WITHDRAW_TRANSFER_STATUS.pending,
          sceneId: env.wechatPayTransferSceneId || null,
          failReason: null,
          requestPayload: requestPayload as Prisma.InputJsonValue,
          responsePayload: Prisma.JsonNull
        }
      })
    : await prisma.miniWithdrawTransferBill.create({
        data: {
          withdrawRecordId: record.id,
          school: record.school,
          userId: record.userId,
          outBillNo,
          subMchId,
          openid,
          amount: Number(record.amount || 0),
          status: MINI_WITHDRAW_TRANSFER_STATUS.pending,
          sceneId: env.wechatPayTransferSceneId || null,
          requestPayload: requestPayload as Prisma.InputJsonValue
        }
      });

  await prisma.miniWithdrawRecord.update({
    where: { id: record.id },
    data: {
      transferStatus: MINI_WITHDRAW_TRANSFER_STATUS.pending,
      transferOutBillNo: outBillNo,
      transferFailReason: null,
      transferAppliedAt: new Date()
    }
  });

  if (env.payUseMock || !env.wechatPayUseServiceProvider) {
    return finalizeWithdrawTransferSuccess(bill.id, {
      wechatStatus: "SUCCESS",
      transferBillNo: `mock_${outBillNo}`,
      responsePayload: {
        mock: true,
        out_bill_no: outBillNo
      } as Prisma.InputJsonValue,
      successAt: new Date()
    });
  }

  try {
    const response = await createWechatTransferBill(requestPayload);
    const wechatStatus = String(response?.state || "");
    const localStatus = getLocalTransferStatus(wechatStatus);

    if (localStatus === MINI_WITHDRAW_TRANSFER_STATUS.success) {
      return finalizeWithdrawTransferSuccess(bill.id, {
        wechatStatus,
        transferBillNo: String(response?.transfer_bill_no || ""),
        packageInfo: String(response?.package_info || ""),
        responsePayload: response as Prisma.InputJsonValue,
        successAt: new Date()
      });
    }

    if (localStatus === MINI_WITHDRAW_TRANSFER_STATUS.failed) {
      return finalizeWithdrawTransferFailed(bill.id, {
        wechatStatus,
        transferBillNo: String(response?.transfer_bill_no || ""),
        failReason: String(response?.fail_reason || response?.message || "微信提现失败"),
        responsePayload: response as Prisma.InputJsonValue
      });
    }

    return updateWithdrawTransferProcessing(bill.id, {
      wechatStatus,
      transferBillNo: String(response?.transfer_bill_no || ""),
      packageInfo: String(response?.package_info || ""),
      responsePayload: response as Prisma.InputJsonValue
    });
  } catch (error: any) {
    await finalizeWithdrawTransferFailed(bill.id, {
      failReason: error?.message || "微信提现请求失败"
    });
    throw error;
  }
}

export async function syncMiniWithdrawTransferBill(transferBillId: number) {
  const bill = await prisma.miniWithdrawTransferBill.findUnique({
    where: { id: transferBillId }
  });

  if (!bill) {
    throw new ApiError("提现打款单不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (bill.status === MINI_WITHDRAW_TRANSFER_STATUS.success) {
    return bill;
  }

  const response = await queryWechatTransferBill({
    outBillNo: bill.outBillNo,
    subMchId: bill.subMchId
  });
  const wechatStatus = String(response?.state || "");
  const localStatus = getLocalTransferStatus(wechatStatus);

  if (localStatus === MINI_WITHDRAW_TRANSFER_STATUS.success) {
    return finalizeWithdrawTransferSuccess(bill.id, {
      wechatStatus,
      transferBillNo: String(response?.transfer_bill_no || ""),
      packageInfo: String(response?.package_info || ""),
      responsePayload: response as Prisma.InputJsonValue,
      successAt: response?.update_time ? new Date(response.update_time) : new Date()
    });
  }

  if (localStatus === MINI_WITHDRAW_TRANSFER_STATUS.failed) {
    return finalizeWithdrawTransferFailed(bill.id, {
      wechatStatus,
      transferBillNo: String(response?.transfer_bill_no || ""),
      failReason: String(response?.fail_reason || response?.message || "微信提现失败"),
      responsePayload: response as Prisma.InputJsonValue
    });
  }

  return updateWithdrawTransferProcessing(bill.id, {
    wechatStatus,
    transferBillNo: String(response?.transfer_bill_no || ""),
    packageInfo: String(response?.package_info || ""),
    responsePayload: response as Prisma.InputJsonValue
  });
}

export async function confirmMiniWithdrawTransferByOutBillNo(
  outBillNo: string,
  payload: Prisma.InputJsonValue,
  state?: string,
  successAt?: Date | null
) {
  const bill = await prisma.miniWithdrawTransferBill.findFirst({
    where: {
      outBillNo
    }
  });

  if (!bill) {
    throw new ApiError("提现打款单不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  const wechatStatus = String(state || (payload as Record<string, unknown>)?.state || "");
  const localStatus = getLocalTransferStatus(wechatStatus);

  if (localStatus === MINI_WITHDRAW_TRANSFER_STATUS.success) {
    return finalizeWithdrawTransferSuccess(bill.id, {
      wechatStatus,
      transferBillNo: String((payload as Record<string, unknown>)?.transfer_bill_no || ""),
      packageInfo: String((payload as Record<string, unknown>)?.package_info || ""),
      responsePayload: payload,
      successAt: successAt || new Date()
    });
  }

  if (localStatus === MINI_WITHDRAW_TRANSFER_STATUS.failed) {
    return finalizeWithdrawTransferFailed(bill.id, {
      wechatStatus,
      transferBillNo: String((payload as Record<string, unknown>)?.transfer_bill_no || ""),
      failReason: String((payload as Record<string, unknown>)?.fail_reason || "微信提现失败"),
      responsePayload: payload
    });
  }

  return updateWithdrawTransferProcessing(bill.id, {
    wechatStatus,
    transferBillNo: String((payload as Record<string, unknown>)?.transfer_bill_no || ""),
    packageInfo: String((payload as Record<string, unknown>)?.package_info || ""),
    responsePayload: payload
  });
}

export async function syncPendingMiniWithdrawTransferBills(limit = 20) {
  const list = await prisma.miniWithdrawTransferBill.findMany({
    where: {
      status: {
        in: [MINI_WITHDRAW_TRANSFER_STATUS.pending, MINI_WITHDRAW_TRANSFER_STATUS.processing]
      }
    },
    orderBy: {
      createdAt: "asc"
    },
    take: limit
  });

  const results: Array<Record<string, unknown>> = [];
  for (const item of list) {
    try {
      const synced = await syncMiniWithdrawTransferBill(item.id);
      results.push({
        id: item.id,
        outBillNo: item.outBillNo,
        status: synced.status
      });
    } catch (error: any) {
      results.push({
        id: item.id,
        outBillNo: item.outBillNo,
        status: "error",
        error: error?.message || "sync_failed"
      });
    }
  }

  return results;
}
