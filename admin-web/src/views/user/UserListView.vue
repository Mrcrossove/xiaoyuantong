<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { AdminUserItem, AdminUserSummary } from "../../api/contracts";
import { getAdminUserListApi } from "../../api/modules/user";

const loading = ref(false);
const list = ref<AdminUserItem[]>([]);
const total = ref(0);
const summary = ref<AdminUserSummary>({
  total: 0,
  verifiedCount: 0,
  normalCount: 0,
  schoolOptions: []
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  verified: ""
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getAdminUserListApi(query);
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
  query.school = "";
  query.verified = "";
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
        <el-card shadow="never"><div class="metric-label">用户总数</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">已认证人数</div><div class="metric-value success">{{ summary.verifiedCount }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">正常账户数</div><div class="metric-value warning">{{ summary.normalCount }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索昵称或手机号"
          clearable
          class="input"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.verified" placeholder="认证状态" clearable class="select">
          <el-option label="已认证" value="已认证" />
          <el-option label="未认证" value="未认证" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>用户列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="nickname" label="昵称" min-width="160" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="school" label="高校" min-width="180" />
        <el-table-column label="认证状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.verified === '已认证' ? 'success' : 'warning'">{{ row.verified }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账户状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publishCount" label="发布总数" width="110" />
        <el-table-column prop="postCount" label="帖子数" width="100" />
        <el-table-column prop="orderCount" label="订单数" width="100" />
        <el-table-column prop="registerTime" label="注册时间" width="170" />
        <el-table-column prop="verifiedAt" label="认证时间" width="170" />
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
