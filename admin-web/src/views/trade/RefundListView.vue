<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { RefundItem } from "../../api/contracts";
import { getRefundListApi, reviewRefundApi } from "../../api/modules/trade";

const loading = ref(false);
const list = ref<RefundItem[]>([]);
const total = ref(0);
const summary = ref({
  total: 0,
  pendingCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  schoolOptions: [] as string[]
});
const query = reactive({
  page: 1,
  pageSize: 10,
  school: "",
  status: "",
  keyword: ""
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getRefundListApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } finally {
    loading.value = false;
  }
}

async function handleReview(row: RefundItem, status: "已通过" | "已驳回") {
  try {
    const title = status === "已通过" ? "通过退款" : "驳回退款";
    const { value } = await ElMessageBox.prompt("请输入审核备注，可为空。", title, {
      inputValue: row.reviewNote || "",
      inputPlaceholder: "审核备注",
      confirmButtonText: "确认",
      cancelButtonText: "取消"
    });

    await reviewRefundApi(row.id, {
      status,
      reviewNote: value || ""
    });

    ElMessage.success("退款审核完成");
    await loadData();
  } catch (error) {
    if (error === "cancel") return;
  }
}

function handleSearch() {
  query.page = 1;
  loadData();
}

function handleReset() {
  query.page = 1;
  query.school = "";
  query.status = "";
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
        <el-card shadow="never"><div class="metric-label">退款总数</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">待审核</div><div class="metric-value warning">{{ summary.pendingCount }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">已通过</div><div class="metric-value success">{{ summary.approvedCount }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">已驳回</div><div class="metric-value danger">{{ summary.rejectedCount }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索退款单号、订单号、用户或退款原因"
          clearable
          class="input"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="待审核" value="待审核" />
          <el-option label="已通过" value="已通过" />
          <el-option label="已驳回" value="已驳回" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>退款列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="refundNo" label="退款单号" min-width="160" />
        <el-table-column prop="orderNo" label="订单号" min-width="160" />
        <el-table-column prop="school" label="高校" min-width="140" />
        <el-table-column prop="buyer" label="买家" width="120" />
        <el-table-column label="退款金额" width="120">
          <template #default="{ row }">¥{{ Number(row.amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" min-width="180" show-overflow-tooltip />
        <el-table-column prop="applyTime" label="申请时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已通过' ? 'success' : row.status === '待审核' ? 'warning' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewerName" label="审核人" width="120" />
        <el-table-column prop="reviewNote" label="审核备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="reviewedAt" label="审核时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="'refund:review'"
              link
              type="success"
              :disabled="row.status !== '待审核'"
              @click="handleReview(row, '已通过')"
            >
              通过
            </el-button>
            <el-button
              v-permission="'refund:review'"
              link
              type="danger"
              :disabled="row.status !== '待审核'"
              @click="handleReview(row, '已驳回')"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
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
.metric-value.danger {
  color: #dc2626;
}
.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.input {
  width: 320px;
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
