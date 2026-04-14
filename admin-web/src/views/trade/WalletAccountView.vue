<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { WalletAccountItem } from "../../api/contracts";
import { getWalletAccountListApi } from "../../api/modules/trade";
import { ApiRequestError } from "../../api/request";
import { exportTableToCsv } from "../../utils/export";

const loading = ref(false);
const list = ref<WalletAccountItem[]>([]);
const total = ref(0);
const summary = ref({
  total: 0,
  balanceTotal: 0,
  frozenTotal: 0,
  withdrawableTotal: 0,
  schoolOptions: [] as string[]
});

const query = reactive({
  page: 1,
  pageSize: 10,
  school: "",
  status: ""
});

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
    const result = await getWalletAccountListApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } catch (error) {
    showApiError(error, "钱包账户加载失败");
  } finally {
    loading.value = false;
  }
}

function exportData() {
  exportTableToCsv(
    "钱包账户",
    ["账户名称", "账户类型", "所属高校", "账户余额", "冻结金额", "可提现金额", "状态"],
    list.value.map((item) => [
      item.accountName,
      item.accountType,
      item.school,
      item.balance.toFixed(2),
      item.frozenAmount.toFixed(2),
      item.withdrawableAmount.toFixed(2),
      item.status
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
  query.status = "";
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
        <el-card shadow="never"><div class="metric-label">账户总数</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">账户余额</div><div class="metric-value">￥{{ summary.balanceTotal.toFixed(2) }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">冻结金额</div><div class="metric-value warning">￥{{ summary.frozenTotal.toFixed(2) }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">可提现金额</div><div class="metric-value success">￥{{ summary.withdrawableTotal.toFixed(2) }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="正常" value="正常" />
          <el-option label="冻结" value="冻结" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-permission="'wallet:export'" @click="exportData">导出</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>钱包账户列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="accountName" label="账户名称" min-width="220" />
        <el-table-column prop="accountType" label="账户类型" width="120" />
        <el-table-column prop="school" label="所属高校" min-width="140" />
        <el-table-column label="账户余额" width="120">
          <template #default="{ row }">￥{{ row.balance.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="冻结金额" width="120">
          <template #default="{ row }">￥{{ row.frozenAmount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="可提现" width="120">
          <template #default="{ row }">￥{{ row.withdrawableAmount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'danger'">{{ row.status }}</el-tag>
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
.page { display: grid; gap: 16px; }
.metric-label { color: #667085; font-size: 14px; }
.metric-value { margin-top: 12px; font-size: 30px; font-weight: 700; }
.metric-value.success { color: #16a34a; }
.metric-value.warning { color: #d97706; }
.toolbar { display: flex; gap: 12px; }
.select { width: 180px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
