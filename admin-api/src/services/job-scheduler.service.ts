import { env } from "../config/env";
import { syncPendingMiniProfitSharingReturnOrders } from "./mini-profit-sharing-return.service";
import { syncPendingMiniProfitSharingOrders } from "./mini-profit-sharing.service";
import { syncPendingMiniWithdrawTransferBills } from "./mini-withdraw-transfer.service";

let started = false;
let syncing = false;

export function startBackgroundJobs() {
  if (started || env.payUseMock) {
    return;
  }

  started = true;
  const intervalMs = Math.max(Number(process.env.WECHAT_PAYMENT_SYNC_INTERVAL_MS || 120000), 30000);

  setInterval(async () => {
    if (syncing) {
      return;
    }

    syncing = true;
    try {
      await Promise.all([
        syncPendingMiniProfitSharingOrders(20),
        syncPendingMiniProfitSharingReturnOrders(20),
        syncPendingMiniWithdrawTransferBills(20)
      ]);
    } catch (error) {
      console.error("wechat payment sync failed", error);
    } finally {
      syncing = false;
    }
  }, intervalMs);
}
