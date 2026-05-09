<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type { SchoolContentItem } from "../../api/contracts";
import { getSchoolContentListApi } from "../../api/modules/school";
import { exportTableToCsv } from "../../utils/export";

const loading = ref(false);
const list = ref<SchoolContentItem[]>([]);
const total = ref(0);

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  status: ""
});

const totalUserCount = computed(() => list.value.reduce((sum, item) => sum + Number(item.userCount || 0), 0));
const totalPostCount = computed(() => list.value.reduce((sum, item) => sum + Number(item.postCount || 0), 0));
const totalOrderCount = computed(() => list.value.reduce((sum, item) => sum + Number(item.orderCount || 0), 0));
const totalGmv = computed(() => list.value.reduce((sum, item) => sum + Number(item.gmv || 0), 0));

function rateToNumber(rate: string) {
  return Number(String(rate || "").replace("%", "")) || 0;
}

function resetQuery() {
  query.keyword = "";
  query.school = "";
  query.status = "";
  query.page = 1;
  loadData();
}

function search() {
  query.page = 1;
  loadData();
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getSchoolContentListApi({ ...query });
    list.value = result.list || [];
    total.value = result.total || 0;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "加载失败");
  } finally {
    loading.value = false;
  }
}

function exportData() {
  exportTableToCsv(
    "高校真实内容统计",
    ["高校", "用户数", "帖子数", "店铺数", "订单数", "已支付交易额", "认证通过率", "状态"],
    list.value.map((item) => [
      item.school,
      item.userCount,
      item.postCount,
      item.storeCount,
      item.orderCount,
      item.gmv,
      item.verifyPassRate,
      item.status
    ])
  );
  ElMessage.success("已导出当前页");
}

function onPageChange(page: number) {
  query.page = page;
  loadData();
}

function onPageSizeChange(pageSize: number) {
  query.pageSize = pageSize;
  query.page = 1;
  loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">当前页用户总量</div>
          <div class="metric-value">{{ totalUserCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">当前页帖子总量</div>
          <div class="metric-value">{{ totalPostCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">当前页订单总量</div>
          <div class="metric-value">{{ totalOrderCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="metric-label">当前页已支付交易额</div>
          <div class="metric-value">¥{{ totalGmv.toLocaleString() }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索高校名称" clearable class="input" @keyup.enter="search" />
        <el-input v-model="query.school" placeholder="按高校精确筛选" clearable class="input" @keyup.enter="search" />
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="启用" value="启用" />
          <el-option label="停用" value="停用" />
        </el-select>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button @click="exportData">导出</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>高校真实内容统计</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="school" label="高校" min-width="170" />
        <el-table-column prop="userCount" label="用户数" width="100" />
        <el-table-column prop="postCount" label="帖子数" width="100" />
        <el-table-column prop="storeCount" label="店铺数" width="100" />
        <el-table-column prop="orderCount" label="订单数" width="100" />
        <el-table-column label="已支付交易额" width="140">
          <template #default="{ row }">¥{{ Number(row.gmv || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="认证通过率" min-width="220">
          <template #default="{ row }">
            <div class="rate-cell">
              <el-progress :percentage="rateToNumber(row.verifyPassRate)" :stroke-width="10" />
              <span>{{ row.verifyPassRate }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager-wrap">
        <el-pagination
          :current-page="query.page"
          :page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @update:current-page="onPageChange"
          @update:page-size="onPageSizeChange"
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
  font-size: 28px;
  font-weight: 700;
}

.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.input {
  width: 220px;
}

.select {
  width: 160px;
}

.rate-cell {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
}

.pager-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
