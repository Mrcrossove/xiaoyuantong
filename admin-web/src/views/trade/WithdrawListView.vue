<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { WithdrawItem } from "../../api/contracts";
import { getWithdrawListApi, reviewWithdrawApi, syncWithdrawTransferApi } from "../../api/modules/trade";

const loading = ref(false);
const syncingId = ref(0);
const list = ref<WithdrawItem[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 10,
  school: "",
  status: "",
  transferStatus: "",
  keyword: ""
});

const schoolOptions = computed(() => [...new Set(list.value.map((item) => item.school).filter(Boolean))]);
const pendingCount = computed(() => list.value.filter((item) => item.reviewStatus === "待审核").length);
const processingCount = computed(() => list.value.filter((item) => item.transferStatus === "打款中").length);
const successCount = computed(() => list.value.filter((item) => item.transferStatus === "打款成功").length);

function tagType(status: string) {
  if (status === "待审核" || status === "打款中") return "warning";
  if (status === "已通过" || status === "打款成功") return "success";
  if (status === "已驳回" || status === "打款失败") return "danger";
  return "info";
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getWithdrawListApi(query);
    list.value = result.list;
    total.value = result.total;
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

    ElMessage.success("提现审核已提交");
    await loadData();
  } catch (error) {
    if (error === "cancel") return;
  }
}

async function handleSync(row: WithdrawItem) {
  syncingId.value = row.id;
  try {
    await syncWithdrawTransferApi(row.id);
    ElMessage.success("打款状态已同步");
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "打款状态同步失败");
  } finally {
    syncingId.value = 0;
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
  query.transferStatus = "";
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
        <el-card shadow="never"><div class="metric-label">待审核/打款中</div><div class="metric-value warning">{{ pendingCount + processingCount }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">打款成功</div><div class="metric-value success">{{ successCount }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>提现筛选</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索提现单号、账户或卡号" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="审核状态" clearable class="select">
          <el-option label="待审核" value="待审核" />
          <el-option label="已通过" value="已通过" />
          <el-option label="已驳回" value="已驳回" />
        </el-select>
        <el-select v-model="query.transferStatus" placeholder="打款状态" clearable class="select">
          <el-option label="待打款" value="待打款" />
          <el-option label="打款中" value="打款中" />
          <el-option label="打款成功" value="打款成功" />
          <el-option label="打款失败" value="打款失败" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>提现审核列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="withdrawNo" label="提现单号" min-width="180" />
        <el-table-column prop="school" label="高校" min-width="120" />
        <el-table-column prop="accountName" label="账户名称" min-width="140" />
        <el-table-column label="提现金额" width="120">
          <template #default="{ row }">￥{{ Number(row.amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="bankName" label="提现账户" width="120" />
        <el-table-column label="审核状态" width="110">
          <template #default="{ row }">
            <el-tag :type="tagType(row.reviewStatus || row.status)">{{ row.reviewStatus || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="打款状态" width="110">
          <template #default="{ row }">
            <el-tag :type="tagType(row.transferStatus || '待打款')">{{ row.transferStatus || "待打款" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyTime" label="申请时间" width="168" />
        <el-table-column prop="reviewedAt" label="审核时间" width="168" />
        <el-table-column prop="transferSuccessAt" label="到账时间" width="168" />
        <el-table-column prop="transferOutBillNo" label="商户打款单号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="transferBillNo" label="微信打款单号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="reviewNote" label="审核备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="transferFailReason" label="失败原因" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="'withdraw:review'"
              link
              type="success"
              :disabled="row.reviewStatus !== '待审核'"
              @click="handleReview(row, '已通过')"
            >
              通过
            </el-button>
            <el-button
              v-permission="'withdraw:review'"
              link
              type="danger"
              :disabled="row.reviewStatus !== '待审核'"
              @click="handleReview(row, '已驳回')"
            >
              驳回
            </el-button>
            <el-button
              v-permission="'withdraw:review'"
              link
              type="primary"
              :loading="syncingId === row.id"
              :disabled="row.reviewStatus !== '已通过' || row.transferStatus === '打款成功'"
              @click="handleSync(row)"
            >
              查单
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
