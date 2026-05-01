import type {
  AdminOrderItem,
  AdminOrderQuery,
  PageResult,
  RefundItem,
  RefundListResult,
  RefundQuery,
  RefundReviewPayload,
  StoreSettlementConfigItem,
  StoreSettlementConfigListResult,
  StoreSettlementConfigPayload,
  StoreSettlementConfigQuery,
  WalletAccountListResult,
  WalletAccountQuery,
  WithdrawItem,
  WithdrawQuery,
  WithdrawReviewPayload
} from "../contracts";
import { request } from "../request";

export function getRefundListApi(query: RefundQuery) {
  return request<RefundListResult>({
    url: "/trade/admin/refund/list",
    method: "GET",
    params: query
  });
}

export function reviewRefundApi(id: number, payload: RefundReviewPayload) {
  return request<RefundItem>({
    url: `/trade/admin/refund/${id}/review`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getWalletAccountListApi(query: WalletAccountQuery) {
  return request<WalletAccountListResult>({
    url: "/mini/wallet/admin/account/list",
    method: "GET",
    params: query
  });
}

export function getAdminOrderListApi(query: AdminOrderQuery) {
  return request<PageResult<AdminOrderItem>>({
    url: "/mini/order/admin/list",
    method: "GET",
    params: query
  });
}

export function getWithdrawListApi(query: WithdrawQuery) {
  return request<PageResult<WithdrawItem>>({
    url: "/mini/wallet/admin/withdraw/list",
    method: "GET",
    params: query
  });
}

export function reviewWithdrawApi(id: number, payload: WithdrawReviewPayload) {
  return request<WithdrawItem>({
    url: `/mini/wallet/admin/withdraw/${id}/review`,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function syncWithdrawTransferApi(id: number) {
  return request<WithdrawItem>({
    url: `/mini/wallet/admin/withdraw/${id}/sync`,
    method: "POST"
  });
}

export function getStoreSettlementConfigListApi(query: StoreSettlementConfigQuery) {
  return request<StoreSettlementConfigListResult>({
    url: "/trade/admin/settlement/store/list",
    method: "GET",
    params: query
  });
}

export function updateStoreSettlementConfigApi(id: number, payload: StoreSettlementConfigPayload) {
  return request<StoreSettlementConfigItem>({
    url: `/trade/admin/settlement/store/${id}`,
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
