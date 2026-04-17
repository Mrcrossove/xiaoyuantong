<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { acceptOrderApi, finishOrderApi, getOrderDetailApi } from "../../api/modules/merchant";
import { getMediaLabel, isDisplayImage } from "../../utils/media";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const acting = ref<"accept" | "finish" | "">("");
const detail = ref<any | null>(null);

const orderId = computed(() => Number(route.params.id || 0));

async function loadData() {
  if (!orderId.value) {
    ElMessage.error("订单参数错误");
    router.replace({ name: "merchant-order" });
    return;
  }

  loading.value = true;
  try {
    detail.value = await getOrderDetailApi(orderId.value);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "订单详情加载失败");
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push({ name: "merchant-order" });
}

function goRefundDetail(refundId: number) {
  router.push({ name: "merchant-refund-detail", params: { id: refundId } });
}

async function handleAccept() {
  if (!detail.value?.canAccept) return;
  try {
    await ElMessageBox.confirm(`确认接单订单 ${detail.value.orderNo} 吗？`, "接单确认", { type: "warning" });
    acting.value = "accept";
    await acceptOrderApi(detail.value.id);
    ElMessage.success("订单已接单");
    await loadData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error instanceof Error ? error.message : "接单失败");
    }
  } finally {
    acting.value = "";
  }
}

async function handleFinish() {
  if (!detail.value?.canFinish) return;
  try {
    await ElMessageBox.confirm(`确认将订单 ${detail.value.orderNo} 标记为已完成吗？`, "完成订单", { type: "warning" });
    acting.value = "finish";
    await finishOrderApi(detail.value.id);
    ElMessage.success("订单已完成");
    await loadData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error instanceof Error ? error.message : "完成订单失败");
    }
  } finally {
    acting.value = "";
  }
}

function getOrderTagType(status: string) {
  if (status === "已完成") return "success";
  if (status === "已取消") return "info";
  if (status === "待支付") return "danger";
  return "warning";
}

function getPayTagType(status: string) {
  if (status === "已支付") return "success";
  if (status === "已退款") return "warning";
  return "info";
}

function getRefundTagType(status: string) {
  if (status === "已通过") return "success";
  if (status === "已驳回") return "danger";
  return "warning";
}

watch(
  () => route.params.id,
  () => {
    loadData();
  },
  { immediate: true }
);
</script>

<template>
  <div class="page" v-loading="loading">
    <div class="detail-header">
      <div>
        <el-button link type="primary" @click="goBack">返回订单列表</el-button>
        <div class="detail-title">订单详情</div>
        <div class="detail-sub" v-if="detail">订单号：{{ detail.orderNo }}</div>
      </div>
      <div class="detail-actions" v-if="detail">
        <el-button
          type="warning"
          :disabled="!detail.canAccept"
          :loading="acting === 'accept'"
          @click="handleAccept"
        >
          接单
        </el-button>
        <el-button
          type="success"
          :disabled="!detail.canFinish"
          :loading="acting === 'finish'"
          @click="handleFinish"
        >
          完成订单
        </el-button>
      </div>
    </div>

    <template v-if="detail">
      <el-row :gutter="16">
        <el-col :xs="24" :lg="16">
          <el-card>
            <template #header>
              <div class="card-title">订单进度</div>
            </template>
            <el-timeline>
              <el-timeline-item
                v-for="(item, index) in detail.timeline"
                :key="`${item.title}-${index}`"
                :timestamp="item.time || undefined"
              >
                <div class="timeline-title">{{ item.title }}</div>
                <div class="timeline-desc">{{ item.desc }}</div>
              </el-timeline-item>
            </el-timeline>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-title">商品信息</div>
            </template>
            <div class="product-card">
              <div class="media-box">
                <img v-if="isDisplayImage(detail.product.cover)" :src="detail.product.cover" alt="商品图片" />
                <div v-else class="media-placeholder">{{ getMediaLabel(detail.product.cover, "商品") }}</div>
              </div>
              <div class="product-main">
                <div class="product-name">{{ detail.product.name }}</div>
                <div class="product-desc">{{ detail.product.desc || "暂无商品描述" }}</div>
                <div class="product-grid">
                  <div>单价：¥{{ detail.product.unitPrice }}</div>
                  <div>数量：{{ detail.product.quantity }}</div>
                  <div>实付金额：¥{{ detail.product.amount }}</div>
                  <div>商品编号：{{ detail.product.id }}</div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card v-if="detail.refunds?.length">
            <template #header>
              <div class="card-title">关联退款</div>
            </template>
            <el-table :data="detail.refunds" empty-text="暂无退款记录">
              <el-table-column prop="refundNo" label="退款单号" min-width="180" />
              <el-table-column prop="amount" label="退款金额" width="100">
                <template #default="{ row }">¥{{ row.amount }}</template>
              </el-table-column>
              <el-table-column prop="reason" label="退款原因" min-width="180" show-overflow-tooltip />
              <el-table-column label="状态" width="110">
                <template #default="{ row }">
                  <el-tag :type="getRefundTagType(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="applyTime" label="申请时间" min-width="170" />
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="goRefundDetail(row.id)">查看详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="8">
          <el-card>
            <template #header>
              <div class="card-title">订单状态</div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="处理状态">
                <el-tag :type="getOrderTagType(detail.merchantStatusText)">{{ detail.merchantStatusText }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="支付状态">
                <el-tag :type="getPayTagType(detail.payStatus)">{{ detail.payStatus }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="学校">{{ detail.school }}</el-descriptions-item>
              <el-descriptions-item label="店铺">{{ detail.storeName }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ detail.createdAt || "-" }}</el-descriptions-item>
              <el-descriptions-item label="支付时间">{{ detail.paidAt || "-" }}</el-descriptions-item>
              <el-descriptions-item label="完成时间">{{ detail.finishedAt || "-" }}</el-descriptions-item>
              <el-descriptions-item label="关闭时间">{{ detail.canceledAt || "-" }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-title">收货信息</div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="收货人">{{ detail.receiver.name }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ detail.receiver.phone }}</el-descriptions-item>
              <el-descriptions-item label="地址标签">{{ detail.receiver.tag || "-" }}</el-descriptions-item>
              <el-descriptions-item label="收货地址">{{ detail.receiver.address }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-title">备注信息</div>
            </template>
            <div class="remark-box">{{ detail.remark || "用户未填写备注" }}</div>
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<style scoped>
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.detail-title {
  margin-top: 4px;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.detail-sub {
  margin-top: 8px;
  color: #667085;
  font-size: 14px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
}

.timeline-title {
  font-weight: 700;
  color: #111827;
}

.timeline-desc {
  margin-top: 4px;
  color: #667085;
}

.product-card {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 16px;
}

.media-box,
.media-placeholder {
  width: 140px;
  height: 140px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #dbe4f0;
  background: linear-gradient(135deg, #eff6ff, #f8fbff);
}

.media-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-placeholder {
  display: grid;
  place-items: center;
  color: #1d4ed8;
  font-weight: 700;
}

.product-name {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.product-desc {
  margin-top: 8px;
  color: #667085;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
  color: #344054;
}

.remark-box {
  min-height: 88px;
  padding: 14px;
  border-radius: 12px;
  background: #f8fafc;
  color: #344054;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
  }

  .product-card {
    grid-template-columns: 1fr;
  }
}
</style>
