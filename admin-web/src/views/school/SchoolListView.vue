<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { AdminSchoolItem, AdminSchoolSummary } from "../../api/contracts";
import { getAdminSchoolListApi } from "../../api/modules/school";

const loading = ref(false);
const list = ref<AdminSchoolItem[]>([]);
const total = ref(0);
const summary = ref<AdminSchoolSummary>({
  total: 0,
  enabledCount: 0,
  totalUsers: 0,
  totalStores: 0
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  status: ""
});

const statusOptions = computed(() => [...new Set(list.value.map((item) => item.status).filter(Boolean))]);

async function loadData() {
  loading.value = true;
  try {
    const result = await getAdminSchoolListApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  loadData();
}

function handleReset() {
  query.page = 1;
  query.keyword = "";
  query.status = "";
  loadData();
}

function handlePageChange(page: number) {
  query.page = page;
  loadData();
}
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">高校总数</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">已启用高校</div><div class="metric-value success">{{ summary.enabledCount }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">累计用户</div><div class="metric-value">{{ summary.totalUsers }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">累计店铺</div><div class="metric-value warning">{{ summary.totalStores }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索高校、城市或省份"
          clearable
          class="input"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>高校列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="name" label="高校名称" min-width="200" />
        <el-table-column prop="province" label="省份" width="120" />
        <el-table-column prop="city" label="城市" width="120" />
        <el-table-column prop="userCount" label="用户数" width="110" />
        <el-table-column prop="postCount" label="帖子数" width="110" />
        <el-table-column prop="storeCount" label="店铺数" width="110" />
        <el-table-column prop="orderCount" label="订单数" width="110" />
        <el-table-column label="交易额" width="130">
          <template #default="{ row }">￥{{ row.gmv.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="verifyPassRate" label="认证通过率" width="120" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
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
  width: 300px;
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
