<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { WithdrawItem } from "../../api/contracts";
import { getWithdrawListApi, reviewWithdrawApi } from "../../api/modules/trade";

const loading = ref(false);
const list = ref<WithdrawItem[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 10,
  school: "",
  status: "",
  keyword: ""
});

const schoolOptions = computed(() => [...new Set(list.value.map((item) => item.school).filter(Boolean))]);
const pendingCount = computed(() => list.value.filter((item) => item.status === "待审核").length);
const approvedCount = computed(() => list.value.filter((item) => item.status === "已通过").length);

async function loadData() {
  loading.value = true;
  try {
    const result = await getWithdrawListApi(query);
    if (Array.isArray(result)) {
      list.value = result as unknown as WithdrawItem[];
      total.value = list.value.length;
    } else {
      list.value = result.list;
      total.value = result.total;
    }
  } finally {
    loading.value = false;
  }
}

async function handleReview(row: WithdrawItem, status: "已通过" | "已驳回") {
  try {
    const { value } = await ElMessageBox.prompt("请输入审核备注，可为空", status === "已通过" ? "提现通过" : "提现驳回", {
      inputValue: row.reviewNote || "",
      inputPlaceholder: "审核备注",
      confirmButtonText: "确认",
      cancelButtonText: "取消"
    });

    await reviewWithdrawApi(row.id, {
      status,
      reviewNote: value || ""
    });

    ElMessage.success("审核完成");
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
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">提现总数</div><div class="metric-value">{{ total }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">待审核</div><div class="metric-value warning">{{ pendingCount }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">已通过</div><div class="metric-value success">{{ approvedCount }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>提现筛选</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索提现单号、账户或卡号" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in schoolOptions" :key="item" :label="item" :value="item" />
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
      <template #header>提现审核列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="withdrawNo" label="提现单号" min-width="180" />
        <el-table-column prop="school" label="高校" min-width="140" />
        <el-table-column prop="accountName" label="账户名称" min-width="160" />
        <el-table-column label="提现金额" width="120">
          <template #default="{ row }">￥{{ Number(row.amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="bankName" label="提现账户" width="140" />
        <el-table-column prop="applyTime" label="申请时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已通过' ? 'success' : row.status === '待审核' ? 'warning' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewNote" label="审核备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'withdraw:review'" link type="success" :disabled="row.status !== '待审核'" @click="handleReview(row, '已通过')">通过</el-button>
            <el-button v-permission="'withdraw:review'" link type="danger" :disabled="row.status !== '待审核'" @click="handleReview(row, '已驳回')">驳回</el-button>
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
