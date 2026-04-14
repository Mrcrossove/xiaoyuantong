<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { StoreApplyItem } from "../../api/contracts";
import { getStoreApplyListApi, reviewStoreApplyApi } from "../../api/modules/store";
import { ApiRequestError } from "../../api/request";

const loading = ref(false);
const list = ref<StoreApplyItem[]>([]);
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
    const result = await getStoreApplyListApi(query);
    list.value = result.list;
    total.value = result.total;
  } catch (error) {
    showApiError(error, "入驻申请加载失败");
  } finally {
    loading.value = false;
  }
}

async function handleReview(row: StoreApplyItem, status: "已通过" | "已驳回") {
  try {
    const { value } = await ElMessageBox.prompt("请输入审核备注，可为空", status === "已通过" ? "入驻通过" : "入驻驳回", {
      inputValue: row.reviewNote || "",
      inputPlaceholder: "审核备注",
      confirmButtonText: "确认",
      cancelButtonText: "取消"
    });

    await reviewStoreApplyApi(row.id, {
      status,
      reviewNote: value || ""
    });

    ElMessage.success("审核完成");
    await loadData();
  } catch (error) {
    if (error !== "cancel") {
      showApiError(error, "入驻审核失败");
    }
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
        <el-card shadow="never"><div class="metric-label">申请总数</div><div class="metric-value">{{ total }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">待审核</div><div class="metric-value warning">{{ pendingCount }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">已通过</div><div class="metric-value success">{{ approvedCount }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>申请筛选</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索店铺名、联系人或手机号" clearable class="input" @keyup.enter="handleSearch" />
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
      <template #header>店铺入驻申请</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="storeName" label="店铺名称" min-width="220" />
        <el-table-column prop="school" label="高校" min-width="180" />
        <el-table-column prop="category" label="店铺分类" width="120" />
        <el-table-column prop="contactName" label="联系人" width="120" />
        <el-table-column prop="contactPhone" label="联系手机" width="140" />
        <el-table-column prop="description" label="经营说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="审核状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '已通过' ? 'success' : row.status === '待审核' ? 'warning' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewNote" label="审核备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="提交时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === '待审核'"
              v-permission="'store:apply:approve'"
              link
              type="success"
              @click="handleReview(row, '已通过')"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === '待审核'"
              v-permission="'store:apply:reject'"
              link
              type="danger"
              @click="handleReview(row, '已驳回')"
            >
              驳回
            </el-button>
            <span v-else class="muted">已审核</span>
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
.muted {
  color: #98a2b3;
}
</style>
