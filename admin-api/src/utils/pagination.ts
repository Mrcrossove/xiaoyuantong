import { ApiError } from "./api-error";
import { ERROR_CODES } from "../constants/error-codes";

export function parsePositiveInt(value: unknown, fallback: number) {
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) return fallback;
  return Math.floor(num);
}

export function parsePageParams(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const pageSize = parsePositiveInt(query.pageSize, 10);
  if (pageSize > 100) {
    throw new ApiError("参数错误：pageSize 最大为 100", ERROR_CODES.BAD_REQUEST, 400);
  }
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize
  };
}
