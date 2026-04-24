<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { StoreProductApprovalItem } from "../../api/contracts";
import { getStoreProductApprovalListApi, reviewStoreProductApprovalApi } from "../../api/modules/store";
import { ApiRequestError } from "../../api/request";

const loading = ref(false);
const actionLoading = ref(false);
const list = ref<StoreProductApprovalItem[]>([]);
const total = ref(0);

const query = reactive({
  page: 1,
  pageSize: 10,
  status: "pending",
  keyword: ""
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
    const result = await getStoreProductApprovalListApi(query);
    list.value = result.list;
    total.value = result.total;
  } catch (error) {
    showApiError(error, "审批列表加载失败");
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  loadData();
}

function handlePageChange(page: number) {
  query.page = page;
  loadData();
}

async function reviewApproval(row: StoreProductApprovalItem, status: "approved" | "rejected") {
  try {
    const promptTitle = status === "approved" ? "审批通过" : "审批驳回";
    const { value } = await ElMessageBox.prompt("可选填写审批备注", promptTitle, {
      confirmButtonText: "提交",
      cancelButtonText: "取消",
      inputPlaceholder: status === "approved" ? "例如：按当前方案执行" : "例如：请先同步门店运营方案",
      inputValue: ""
    });

    actionLoading.value = true;
    await reviewStoreProductApprovalApi(row.id, {
      status,
      reviewNote: value || ""
    });
    ElMessage.success(status === "approved" ? "审批已通过" : "审批已驳回");
    await loadData();
  } catch (error) {
    if (error === "cancel") return;
    showApiError(error, "审批提交失败");
  } finally {
    actionLoading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <div class="page-title">商品变更审批</div>
        <div class="page-subtitle">处理学校管理员在并发冲突下提交的商品变更申请</div>
      </div>
    </div>

    <el-card shadow="never" class="filter-card">
      <div class="filter-row">
        <el-select v-model="query.status" class="filter-item" @change="handleSearch">
          <el-option label="待审批" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="全部" value="" />
        </el-select>
        <el-input v-model="query.keyword" class="filter-item" placeholder="按学校 / 商品ID / 原因搜索" clearable @keyup.enter="handleSearch" />
        <el-button type="primary" @click="handleSearch">查询</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="list">
        <el-table-column prop="school" label="学校" min-width="160" />
        <el-table-column prop="storeName" label="店铺" min-width="160" />
        <el-table-column prop="action" label="动作" width="140" />
        <el-table-column prop="targetId" label="商品ID" min-width="160" />
        <el-table-column prop="requestedByName" label="申请人" width="120" />
        <el-table-column prop="status" label="状态" width="110" />
        <el-table-column prop="reason" label="申请原因" min-width="220" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="申请时间" width="180" />
        <el-table-column prop="reviewedByName" label="审批人" width="120" />
        <el-table-column prop="reviewedAt" label="审批时间" width="180" />
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" link type="success" :loading="actionLoading" @click="reviewApproval(row, 'approved')">通过</el-button>
            <el-button v-if="row.status === 'pending'" link type="danger" :loading="actionLoading" @click="reviewApproval(row, 'rejected')">驳回</el-button>
            <span v-else class="muted">已处理</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
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

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #101828;
}

.page-subtitle {
  margin-top: 6px;
  color: #667085;
  font-size: 14px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-item {
  width: 240px;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.muted {
  color: #98a2b3;
}

@media (max-width: 768px) {
  .filter-item {
    width: 100%;
  }
}
</style>
