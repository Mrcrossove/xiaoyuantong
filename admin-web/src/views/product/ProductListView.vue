<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import type { AdminProductItem } from "../../api/contracts";
import { getAdminProductListApi } from "../../api/modules/product";

const router = useRouter();
const loading = ref(false);
const list = ref<AdminProductItem[]>([]);
const total = ref(0);
const summary = ref({
  total: 0,
  onSaleCount: 0,
  pendingCount: 0,
  totalSales: 0,
  schoolOptions: [] as string[],
  categoryOptions: [] as string[]
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  category: "",
  status: ""
});

const lowStockCount = computed(() => list.value.filter((item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) <= 5).length);

async function loadData() {
  loading.value = true;
  try {
    const result = await getAdminProductListApi(query);
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
  query.category = "";
  query.status = "";
  loadData();
}

function handlePageChange(page: number) {
  query.page = page;
  loadData();
}

function openStoreDetail(row: AdminProductItem) {
  router.push({
    path: `/store/detail/${row.storeId}`,
    query: {
      productId: row.productId
    }
  });
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-alert
      title="工程建议：店铺管理负责单店运营和商品处理，商品管理负责跨店巡检和快速定位，避免两个模块重复承担经营操作。"
      type="info"
      :closable="false"
    />

    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">全局商品数</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">在售商品</div><div class="metric-value success">{{ summary.onSaleCount }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">低库存商品</div><div class="metric-value warning">{{ lowStockCount }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">累计销量</div><div class="metric-value">{{ summary.totalSales }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>商品巡检筛选</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索商品名称或所属店铺" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.category" placeholder="全部分类" clearable class="select">
          <el-option v-for="item in summary.categoryOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="已上架" value="已上架" />
          <el-option label="待审核" value="待审核" />
          <el-option label="已下架" value="已下架" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="header-row">
          <span>商品巡检列表</span>
          <span class="header-tip">这里负责跨店搜索和定位问题，具体商品编辑统一进入对应店铺经营后台处理。</span>
        </div>
      </template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column label="商品名称" min-width="220">
          <template #default="{ row }">
            <el-button link type="primary" @click="openStoreDetail(row)">{{ row.name }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="所属店铺" min-width="180">
          <template #default="{ row }">
            <el-button link @click="openStoreDetail(row)">{{ row.storeName }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="school" label="高校" min-width="160" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="价格" width="120">
          <template #default="{ row }">￥{{ Number(row.price || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="sales" label="销量" width="100" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '已上架' ? 'success' : row.status === '待审核' ? 'warning' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openStoreDetail(row)">去店铺处理</el-button>
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
.metric-value.warning { color: #d97706; }
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.input { width: 320px; }
.select { width: 180px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.header-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.header-tip { color: #667085; font-size: 12px; }
</style>
