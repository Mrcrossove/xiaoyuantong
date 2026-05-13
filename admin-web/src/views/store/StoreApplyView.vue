<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { StoreApplyItem } from "../../api/contracts";
import { getStoreApplyListApi, reviewStoreApplyApi, takedownStoreApplyApi } from "../../api/modules/store";
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

const APPLY_STATUS_PENDING = "\u5f85\u5ba1\u6838";
const APPLY_STATUS_APPROVED = "\u5df2\u901a\u8fc7";
const APPLY_STATUS_REJECTED = "\u5df2\u9a73\u56de";
const STORE_STATUS_OPEN = "\u8425\u4e1a\u4e2d";
const STORE_STATUS_TAKEDOWN = "\u5df2\u4e0b\u67b6";

const schoolOptions = computed(() => [...new Set(list.value.map((item) => item.school).filter(Boolean))]);
const pendingCount = computed(() => list.value.filter((item) => item.status === APPLY_STATUS_PENDING).length);
const approvedCount = computed(() => list.value.filter((item) => item.status === APPLY_STATUS_APPROVED).length);
const canTakedown = (row: StoreApplyItem) => row.status === APPLY_STATUS_APPROVED && row.storeStatus === STORE_STATUS_OPEN;

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

async function handleReview(row: StoreApplyItem, status: string) {
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

async function handleTakedown(row: StoreApplyItem) {
  try {
    const { value } = await ElMessageBox.prompt(
      "下架后小程序不再展示该店铺，商家账号停用，商品全部下架，历史交易数据保留。请填写下架原因",
      "下架店铺",
      {
        inputType: "textarea",
        inputPlaceholder: "请填写下架原因",
        inputValidator: (value) => {
          const reason = String(value || "").trim();
          if (!reason) return "请填写下架原因";
          if (reason.length > 200) return "下架原因最多 200 个字";
          return true;
        },
        confirmButtonText: "确认下架",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger"
      }
    );

    await takedownStoreApplyApi(row.id, {
      reason: String(value || "").trim()
    });

    ElMessage.success("店铺已下架");
    await loadData();
  } catch (error) {
    if (error !== "cancel") {
      showApiError(error, "店铺下架失败");
    }
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
            <el-tag :type="row.status === APPLY_STATUS_APPROVED ? 'success' : row.status === APPLY_STATUS_PENDING ? 'warning' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="店铺状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.storeStatus" :type="row.storeStatus === STORE_STATUS_OPEN ? 'success' : 'info'">{{ row.storeStatus }}</el-tag>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="reviewNote" label="审核备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="提交时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === APPLY_STATUS_PENDING"
              v-permission="'store:apply:approve'"
              link
              type="success"
              @click="handleReview(row, APPLY_STATUS_APPROVED)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === APPLY_STATUS_PENDING"
              v-permission="'store:apply:reject'"
              link
              type="danger"
              @click="handleReview(row, APPLY_STATUS_REJECTED)"
            >
              驳回
            </el-button>
            <el-button
              v-else-if="canTakedown(row)"
              v-permission="'store:apply:reject'"
              link
              type="danger"
              @click="handleTakedown(row)"
            >
              下架店铺
            </el-button>
            <span v-else-if="row.storeStatus === STORE_STATUS_TAKEDOWN" class="muted">已下架</span>
            <span v-else class="muted">{{ row.status === APPLY_STATUS_REJECTED ? "已驳回" : "已审核" }}</span>
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
