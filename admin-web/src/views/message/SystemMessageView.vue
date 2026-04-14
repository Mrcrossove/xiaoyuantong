<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { AdminSystemMessageItem, AdminSystemMessageSummary } from "../../api/contracts";
import { getAdminSystemMessageListApi } from "../../api/modules/message";

const loading = ref(false);
const list = ref<AdminSystemMessageItem[]>([]);
const total = ref(0);
const summary = ref<AdminSystemMessageSummary>({
  total: 0,
  enabledCount: 0,
  channelOptions: []
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  status: "",
  channel: ""
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getAdminSystemMessageListApi(query);
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
  query.channel = "";
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
        <el-card shadow="never"><div class="metric-label">系统消息数</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">已发送</div><div class="metric-value success">{{ summary.enabledCount }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">覆盖渠道</div><div class="metric-value">{{ summary.channelOptions.length }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索消息标题或适用高校" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.channel" placeholder="全部渠道" clearable class="select">
          <el-option v-for="item in summary.channelOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="已发送" value="已发送" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>系统消息列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="title" label="消息标题" min-width="260" />
        <el-table-column prop="school" label="适用高校" width="160" />
        <el-table-column prop="target" label="目标人群" width="120" />
        <el-table-column prop="channel" label="发送渠道" width="140" />
        <el-table-column prop="updatedAt" label="发送时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已发送' ? 'success' : 'info'">{{ row.status }}</el-tag>
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
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.input { width: 320px; }
.select { width: 180px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
