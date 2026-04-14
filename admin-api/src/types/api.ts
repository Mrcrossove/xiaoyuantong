export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
  traceId: string;
}

export interface PageResult<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface BatchIdsPayload {
  ids: number[];
}

export interface BatchStatusPayload extends BatchIdsPayload {
  status: string;
}
