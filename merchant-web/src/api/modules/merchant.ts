import { request } from "../request";

export interface MerchantSessionResponse {
  token?: string;
  profile: any;
  menuPaths: string[];
  permissions: string[];
}

export function sendCodeApi(payload: { phone: string; scene?: "login" }) {
  return request<{ phone: string; expiresAt: string; isActivated: boolean; mustChangePassword?: boolean; provider: string }>({
    url: "/merchant/auth/send-code",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function codeLoginApi(payload: { phone: string; code: string }) {
  return request<MerchantSessionResponse>({
    url: "/merchant/auth/code-login",
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getSessionApi() {
  return request<MerchantSessionResponse>({
    url: "/merchant/auth/session",
    method: "GET"
  });
}

export const getDashboardApi = () => request<any>({ url: "/merchant/dashboard", method: "GET" });

export const getStoreApi = () => request<any>({ url: "/merchant/store/current", method: "GET" });
export const updateStoreApi = (payload: any) =>
  request<any>({ url: "/merchant/store/current", method: "PUT", body: JSON.stringify(payload) });
export const uploadMerchantImageApi = (payload: { fileName: string; base64: string; scene?: "merchant" }) =>
  request<{ fileName: string; url: string; size: number }>({
    url: "/merchant/upload/image",
    method: "POST",
    body: JSON.stringify(payload)
  });

export const getProductListApi = () => request<any>({ url: "/merchant/product/list", method: "GET" });
export const createProductApi = (payload: any) =>
  request<any>({ url: "/merchant/product", method: "POST", body: JSON.stringify(payload) });
export const updateProductApi = (id: string, payload: any) =>
  request<any>({ url: `/merchant/product/${id}`, method: "PUT", body: JSON.stringify(payload) });
export const toggleProductStatusApi = (id: string) => request<any>({ url: `/merchant/product/${id}/status`, method: "POST" });
export const deleteProductApi = (id: string) => request<any>({ url: `/merchant/product/${id}`, method: "DELETE" });
export const moveProductApi = (id: string, direction: "up" | "down") =>
  request<any>({ url: `/merchant/product/${id}/move`, method: "POST", body: JSON.stringify({ direction }) });
export const batchDownProductsApi = (ids: string[]) =>
  request<any>({ url: "/merchant/product/batch-down", method: "POST", body: JSON.stringify({ ids }) });
export const batchDeleteProductsApi = (ids: string[]) =>
  request<any>({ url: "/merchant/product/batch-delete", method: "POST", body: JSON.stringify({ ids }) });

export const getOrderListApi = (params: any) => request<any>({ url: "/merchant/order/list", method: "GET", params });
export const getOrderDetailApi = (id: number | string) => request<any>({ url: `/merchant/order/${id}`, method: "GET" });
export const acceptOrderApi = (id: number) => request<any>({ url: `/merchant/order/${id}/accept`, method: "POST" });
export const finishOrderApi = (id: number) => request<any>({ url: `/merchant/order/${id}/finish`, method: "POST" });

export const getRefundListApi = () => request<any>({ url: "/merchant/refund/list", method: "GET" });
export const getRefundDetailApi = (id: number | string) => request<any>({ url: `/merchant/refund/${id}`, method: "GET" });
export const reviewRefundApi = (id: number, payload: { status: "已通过" | "已驳回"; reviewNote: string }) =>
  request<any>({ url: `/merchant/refund/${id}/review`, method: "POST", body: JSON.stringify(payload) });

export const getWalletApi = () => request<any>({ url: "/merchant/wallet/overview", method: "GET" });
export const createWithdrawApi = (payload: { amount: number; accountType?: string; accountNo?: string; remark?: string }) =>
  request<any>({ url: "/merchant/wallet/withdraw", method: "POST", body: JSON.stringify(payload) });

export const getMessageListApi = (params?: { keyword?: string; type?: string }) =>
  request<any>({ url: "/merchant/message/list", method: "GET", params });
export const readMessageApi = (id: number) => request<any>({ url: `/merchant/message/${id}/read`, method: "POST" });
export const readAllMessagesApi = (payload?: { type?: "system" | "interactive" }) =>
  request<any>({ url: "/merchant/message/read-all", method: "POST", body: JSON.stringify(payload || {}) });

export const getStatApi = () => request<any>({ url: "/merchant/stat/overview", method: "GET" });
export const getAccountProfileApi = () => request<any>({ url: "/merchant/account/profile", method: "GET" });
export const updateAccountProfileApi = (payload: { name: string; withdrawRealName?: string; acceptWithdrawAgreement?: boolean }) =>
  request<any>({ url: "/merchant/account/profile", method: "PUT", body: JSON.stringify(payload) });
