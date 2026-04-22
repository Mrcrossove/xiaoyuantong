<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { AdminStoreDashboardResult } from "../../api/contracts";
import { getAdminStoreDashboardApi } from "../../api/modules/store";
import { ApiRequestError } from "../../api/request";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const data = ref<AdminStoreDashboardResult | null>(null);

const summaryCards = computed(() => {
  const summary = data.value?.summary;
  if (!summary) return [];

  return [
    { label: "累计订单", value: summary.totalOrders, tone: "" },
    { label: "已支付订单", value: summary.paidOrders, tone: "success" },
    { label: "进行中订单", value: summary.processingOrders, tone: "warning" },
    { label: "已完成订单", value: summary.finishedOrders, tone: "success" },
    { label: "累计营业额", value: formatCurrency(summary.totalRevenue), tone: "" },
    { label: "待结算金额", value: formatCurrency(summary.pendingSettlementRevenue), tone: "warning" },
    { label: "商品总数", value: summary.productCount, tone: "" },
    { label: "低库存商品", value: summary.lowStockProducts, tone: summary.lowStockProducts ? "danger" : "" }
  ];
});

const trendMax = computed(() => {
  const list = data.value?.charts.recentTrend || [];
  return Math.max(...list.map((item) => item.orders), 1);
});

function formatCurrency(value: number) {
  return `￥${Number(value || 0).toFixed(2)}`;
}

function showApiError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    ElMessage.error(error.traceId ? `${error.message}（追踪号: ${error.traceId}）` : error.message);
    return;
  }
  if (error instanceof Error) {
    ElMessage.error(error.message);
    return;
  }
  ElMessage.error(fallback);
}

async function loadData() {
  const id = Number(route.params.id);
  if (!id) {
    ElMessage.error("店铺参数不正确");
    return;
  }

  loading.value = true;
  try {
    data.value = await getAdminStoreDashboardApi(id);
  } catch (error) {
    showApiError(error, "店铺经营数据加载失败");
  } finally {
    loading.value = false;
  }
}

function goProductList() {
  router.push({ path: "/product/list", query: { keyword: data.value?.store.storeName || "" } });
}

function goOrderList() {
  router.push({ path: "/trade/order", query: { keyword: data.value?.store.storeName || "" } });
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <div class="page-head">
      <div>
        <div class="page-title">店铺经营看板</div>
        <div class="page-subtitle">查看店铺概况、商品、订单和经营数据</div>
      </div>
      <div class="page-actions">
        <el-button @click="router.push('/store/list')">返回店铺列表</el-button>
        <el-button @click="goProductList">进入商品管理</el-button>
        <el-button type="primary" @click="goOrderList">进入订单管理</el-button>
      </div>
    </div>

    <template v-if="data">
      <el-card shadow="never" class="store-card">
        <div class="store-card__content">
          <img class="store-cover" :src="data.store.cover || 'https://dummyimage.com/240x180/f2f4f7/98a2b3&text=STORE'" alt="cover" />
          <div class="store-main">
            <div class="store-main__top">
              <div>
                <div class="store-name">{{ data.store.storeName }}</div>
                <div class="store-meta">{{ data.store.school }} ｜ {{ data.store.category }} / {{ data.store.section }}</div>
              </div>
              <el-tag :type="data.store.status.includes('营业') ? 'success' : 'info'">{{ data.store.status }}</el-tag>
            </div>
            <div class="store-desc">{{ data.store.subtitle || data.store.notice || "暂无店铺简介" }}</div>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="店主">{{ data.store.owner || "-" }}</el-descriptions-item>
              <el-descriptions-item label="店主手机号">{{ data.store.ownerPhone || "-" }}</el-descriptions-item>
              <el-descriptions-item label="商家后台账号">{{ data.store.merchantPhone || "未开通" }}</el-descriptions-item>
              <el-descriptions-item label="评分">{{ data.store.rating }}</el-descriptions-item>
              <el-descriptions-item label="月售">{{ data.store.monthlySales || "-" }}</el-descriptions-item>
              <el-descriptions-item label="配送">{{ data.store.delivery || "-" }}</el-descriptions-item>
              <el-descriptions-item label="距离">{{ data.store.distance || "-" }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ data.store.createdAt || "-" }}</el-descriptions-item>
              <el-descriptions-item label="商家最近登录">{{ data.store.merchantLastLoginAt || "暂无" }}</el-descriptions-item>
              <el-descriptions-item label="联系电话" :span="3">{{ data.store.phone || "-" }}</el-descriptions-item>
              <el-descriptions-item label="店铺地址" :span="3">{{ data.store.address || "-" }}</el-descriptions-item>
              <el-descriptions-item label="店铺公告" :span="3">{{ data.store.notice || "暂无公告" }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-card>

      <div class="summary-grid">
        <el-card v-for="item in summaryCards" :key="item.label" shadow="never">
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value" :class="item.tone">{{ item.value }}</div>
        </el-card>
      </div>

      <div class="chart-grid">
        <el-card shadow="never">
          <template #header>订单状态分布</template>
          <div class="status-list">
            <div v-for="item in data.charts.orderStatus" :key="item.key" class="status-row">
              <div class="status-label">{{ item.label }}</div>
              <el-progress :percentage="item.percent" :stroke-width="12" />
              <div class="status-value">{{ item.value }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never">
          <template #header>支付状态分布</template>
          <div class="status-list">
            <div v-for="item in data.charts.payStatus" :key="item.key" class="status-row">
              <div class="status-label">{{ item.label }}</div>
              <el-progress :percentage="item.percent" :stroke-width="12" status="success" />
              <div class="status-value">{{ item.value }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never">
          <template #header>近 7 天订单趋势</template>
          <div class="trend-list">
            <div v-for="item in data.charts.recentTrend" :key="item.date" class="trend-row">
              <div class="trend-date">{{ item.date.slice(5) }}</div>
              <div class="trend-bar-wrap">
                <div class="trend-bar" :style="{ width: `${(item.orders / trendMax) * 100}%` }"></div>
              </div>
              <div class="trend-value">{{ item.orders }} 单 / {{ formatCurrency(item.revenue) }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="chart-grid">
        <el-card shadow="never">
          <template #header>结算状态</template>
          <div class="status-list">
            <div v-for="item in data.charts.settlement" :key="item.key" class="status-row">
              <div class="status-label">{{ item.label }}</div>
              <el-progress :percentage="item.percent" :stroke-width="12" color="#f59e0b" />
              <div class="status-value">{{ item.value }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never">
          <template #header>商品经营排行</template>
          <div class="ranking-list">
            <div v-for="item in data.charts.topProducts" :key="item.id" class="ranking-row">
              <div class="ranking-name">{{ item.name }}</div>
              <div class="ranking-meta">销量 {{ item.sales }}</div>
              <div class="ranking-meta">{{ formatCurrency(item.revenue) }}</div>
            </div>
            <el-empty v-if="!data.charts.topProducts.length" description="暂无商品数据" :image-size="80" />
          </div>
        </el-card>
      </div>

      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span>店铺商品</span>
            <span class="header-extra">当前页展示的是该店铺商品明细</span>
          </div>
        </template>
        <el-table :data="data.products" stripe>
          <el-table-column prop="name" label="商品名称" min-width="220" />
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="priceText" label="价格" width="120" />
          <el-table-column prop="stock" label="库存" width="100" />
          <el-table-column prop="sales" label="销量" width="100" />
          <el-table-column label="累计营收" width="140">
            <template #default="{ row }">{{ formatCurrency(row.revenue) }}</template>
          </el-table-column>
          <el-table-column label="推荐" width="100">
            <template #default="{ row }">
              <el-tag :type="row.recommended ? 'warning' : 'info'">{{ row.recommended ? "是" : "否" }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120" />
          <el-table-column prop="skuCount" label="规格数" width="100" />
        </el-table>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span>最近订单</span>
            <span class="header-extra">展示最新 20 条订单，更多请进入订单管理</span>
          </div>
        </template>
        <el-table :data="data.orders" stripe>
          <el-table-column prop="orderNo" label="订单号" min-width="180" />
          <el-table-column prop="buyer" label="下单用户" width="120" />
          <el-table-column prop="productName" label="商品" min-width="180" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column label="金额" width="120">
            <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="payStatus" label="支付状态" width="120" />
          <el-table-column prop="orderStatus" label="订单状态" width="120" />
          <el-table-column prop="settlementStatus" label="结算状态" width="120" />
          <el-table-column prop="createdAt" label="创建时间" width="180" />
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #101828;
}

.page-subtitle {
  margin-top: 6px;
  color: #667085;
  font-size: 14px;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.store-card__content {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 20px;
}

.store-cover {
  width: 240px;
  height: 180px;
  object-fit: cover;
  border-radius: 16px;
  background: #f2f4f7;
}

.store-main {
  display: grid;
  gap: 16px;
}

.store-main__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.store-name {
  font-size: 28px;
  font-weight: 700;
  color: #101828;
}

.store-meta,
.store-desc {
  color: #667085;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-label {
  color: #667085;
  font-size: 14px;
}

.metric-value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 700;
  color: #101828;
}

.metric-value.success {
  color: #16a34a;
}

.metric-value.warning {
  color: #d97706;
}

.metric-value.danger {
  color: #dc2626;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.status-list,
.trend-list,
.ranking-list {
  display: grid;
  gap: 14px;
}

.status-row {
  display: grid;
  grid-template-columns: 72px 1fr 48px;
  gap: 12px;
  align-items: center;
}

.status-label,
.status-value,
.trend-date,
.trend-value,
.ranking-meta {
  color: #475467;
  font-size: 13px;
}

.trend-row {
  display: grid;
  grid-template-columns: 48px 1fr 120px;
  gap: 12px;
  align-items: center;
}

.trend-bar-wrap {
  height: 10px;
  background: #eaecf0;
  border-radius: 999px;
  overflow: hidden;
}

.trend-bar {
  height: 100%;
  min-width: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
}

.ranking-row {
  display: grid;
  grid-template-columns: 1fr 80px 100px;
  gap: 12px;
  align-items: center;
}

.ranking-name {
  color: #101828;
  font-weight: 600;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-extra {
  color: #667085;
  font-size: 12px;
}

@media (max-width: 1280px) {
  .summary-grid,
  .chart-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page-head,
  .store-card__content,
  .summary-grid,
  .chart-grid {
    grid-template-columns: 1fr;
    display: grid;
  }

  .page-actions {
    flex-wrap: wrap;
  }

  .store-cover {
    width: 100%;
    height: 220px;
  }
}
</style>
