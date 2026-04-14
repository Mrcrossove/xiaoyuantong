<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { OperationLogItem, OperationLogSummary } from "../../api/contracts";
import { getOperationLogsApi } from "../../api/modules/system";

const loading = ref(false);
const list = ref<OperationLogItem[]>([]);
const total = ref(0);
const summary = ref<OperationLogSummary>({
  total: 0,
  moduleOptions: []
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  module: ""
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getOperationLogsApi(query);
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
  query.module = "";
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
    <el-card shadow="never">
      <template #header>日志筛选</template>
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="搜索高校、操作人或日志内容"
          clearable
          class="input"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="query.module" placeholder="全部模块" clearable class="select">
          <el-option v-for="item in summary.moduleOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>操作日志列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="module" label="模块" width="140" />
        <el-table-column prop="action" label="动作" width="120" />
        <el-table-column prop="school" label="高校" min-width="160" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="ip" label="IP" width="120" />
        <el-table-column prop="content" label="操作内容" min-width="320" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="操作时间" width="180" />
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
