<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import type { AdminStoreItem } from "../../api/contracts";
import { getAdminStoreListApi } from "../../api/modules/store";

const router = useRouter();
const loading = ref(false);
const list = ref<AdminStoreItem[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  category: ""
});

const schoolOptions = computed(() => [...new Set(list.value.map((item) => item.school).filter(Boolean))]);
const categoryOptions = computed(() => [...new Set(list.value.map((item) => item.category).filter(Boolean))]);
const openCount = computed(() => list.value.filter((item) => item.status.includes("营业")).length);
const recommendCount = computed(() => list.value.filter((item) => item.recommend.includes("推荐")).length);

async function loadData() {
  loading.value = true;
  try {
    const result = await getAdminStoreListApi(query);
    list.value = result.list;
    total.value = result.total;
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
  query.category = "";
  loadData();
}

function handlePageChange(page: number) {
  query.page = page;
  loadData();
}

function openStoreDetail(row: AdminStoreItem) {
  router.push(`/store/detail/${row.id}`);
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-alert
      title="店铺管理作为单店经营后台入口，负责查看店铺经营情况、商品、订单和运营数据。"
      type="info"
      :closable="false"
    />

    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">店铺总数</div><div class="metric-value">{{ total }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">营业中</div><div class="metric-value success">{{ openCount }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">推荐中</div><div class="metric-value warning">{{ recommendCount }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>店铺筛选</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索店铺名称或店主" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.category" placeholder="全部分类" clearable class="select">
          <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>店铺列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column label="店铺名称" min-width="220">
          <template #default="{ row }">
            <el-button link type="primary" @click="openStoreDetail(row)">{{ row.storeName }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="owner" label="店主" width="120" />
        <el-table-column prop="ownerPhone" label="联系电话" width="140" />
        <el-table-column prop="school" label="高校" min-width="160" />
        <el-table-column prop="category" label="一级分类" width="120" />
        <el-table-column prop="section" label="二级分类" width="120" />
        <el-table-column label="营业状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status.includes('营业') ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="推荐状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.recommend.includes('推荐') ? 'warning' : 'info'">{{ row.recommend }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="goodsCount" label="商品数" width="100" />
        <el-table-column prop="rating" label="评分" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
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
</style>
