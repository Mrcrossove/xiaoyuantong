<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { AdminOrderItem } from "../../api/contracts";
import { getAdminOrderListApi } from "../../api/modules/trade";
import { ApiRequestError } from "../../api/request";
import { exportTableToCsv } from "../../utils/export";

const loading = ref(false);
const list = ref<AdminOrderItem[]>([]);
const total = ref(0);
const summary = ref({
  paidAmount: 0
});
const query = reactive({
  page: 1,
  pageSize: 10,
  school: "",
  payStatus: "",
  orderStatus: "",
  keyword: ""
});

const schoolOptions = computed(() => [...new Set(list.value.map((item) => item.school).filter(Boolean))]);
const paidCount = computed(() => list.value.filter((item) => item.payStatus === "已支付").length);
const amountTotal = computed(() => Number(summary.value.paidAmount || 0));
const pendingSettlementCount = computed(() => list.value.filter((item) => item.settlementStatus === "待结算").length);

function showApiError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    ElMessage.error(error.traceId ? `${error.message}（追踪号: ${error.traceId}）` : error.message);
    return;
  }
  if (error instanceof Error) {
    ElMessage.error(error.message);
    return;
  }
  ElMessage.error(fallback);
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getAdminOrderListApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = {
      paidAmount: Number((result as any).summary?.paidAmount || 0)
    };
  } catch (error) {
    showApiError(error, "订单列表加载失败");
  } finally {
    loading.value = false;
  }
}

function exportData() {
  exportTableToCsv(
    "订单列表",
    ["订单号", "高校", "买家", "店铺", "金额", "支付状态", "订单状态", "结算状态", "创建时间"],
    list.value.map((item) => [
      item.orderNo,
      item.school,
      item.buyer,
      item.storeName,
      Number(item.amount || 0).toFixed(2),
      item.payStatus,
      item.orderStatus,
      item.settlementStatus,
      item.createdAt
    ])
  );
  ElMessage.success("当前页已导出");
}

function handleSearch() {
  query.page = 1;
  loadData();
}

function handleReset() {
  query.page = 1;
  query.school = "";
  query.payStatus = "";
  query.orderStatus = "";
  query.keyword = "";
  loadData();
}

function handlePageChange(page: number) {
  query.page = page;
  loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">订单总数</div><div class="metric-value">{{ total }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">订单金额</div><div class="metric-value">￥{{ amountTotal.toFixed(2) }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">已支付</div><div class="metric-value success">{{ paidCount }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">待结算</div><div class="metric-value warning">{{ pendingSettlementCount }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>订单筛选</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索订单号、店铺或买家" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.payStatus" placeholder="支付状态" clearable class="select">
          <el-option label="已支付" value="已支付" />
          <el-option label="待支付" value="待支付" />
        </el-select>
        <el-select v-model="query.orderStatus" placeholder="订单状态" clearable class="select">
          <el-option label="待支付" value="待支付" />
          <el-option label="进行中" value="进行中" />
          <el-option label="已完成" value="已完成" />
          <el-option label="已取消" value="已取消" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-permission="'order:export'" @click="exportData">导出</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>订单列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column prop="school" label="高校" min-width="150" />
        <el-table-column prop="buyer" label="买家" width="120" />
        <el-table-column prop="storeName" label="店铺" min-width="180" />
        <el-table-column label="金额" width="110">
          <template #default="{ row }">￥{{ Number(row.amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="payStatus" label="支付状态" width="120" />
        <el-table-column prop="orderStatus" label="订单状态" width="120" />
        <el-table-column prop="settlementStatus" label="结算状态" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          :page-size="query.pageSize"
          :current-page="query.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}
.metric-label {
  color: #667085;
  font-size: 14px;
}
.metric-value {
  margin-top: 12px;
  font-size: 30px;
  font-weight: 700;
}
.metric-value.success {
  color: #16a34a;
}
.metric-value.warning {
  color: #d97706;
}
.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.input {
  width: 280px;
}
.select {
  width: 180px;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
