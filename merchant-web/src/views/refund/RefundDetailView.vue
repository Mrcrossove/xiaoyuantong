<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { getRefundDetailApi, reviewRefundApi } from "../../api/modules/merchant";
import { getMediaLabel, isDisplayImage } from "../../utils/media";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const acting = ref<"approve" | "reject" | "">("");
const detail = ref<any | null>(null);

const refundId = computed(() => Number(route.params.id || 0));

async function loadData() {
  if (!refundId.value) {
    ElMessage.error("退款参数错误");
    router.replace({ name: "merchant-refund" });
    return;
  }

  loading.value = true;
  try {
    detail.value = await getRefundDetailApi(refundId.value);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "退款详情加载失败");
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push({ name: "merchant-refund" });
}

function goOrderDetail() {
  if (!detail.value?.order?.id) return;
  router.push({ name: "merchant-order-detail", params: { id: detail.value.order.id } });
}

async function handleReview(status: "已通过" | "已驳回") {
  if (!detail.value?.canReview) return;
  try {
    const title = status === "已通过" ? "同意退款" : "驳回退款";
    const { value } = await ElMessageBox.prompt("请输入处理备注，可为空", title, {
      inputValue: detail.value.reviewNote || "",
      inputPlaceholder: "处理备注",
      confirmButtonText: "确认",
      cancelButtonText: "取消"
    });

    acting.value = status === "已通过" ? "approve" : "reject";
    await reviewRefundApi(detail.value.id, {
      status,
      reviewNote: value || ""
    });
    ElMessage.success("退款处理完成");
    await loadData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error instanceof Error ? error.message : "退款处理失败");
    }
  } finally {
    acting.value = "";
  }
}

function getRefundTagType(status: string) {
  if (status === "已通过") return "success";
  if (status === "已驳回") return "danger";
  return "warning";
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
        <el-button link type="primary" @click="goBack">返回退款列表</el-button>
        <div class="detail-title">退款详情</div>
        <div class="detail-sub" v-if="detail">退款单号：{{ detail.refundNo }}</div>
      </div>
      <div class="detail-actions" v-if="detail">
        <el-button
          type="success"
          :disabled="!detail.canReview"
          :loading="acting === 'approve'"
          @click="handleReview('已通过')"
        >
          同意退款
        </el-button>
        <el-button
          type="danger"
          :disabled="!detail.canReview"
          :loading="acting === 'reject'"
          @click="handleReview('已驳回')"
        >
          驳回退款
        </el-button>
      </div>
    </div>

    <template v-if="detail">
      <el-row :gutter="16">
        <el-col :xs="24" :lg="16">
          <el-card>
            <template #header>
              <div class="card-title">退款进度</div>
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
              <div class="card-title">关联订单</div>
            </template>
            <div class="product-card">
              <div class="media-box">
                <img v-if="isDisplayImage(detail.order.productCover)" :src="detail.order.productCover" alt="商品图片" />
                <div v-else class="media-placeholder">{{ getMediaLabel(detail.order.productCover, "商品") }}</div>
              </div>
              <div class="product-main">
                <div class="product-name">{{ detail.order.productName }}</div>
                <div class="product-desc">{{ detail.order.productDesc || "暂无商品描述" }}</div>
                <div class="product-grid">
                  <div>订单号：{{ detail.order.orderNo }}</div>
                  <div>店铺：{{ detail.order.storeName }}</div>
                  <div>单价：¥{{ detail.order.unitPrice }}</div>
                  <div>数量：{{ detail.order.quantity }}</div>
                  <div>订单金额：¥{{ detail.order.amount }}</div>
                  <div>支付状态：{{ detail.order.payStatus }}</div>
                </div>
                <div class="jump-row">
                  <el-button type="primary" plain @click="goOrderDetail">查看订单详情</el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="8">
          <el-card>
            <template #header>
              <div class="card-title">退款信息</div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="退款状态">
                <el-tag :type="getRefundTagType(detail.status)">{{ detail.status }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="退款金额">¥{{ detail.amount }}</el-descriptions-item>
              <el-descriptions-item label="申请时间">{{ detail.applyTime }}</el-descriptions-item>
              <el-descriptions-item label="处理时间">{{ detail.reviewedAt || "-" }}</el-descriptions-item>
              <el-descriptions-item label="学校">{{ detail.school }}</el-descriptions-item>
              <el-descriptions-item label="退款原因">{{ detail.reason }}</el-descriptions-item>
              <el-descriptions-item label="处理备注">{{ detail.reviewNote || "-" }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-title">订单状态</div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="处理状态">
                <el-tag :type="getOrderTagType(detail.order.merchantStatusText)">{{ detail.order.merchantStatusText }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="支付状态">
                <el-tag :type="getPayTagType(detail.order.payStatus)">{{ detail.order.payStatus }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="下单时间">{{ detail.order.createdAt }}</el-descriptions-item>
              <el-descriptions-item label="支付时间">{{ detail.order.paidAt || "-" }}</el-descriptions-item>
              <el-descriptions-item label="完成时间">{{ detail.order.finishedAt || "-" }}</el-descriptions-item>
              <el-descriptions-item label="关闭时间">{{ detail.order.canceledAt || "-" }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-title">收货信息</div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="收货人">{{ detail.order.receiverName }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ detail.order.receiverPhone }}</el-descriptions-item>
              <el-descriptions-item label="地址标签">{{ detail.order.addressTag || "-" }}</el-descriptions-item>
              <el-descriptions-item label="收货地址">{{ detail.order.receiverAddress }}</el-descriptions-item>
            </el-descriptions>
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

.jump-row {
  margin-top: 16px;
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
