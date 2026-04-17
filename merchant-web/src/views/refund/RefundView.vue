<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { getRefundListApi, reviewRefundApi } from "../../api/modules/merchant";

const router = useRouter();
const loading = ref(false);
const actingId = ref<number | null>(null);
const list = ref<any[]>([]);

const summary = computed(() => ({
  pendingCount: list.value.filter((item) => item.status === "待审核").length,
  approvedCount: list.value.filter((item) => item.status === "已通过").length,
  rejectedCount: list.value.filter((item) => item.status === "已驳回").length
}));

async function loadData() {
  loading.value = true;
  try {
    const result = await getRefundListApi();
    list.value = result.list || [];
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "退款列表加载失败");
  } finally {
    loading.value = false;
  }
}

function goDetail(row: any) {
  router.push({ name: "merchant-refund-detail", params: { id: row.id } });
}

async function handleReview(row: any, status: "已通过" | "已驳回") {
  try {
    const title = status === "已通过" ? "同意退款" : "驳回退款";
    const { value } = await ElMessageBox.prompt("请输入处理备注，可为空", title, {
      inputValue: row.reviewNote || "",
      inputPlaceholder: "处理备注",
      confirmButtonText: "确认",
      cancelButtonText: "取消"
    });

    actingId.value = row.id;
    await reviewRefundApi(row.id, {
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
    actingId.value = null;
  }
}

function getRefundTagType(status: string) {
  if (status === "已通过") return "success";
  if (status === "已驳回") return "danger";
  return "warning";
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="metric-label">待处理退款</div>
          <div class="metric-value">{{ summary.pendingCount }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="metric-label">已通过退款</div>
          <div class="metric-value">{{ summary.approvedCount }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="metric-label">已驳回退款</div>
          <div class="metric-value">{{ summary.rejectedCount }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card v-loading="loading">
      <template #header>
        <div class="section-title">售后退款列表</div>
      </template>
      <el-table :data="list" empty-text="暂无退款记录">
        <el-table-column label="退款单号" min-width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row)">{{ row.refundNo }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column prop="productName" label="商品" min-width="160" />
        <el-table-column prop="amount" label="退款金额" width="100">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getRefundTagType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewNote" label="处理备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="applyTime" label="申请时间" min-width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row)">查看详情</el-button>
            <el-button
              link
              type="success"
              :loading="actingId === row.id"
              :disabled="!row.canReview"
              @click="handleReview(row, '已通过')"
            >
              同意
            </el-button>
            <el-button
              link
              type="danger"
              :loading="actingId === row.id"
              :disabled="!row.canReview"
              @click="handleReview(row, '已驳回')"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 700;
}
</style>
