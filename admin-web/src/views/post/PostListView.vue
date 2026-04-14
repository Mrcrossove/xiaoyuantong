<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import type { AdminPostItem } from "../../api/contracts";
import { getAdminPostListApi } from "../../api/modules/post";

const loading = ref(false);
const list = ref<AdminPostItem[]>([]);
const total = ref(0);
const summary = ref({
  total: 0,
  pendingCount: 0,
  publishedCount: 0,
  schoolOptions: [] as string[]
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  status: ""
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getAdminPostListApi(query);
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
        <el-card shadow="never"><div class="metric-label">帖子总数</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">待审核</div><div class="metric-value warning">{{ summary.pendingCount }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">已发布</div><div class="metric-value success">{{ summary.publishedCount }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索标题或作者" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="待审核" value="待审核" />
          <el-option label="已发布" value="已发布" />
          <el-option label="已下架" value="已下架" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>帖子列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="title" label="帖子标题" min-width="240" />
        <el-table-column prop="author" label="作者" width="180" />
        <el-table-column prop="school" label="高校" min-width="180" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '已发布' ? 'success' : row.status === '待审核' ? 'warning' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="favoriteCount" label="收藏数" width="100" />
        <el-table-column prop="createdAt" label="发布时间" width="180" />
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
.metric-value.warning { color: #d97706; }
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.input { width: 300px; }
.select { width: 180px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
