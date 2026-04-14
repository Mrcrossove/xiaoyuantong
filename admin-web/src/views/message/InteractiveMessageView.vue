<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { AdminInteractiveMessageItem, AdminInteractiveMessageSummary } from "../../api/contracts";
import { getInteractiveMessagesApi } from "../../api/modules/message";

const loading = ref(false);
const list = ref<AdminInteractiveMessageItem[]>([]);
const total = ref(0);
const summary = ref<AdminInteractiveMessageSummary>({
  total: 0,
  unreadCount: 0,
  typeOptions: []
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  type: ""
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getInteractiveMessagesApi(query);
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
  query.type = "";
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
      <el-col :span="12">
        <el-card shadow="never"><div class="metric-label">互动消息总数</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never"><div class="metric-label">未读消息</div><div class="metric-value warning">{{ summary.unreadCount }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索内容或目标对象" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.type" placeholder="全部类型" clearable class="select">
          <el-option v-for="item in summary.typeOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>互动消息列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="school" label="高校" min-width="140" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="target" label="目标对象" min-width="220" show-overflow-tooltip />
        <el-table-column prop="content" label="消息内容" min-width="260" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '未读' ? 'warning' : 'success'">{{ row.status }}</el-tag>
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
.metric-value.warning { color: #d97706; }
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.input { width: 320px; }
.select { width: 180px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
