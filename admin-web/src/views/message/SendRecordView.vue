<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { AdminSendRecordItem, AdminSendRecordSummary } from "../../api/contracts";
import { getAdminSendRecordListApi } from "../../api/modules/message";

const loading = ref(false);
const list = ref<AdminSendRecordItem[]>([]);
const total = ref(0);
const summary = ref<AdminSendRecordSummary>({
  total: 0,
  successCount: 0,
  targetTotal: 0,
  schoolOptions: []
});

const query = reactive({
  page: 1,
  pageSize: 10,
  school: "",
  status: ""
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getAdminSendRecordListApi(query);
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
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">发送任务数</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">发送成功</div><div class="metric-value success">{{ summary.successCount }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">累计触达</div><div class="metric-value">{{ summary.targetTotal }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="发送成功" value="发送成功" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>发送记录</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="title" label="消息标题" min-width="260" />
        <el-table-column prop="school" label="高校" min-width="140" />
        <el-table-column prop="channel" label="渠道" width="140" />
        <el-table-column prop="targetCount" label="触达人次" width="120" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="sendTime" label="发送时间" width="180" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '发送成功' ? 'success' : 'info'">{{ row.status }}</el-tag>
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
.toolbar { display: flex; gap: 12px; }
.select { width: 200px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
