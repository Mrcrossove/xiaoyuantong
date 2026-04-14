import { prisma } from "../lib/prisma";
import type { MiniAddressPayload } from "../controllers/schemas";
import { ApiError } from "../utils/api-error";
import { ERROR_CODES } from "../constants/error-codes";

function mapAddress(item: any) {
  return {
    id: item.id,
    school: item.school,
    name: item.receiverName,
    phone: item.phone,
    address: item.detail,
    tag: item.tag,
    isDefault: !!item.isDefault
  };
}

async function clearDefaultAddress(userId: number) {
  await prisma.miniAddress.updateMany({
    where: {
      userId,
      isDefault: true
    },
    data: {
      isDefault: false
    }
  });
}

export async function queryMiniAddressList(userId: number) {
  const list = await prisma.miniAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { id: "desc" }]
  });

  return list.map(mapAddress);
}

export async function createMiniAddress(userId: number, payload: MiniAddressPayload) {
  if (payload.isDefault) {
    await clearDefaultAddress(userId);
  }

  const row = await prisma.miniAddress.create({
    data: {
      userId,
      school: payload.school,
      receiverName: payload.receiverName,
      phone: payload.phone,
      detail: payload.detail,
      tag: payload.tag,
      isDefault: !!payload.isDefault
    }
  });

  return mapAddress(row);
}

export async function updateMiniAddress(userId: number, id: number, payload: MiniAddressPayload) {
  const exists = await prisma.miniAddress.findFirst({
    where: { id, userId }
  });

  if (!exists) {
    throw new ApiError("地址不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  if (payload.isDefault) {
    await clearDefaultAddress(userId);
  }

  const row = await prisma.miniAddress.update({
    where: { id },
    data: {
      school: payload.school,
      receiverName: payload.receiverName,
      phone: payload.phone,
      detail: payload.detail,
      tag: payload.tag,
      isDefault: !!payload.isDefault
    }
  });

  return mapAddress(row);
}

export async function deleteMiniAddress(userId: number, id: number) {
  const exists = await prisma.miniAddress.findFirst({
    where: { id, userId }
  });

  if (!exists) {
    throw new ApiError("地址不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  await prisma.miniAddress.delete({
    where: { id }
  });

  if (exists.isDefault) {
    const latest = await prisma.miniAddress.findFirst({
      where: { userId },
      orderBy: { id: "desc" }
    });

    if (latest) {
      await prisma.miniAddress.update({
        where: { id: latest.id },
        data: { isDefault: true }
      });
    }
  }

  return true;
}

export async function setMiniAddressDefault(userId: number, id: number) {
  const exists = await prisma.miniAddress.findFirst({
    where: { id, userId }
  });

  if (!exists) {
    throw new ApiError("地址不存在", ERROR_CODES.NOT_FOUND, 404);
  }

  await clearDefaultAddress(userId);

  const row = await prisma.miniAddress.update({
    where: { id },
    data: {
      isDefault: true
    }
  });

  return mapAddress(row);
}
