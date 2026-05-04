<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import type {
  AdminStoreDashboardOrderItem,
  AdminStoreDashboardProductItem,
  AdminStoreDashboardResult,
  AdminStoreOrderDetailResult,
  AdminStoreOrderQuery,
  AdminStoreProductPayload,
  AdminStoreProductSkuPayload,
  RefundReviewPayload
} from "../../api/contracts";
import {
  cancelAdminStoreOrderApi,
  createAdminStoreProductApi,
  deleteAdminStoreProductApi,
  finishAdminStoreOrderApi,
  getAdminStoreDashboardWithQueryApi,
  getAdminStoreOrderDetailApi,
  getAdminStoreOrdersApi,
  reviewAdminStoreOrderRefundApi,
  toggleAdminStoreProductStatusApi,
  updateAdminStoreProductApi
} from "../../api/modules/store";
import { ApiRequestError } from "../../api/request";
import { exportTableToCsv } from "../../utils/export";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const orderLoading = ref(false);
const actionLoading = ref(false);
const exportLoading = ref(false);

const data = ref<AdminStoreDashboardResult | null>(null);
const orderList = ref<AdminStoreDashboardOrderItem[]>([]);
const serviceSchoolLabel = "\u53ef\u670d\u52a1\u9ad8\u6821";
const orderTotal = ref(0);

const productDialogVisible = ref(false);
const editingProductId = ref("");

const orderDialogVisible = ref(false);
const orderDetailLoading = ref(false);
const orderDetail = ref<AdminStoreOrderDetailResult | null>(null);

const dashboardFilters = reactive({
  dateRange: [] as string[],
  trendDays: 7
});

const orderQuery = reactive<AdminStoreOrderQuery>({
  page: 1,
  pageSize: 10,
  keyword: "",
  payStatus: "",
  orderStatus: "",
  dateFrom: "",
  dateTo: ""
});

const productForm = reactive<AdminStoreProductPayload>({
  name: "",
  desc: "",
  specMode: "single",
  price: "",
  cover: "",
  stock: 0,
  dailyLimit: 0,
  recommended: false,
  status: "已上架",
  skus: []
});

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

const isEditMode = computed(() => Boolean(editingProductId.value));
const statusOptions = computed(() => {
  const statuses = new Set<string>();
  (data.value?.products || []).forEach((item) => {
    if (item.status) statuses.add(item.status);
    item.skus.forEach((sku) => {
      if (sku.status) statuses.add(sku.status);
    });
  });
  if (!statuses.size) {
    statuses.add("已上架");
    statuses.add("已下架");
  }
  return Array.from(statuses);
});

function currentStoreId() {
  return Number(route.params.id);
}

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

async function handleConflictForSuperAdmin(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === 409 && authStore.isSuperAdmin) {
      try {
        await ElMessageBox.confirm("该商品刚被其他管理员更新。是否以超级管理员身份强制覆盖当前变更？", "并发冲突", {
          type: "warning",
          confirmButtonText: "强制覆盖",
          cancelButtonText: "取消"
        });
        await action();
        return;
      } catch (confirmError) {
        if (confirmError === "cancel") return;
        showApiError(confirmError, "操作失败");
        return;
      }
    }
    throw error;
  }
}

function buildDashboardParams() {
  return {
    dateFrom: dashboardFilters.dateRange[0] || "",
    dateTo: dashboardFilters.dateRange[1] || "",
    trendDays: dashboardFilters.trendDays
  };
}

async function loadDashboard() {
  const storeId = currentStoreId();
  if (!storeId) {
    ElMessage.error("店铺参数不正确");
    return;
  }

  loading.value = true;
  try {
    data.value = await getAdminStoreDashboardWithQueryApi(storeId, buildDashboardParams());
    const targetProductId = String(route.query.productId || "").trim();
    if (targetProductId) {
      await nextTick();
      const target = data.value.products.find((item) => String(item.id) === targetProductId);
      if (target) {
        openEditProductDialog(target);
      }
      router.replace({ path: route.path, query: {} });
    }
  } catch (error) {
    showApiError(error, "店铺经营数据加载失败");
  } finally {
    loading.value = false;
  }
}

async function loadOrders() {
  const storeId = currentStoreId();
  orderLoading.value = true;
  try {
    const result = await getAdminStoreOrdersApi(storeId, orderQuery);
    orderList.value = result.list;
    orderTotal.value = result.total;
  } catch (error) {
    showApiError(error, "店铺订单加载失败");
  } finally {
    orderLoading.value = false;
  }
}

async function loadAll() {
  await Promise.all([loadDashboard(), loadOrders()]);
}

function applyDashboardFilters() {
  loadDashboard();
}

function resetDashboardFilters() {
  dashboardFilters.dateRange = [];
  dashboardFilters.trendDays = 7;
  loadDashboard();
}

function handleOrderSearch() {
  orderQuery.page = 1;
  loadOrders();
}

function resetOrderFilters() {
  orderQuery.page = 1;
  orderQuery.keyword = "";
  orderQuery.payStatus = "";
  orderQuery.orderStatus = "";
  orderQuery.dateFrom = "";
  orderQuery.dateTo = "";
  loadOrders();
}

function handleOrderPageChange(page: number) {
  orderQuery.page = page;
  loadOrders();
}

function handleOrderDateChange(value: string[] | null) {
  orderQuery.dateFrom = value?.[0] || "";
  orderQuery.dateTo = value?.[1] || "";
}

async function exportOrders() {
  const storeId = currentStoreId();
  exportLoading.value = true;
  try {
    const rows: AdminStoreDashboardOrderItem[] = [];
    let page = 1;
    let total = 0;

    do {
      const result = await getAdminStoreOrdersApi(storeId, {
        ...orderQuery,
        page,
        pageSize: 100
      });
      rows.push(...result.list);
      total = result.total;
      page += 1;
    } while (rows.length < total);

    exportTableToCsv(
      `${data.value?.store.storeName || "店铺"}订单列表`,
      ["订单号", "下单用户", "商品", "规格", "数量", "金额", "支付状态", "订单状态", "结算状态", "创建时间"],
      rows.map((item) => [
        item.orderNo,
        item.buyer,
        item.productName,
        item.skuName || "-",
        item.quantity,
        Number(item.amount || 0).toFixed(2),
        item.payStatus,
        item.orderStatus,
        item.settlementStatus,
        item.createdAt
      ])
    );
    ElMessage.success("订单已导出");
  } catch (error) {
    showApiError(error, "订单导出失败");
  } finally {
    exportLoading.value = false;
  }
}

function createEmptySku(): AdminStoreProductSkuPayload {
  return {
    name: "",
    price: "",
    stock: 0,
    dailyLimit: 0,
    status: statusOptions.value[0] || "已上架",
    isDefault: false
  };
}

function resetProductForm() {
  editingProductId.value = "";
  productForm.name = "";
  productForm.desc = "";
  productForm.specMode = "single";
  productForm.price = "";
  productForm.cover = "";
  productForm.stock = 0;
  productForm.dailyLimit = 0;
  productForm.recommended = false;
  productForm.status = statusOptions.value[0] || "已上架";
  productForm.skus = [];
}

function normalizePriceText(value: string) {
  return value.trim();
}

function ensureSingleDefaultSku() {
  if (productForm.specMode !== "multi") return;
  if (!productForm.skus.length) {
    productForm.skus.push({ ...createEmptySku(), isDefault: true });
    return;
  }
  if (!productForm.skus.some((sku) => sku.isDefault)) {
    productForm.skus[0].isDefault = true;
  }
}

function setDefaultSku(index: number) {
  productForm.skus.forEach((sku, currentIndex) => {
    sku.isDefault = currentIndex === index;
  });
}

function addSku() {
  if (productForm.specMode !== "multi") return;
  const sku = createEmptySku();
  sku.isDefault = productForm.skus.length === 0;
  productForm.skus.push(sku);
}

function removeSku(index: number) {
  productForm.skus.splice(index, 1);
  ensureSingleDefaultSku();
}

function openCreateProductDialog() {
  resetProductForm();
  productDialogVisible.value = true;
}

function openEditProductDialog(product: AdminStoreDashboardProductItem) {
  editingProductId.value = product.id;
  productForm.name = product.name;
  productForm.desc = product.desc;
  productForm.specMode = product.specMode === "multi" ? "multi" : "single";
  productForm.price = product.priceText;
  productForm.cover = product.cover || "";
  productForm.stock = product.stock;
  productForm.dailyLimit = product.dailyLimit;
  productForm.recommended = product.recommended;
  productForm.status = product.status;
  productForm.skus = product.skus.map((sku) => ({
    id: sku.id,
    name: sku.name,
    price: sku.price,
    stock: sku.stock,
    dailyLimit: sku.dailyLimit,
    status: sku.status,
    isDefault: sku.isDefault
  }));
  ensureSingleDefaultSku();
  productDialogVisible.value = true;
}

function buildProductPayload(): AdminStoreProductPayload | null {
  if (!productForm.name.trim()) {
    ElMessage.warning("请输入商品名称");
    return null;
  }
  if (!productForm.desc.trim()) {
    ElMessage.warning("请输入商品描述");
    return null;
  }
  if (productForm.specMode === "single") {
    if (!normalizePriceText(productForm.price)) {
      ElMessage.warning("请输入商品价格");
      return null;
    }
    return {
      name: productForm.name.trim(),
      desc: productForm.desc.trim(),
      specMode: "single",
      price: normalizePriceText(productForm.price),
      cover: productForm.cover.trim(),
      stock: Number(productForm.stock || 0),
      dailyLimit: Number(productForm.dailyLimit || 0),
      recommended: Boolean(productForm.recommended),
      status: productForm.status,
      skus: []
    };
  }
  if (!productForm.skus.length) {
    ElMessage.warning("多规格商品至少需要一个规格");
    return null;
  }
  ensureSingleDefaultSku();
  for (const sku of productForm.skus) {
    if (!sku.name.trim()) {
      ElMessage.warning("请填写规格名称");
      return null;
    }
    if (!normalizePriceText(sku.price)) {
      ElMessage.warning("请填写规格价格");
      return null;
    }
  }
  return {
    name: productForm.name.trim(),
    desc: productForm.desc.trim(),
    specMode: "multi",
    price: normalizePriceText(productForm.skus.find((item) => item.isDefault)?.price || productForm.skus[0].price),
    cover: productForm.cover.trim(),
    stock: Number(productForm.stock || 0),
    dailyLimit: Number(productForm.dailyLimit || 0),
    recommended: Boolean(productForm.recommended),
    status: productForm.status,
    skus: productForm.skus.map((sku) => ({
      id: sku.id,
      name: sku.name.trim(),
      price: normalizePriceText(sku.price),
      stock: Number(sku.stock || 0),
      dailyLimit: Number(sku.dailyLimit || 0),
      status: sku.status,
      isDefault: Boolean(sku.isDefault)
    }))
  };
}

async function submitProduct() {
  const storeId = currentStoreId();
  const payload = buildProductPayload();
  if (!payload) return;
  actionLoading.value = true;
  try {
    if (isEditMode.value) {
      await updateAdminStoreProductApi(storeId, editingProductId.value, payload);
      ElMessage.success("商品已更新");
    } else {
      await createAdminStoreProductApi(storeId, payload);
      ElMessage.success("商品已新增");
    }
    productDialogVisible.value = false;
    await loadDashboard();
  } catch (error) {
    showApiError(error, isEditMode.value ? "商品更新失败" : "商品新增失败");
  } finally {
    actionLoading.value = false;
  }
}

async function toggleProductStatus(product: AdminStoreDashboardProductItem) {
  actionLoading.value = true;
  try {
    await toggleAdminStoreProductStatusApi(currentStoreId(), product.id);
    ElMessage.success("商品状态已更新");
    await loadDashboard();
  } catch (error) {
    showApiError(error, "商品状态更新失败");
  } finally {
    actionLoading.value = false;
  }
}

async function deleteProduct(product: AdminStoreDashboardProductItem) {
  try {
    await ElMessageBox.confirm(`确认删除商品“${product.name}”吗？`, "删除商品", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
    actionLoading.value = true;
    await deleteAdminStoreProductApi(currentStoreId(), product.id);
    ElMessage.success("商品已删除");
    await loadDashboard();
  } catch (error) {
    if (error === "cancel") return;
    showApiError(error, "商品删除失败");
  } finally {
    actionLoading.value = false;
  }
}

async function openOrderDetail(row: AdminStoreDashboardOrderItem) {
  orderDialogVisible.value = true;
  orderDetailLoading.value = true;
  try {
    orderDetail.value = await getAdminStoreOrderDetailApi(currentStoreId(), row.id);
  } catch (error) {
    showApiError(error, "订单详情加载失败");
    orderDialogVisible.value = false;
  } finally {
    orderDetailLoading.value = false;
  }
}

async function refreshOrderDetail() {
  if (!orderDetail.value) return;
  orderDetailLoading.value = true;
  try {
    orderDetail.value = await getAdminStoreOrderDetailApi(currentStoreId(), orderDetail.value.id);
    await loadOrders();
    await loadDashboard();
  } catch (error) {
    showApiError(error, "订单详情刷新失败");
  } finally {
    orderDetailLoading.value = false;
  }
}

async function finishOrder() {
  if (!orderDetail.value) return;
  actionLoading.value = true;
  try {
    orderDetail.value = await finishAdminStoreOrderApi(currentStoreId(), orderDetail.value.id);
    ElMessage.success("订单已完成");
    await loadAll();
  } catch (error) {
    showApiError(error, "订单完成失败");
  } finally {
    actionLoading.value = false;
  }
}

async function cancelOrder() {
  if (!orderDetail.value) return;
  try {
    await ElMessageBox.confirm(`确认取消订单“${orderDetail.value.orderNo}”吗？`, "取消订单", {
      type: "warning",
      confirmButtonText: "确认取消",
      cancelButtonText: "返回"
    });
    actionLoading.value = true;
    orderDetail.value = await cancelAdminStoreOrderApi(currentStoreId(), orderDetail.value.id);
    ElMessage.success("订单已取消");
    await loadAll();
  } catch (error) {
    if (error === "cancel") return;
    showApiError(error, "订单取消失败");
  } finally {
    actionLoading.value = false;
  }
}

async function reviewRefund(refundId: number, status: "已通过" | "已驳回") {
  if (!orderDetail.value) return;
  try {
    const { value } = await ElMessageBox.prompt("请输入审核备注，可为空", status === "已通过" ? "通过退款" : "驳回退款", {
      inputValue: "",
      inputPlaceholder: "审核备注",
      confirmButtonText: "确认",
      cancelButtonText: "取消"
    });
    const payload: RefundReviewPayload = { status, reviewNote: value || "" };
    actionLoading.value = true;
    orderDetail.value = await reviewAdminStoreOrderRefundApi(currentStoreId(), orderDetail.value.id, refundId, payload);
    ElMessage.success("退款审核已完成");
    await loadAll();
  } catch (error) {
    if (error === "cancel") return;
    showApiError(error, "退款审核失败");
  } finally {
    actionLoading.value = false;
  }
}

function goProductList() {
  router.push({ path: "/product/list", query: { keyword: data.value?.store.storeName || "" } });
}

function goOrderList() {
  router.push({ path: "/trade/order", query: { keyword: data.value?.store.storeName || "" } });
}

onMounted(loadAll);
</script>

<template>
  <div class="page" v-loading="loading || actionLoading">
    <div class="page-head">
      <div>
        <div class="page-title">店铺经营后台</div>
        <div class="page-subtitle">按时间查看经营数据、管理商品、筛选订单并导出</div>
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
                <div class="store-meta" v-if="data.store.serviceSchools?.length">{{ serviceSchoolLabel }}: {{ data.store.serviceSchools.join(" / ") }}</div>
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

      <el-card shadow="never">
        <template #header>经营数据筛选</template>
        <div class="toolbar">
          <el-date-picker
            v-model="dashboardFilters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
          <el-select v-model="dashboardFilters.trendDays" class="select">
            <el-option :value="7" label="近 7 天趋势" />
            <el-option :value="15" label="近 15 天趋势" />
            <el-option :value="30" label="近 30 天趋势" />
          </el-select>
          <el-button type="primary" @click="applyDashboardFilters">应用</el-button>
          <el-button @click="resetDashboardFilters">重置</el-button>
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
          <template #header>订单趋势</template>
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
            <div class="header-actions">
              <span class="header-extra">管理员可直接新增、编辑、上下架和删除商品</span>
              <el-button type="primary" @click="openCreateProductDialog">新增商品</el-button>
            </div>
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
          <el-table-column label="操作" min-width="240" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button link type="primary" @click="openEditProductDialog(row)">编辑</el-button>
                <el-button link type="warning" @click="toggleProductStatus(row)">{{ row.status.includes("下架") ? "上架" : "下架" }}</el-button>
                <el-button link type="danger" @click="deleteProduct(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never">
        <template #header>店铺订单筛选</template>
        <div class="toolbar">
          <el-input v-model="orderQuery.keyword" class="input" placeholder="搜索订单号、商品或收货人" clearable @keyup.enter="handleOrderSearch" />
          <el-select v-model="orderQuery.payStatus" class="select" placeholder="支付状态" clearable>
            <el-option label="待支付" value="待支付" />
            <el-option label="已支付" value="已支付" />
            <el-option label="已退款" value="已退款" />
          </el-select>
          <el-select v-model="orderQuery.orderStatus" class="select" placeholder="订单状态" clearable>
            <el-option label="待支付" value="待支付" />
            <el-option label="进行中" value="进行中" />
            <el-option label="待处理" value="待处理" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已取消" value="已取消" />
          </el-select>
          <el-date-picker
            :model-value="orderQuery.dateFrom && orderQuery.dateTo ? [orderQuery.dateFrom, orderQuery.dateTo] : []"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleOrderDateChange"
          />
          <el-button type="primary" @click="handleOrderSearch">查询</el-button>
          <el-button @click="resetOrderFilters">重置</el-button>
          <el-button :loading="exportLoading" @click="exportOrders">导出订单</el-button>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span>店铺订单</span>
            <span class="header-extra">支持分页、筛选、详情处理与导出</span>
          </div>
        </template>
        <el-table :data="orderList" stripe v-loading="orderLoading">
          <el-table-column prop="orderNo" label="订单号" min-width="180" />
          <el-table-column prop="buyer" label="下单用户" width="120" />
          <el-table-column prop="productName" label="商品" min-width="180" />
          <el-table-column prop="skuName" label="规格" width="120" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column label="金额" width="120">
            <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="payStatus" label="支付状态" width="120" />
          <el-table-column prop="orderStatus" label="订单状态" width="120" />
          <el-table-column prop="settlementStatus" label="结算状态" width="120" />
          <el-table-column prop="createdAt" label="创建时间" width="180" />
          <el-table-column label="操作" min-width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openOrderDetail(row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :total="orderTotal"
            :page-size="orderQuery.pageSize"
            :current-page="orderQuery.page"
            @current-change="handleOrderPageChange"
          />
        </div>
      </el-card>
    </template>

    <el-dialog v-model="productDialogVisible" :title="isEditMode ? '编辑商品' : '新增商品'" width="900px" destroy-on-close>
      <el-form label-width="100px">
        <div class="dialog-grid">
          <el-form-item label="商品名称"><el-input v-model="productForm.name" maxlength="30" show-word-limit /></el-form-item>
          <el-form-item label="商品状态">
            <el-select v-model="productForm.status"><el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" /></el-select>
          </el-form-item>
          <el-form-item label="商品描述" class="full-row"><el-input v-model="productForm.desc" type="textarea" :rows="3" maxlength="60" show-word-limit /></el-form-item>
          <el-form-item label="封面地址" class="full-row"><el-input v-model="productForm.cover" placeholder="可填图片 URL，不填则沿用默认占位图" /></el-form-item>
          <el-form-item label="规格模式">
            <el-radio-group v-model="productForm.specMode" @change="ensureSingleDefaultSku">
              <el-radio value="single">单规格</el-radio>
              <el-radio value="multi">多规格</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="推荐商品"><el-switch v-model="productForm.recommended" /></el-form-item>
        </div>

        <template v-if="productForm.specMode === 'single'">
          <div class="dialog-grid">
            <el-form-item label="商品价格"><el-input v-model="productForm.price" placeholder="例如：￥12 或 12.5" /></el-form-item>
            <el-form-item label="库存"><el-input-number v-model="productForm.stock" :min="0" :max="99999" class="full-input" /></el-form-item>
            <el-form-item label="限购数"><el-input-number v-model="productForm.dailyLimit" :min="0" :max="9999" class="full-input" /></el-form-item>
          </div>
        </template>
        <template v-else>
          <div class="sku-head">
            <div class="sku-title">规格列表</div>
            <el-button @click="addSku">新增规格</el-button>
          </div>
          <el-table :data="productForm.skus" border>
            <el-table-column label="默认" width="80">
              <template #default="{ $index }"><el-radio :model-value="productForm.skus[$index].isDefault" :label="true" @change="setDefaultSku($index)"><span></span></el-radio></template>
            </el-table-column>
            <el-table-column label="规格名称" min-width="160"><template #default="{ row }"><el-input v-model="row.name" placeholder="如：大份 / 热饮" /></template></el-table-column>
            <el-table-column label="价格" width="160"><template #default="{ row }"><el-input v-model="row.price" placeholder="如：￥12" /></template></el-table-column>
            <el-table-column label="库存" width="120"><template #default="{ row }"><el-input-number v-model="row.stock" :min="0" :max="99999" class="full-input" /></template></el-table-column>
            <el-table-column label="限购数" width="120"><template #default="{ row }"><el-input-number v-model="row.dailyLimit" :min="0" :max="9999" class="full-input" /></template></el-table-column>
            <el-table-column label="状态" width="140">
              <template #default="{ row }"><el-select v-model="row.status"><el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" /></el-select></template>
            </el-table-column>
            <el-table-column label="操作" width="100"><template #default="{ $index }"><el-button link type="danger" @click="removeSku($index)">删除</el-button></template></el-table-column>
          </el-table>
        </template>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button @click="productDialogVisible = false">取消</el-button><el-button type="primary" :loading="actionLoading" @click="submitProduct">保存</el-button></div></template>
    </el-dialog>

    <el-dialog v-model="orderDialogVisible" title="订单详情" width="980px" destroy-on-close>
      <div v-loading="orderDetailLoading">
        <template v-if="orderDetail">
          <div class="order-head">
            <div>
              <div class="order-no">{{ orderDetail.orderNo }}</div>
              <div class="order-meta">{{ orderDetail.orderStatus }} ｜ {{ orderDetail.payStatus }} ｜ {{ orderDetail.settlementStatus }}</div>
            </div>
            <div class="header-actions">
              <el-button :disabled="!orderDetail.actions.canCancel" @click="cancelOrder">取消订单</el-button>
              <el-button type="primary" :disabled="!orderDetail.actions.canFinish" @click="finishOrder">完成订单</el-button>
            </div>
          </div>

          <el-descriptions :column="3" border class="order-section">
            <el-descriptions-item label="下单用户">{{ orderDetail.buyer }}</el-descriptions-item>
            <el-descriptions-item label="商品">{{ orderDetail.productName }}</el-descriptions-item>
            <el-descriptions-item label="规格">{{ orderDetail.skuName || "-" }}</el-descriptions-item>
            <el-descriptions-item label="数量">{{ orderDetail.quantity }}</el-descriptions-item>
            <el-descriptions-item label="单价">{{ formatCurrency(orderDetail.unitPrice) }}</el-descriptions-item>
            <el-descriptions-item label="金额">{{ formatCurrency(orderDetail.amount) }}</el-descriptions-item>
            <el-descriptions-item label="支付渠道">{{ orderDetail.paymentChannel || "-" }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">{{ orderDetail.paymentMode || "-" }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ orderDetail.createdAt || "-" }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ orderDetail.paidAt || "-" }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{ orderDetail.finishedAt || "-" }}</el-descriptions-item>
            <el-descriptions-item label="取消时间">{{ orderDetail.canceledAt || "-" }}</el-descriptions-item>
            <el-descriptions-item label="收货人">{{ orderDetail.receiverName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ orderDetail.receiverPhone }}</el-descriptions-item>
            <el-descriptions-item label="地址标签">{{ orderDetail.addressTag || "-" }}</el-descriptions-item>
            <el-descriptions-item label="收货地址" :span="3">{{ orderDetail.receiverAddress }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">{{ orderDetail.remark || "无" }}</el-descriptions-item>
          </el-descriptions>

          <el-card shadow="never" class="order-section">
            <template #header><div class="card-header"><span>退款记录</span><el-button link type="primary" @click="refreshOrderDetail">刷新</el-button></div></template>
            <el-table :data="orderDetail.refunds" stripe>
              <el-table-column prop="refundNo" label="退款单号" min-width="160" />
              <el-table-column label="退款金额" width="120"><template #default="{ row }">{{ formatCurrency(row.amount) }}</template></el-table-column>
              <el-table-column prop="reason" label="退款原因" min-width="180" show-overflow-tooltip />
              <el-table-column prop="status" label="状态" width="120" />
              <el-table-column prop="reviewerName" label="审核人" width="120" />
              <el-table-column prop="reviewNote" label="审核备注" min-width="180" show-overflow-tooltip />
              <el-table-column prop="applyTime" label="申请时间" width="180" />
              <el-table-column prop="reviewedAt" label="审核时间" width="180" />
              <el-table-column label="操作" width="160" fixed="right">
                <template #default="{ row }">
                  <div class="table-actions">
                    <el-button link type="success" :disabled="row.status !== '待审核'" @click="reviewRefund(row.id, '已通过')">通过</el-button>
                    <el-button link type="danger" :disabled="row.status !== '待审核'" @click="reviewRefund(row.id, '已驳回')">驳回</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!orderDetail.refunds.length" description="当前订单暂无退款记录" :image-size="80" />
          </el-card>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 16px; }
.page-head, .page-actions, .header-actions, .table-actions, .dialog-footer, .card-header, .sku-head, .order-head, .store-main__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.page-title, .store-name, .order-no { font-size: 28px; font-weight: 700; color: #101828; }
.page-subtitle, .store-meta, .store-desc, .header-extra, .order-meta { color: #667085; font-size: 14px; }
.store-card__content { display: grid; grid-template-columns: 240px 1fr; gap: 20px; }
.store-cover { width: 240px; height: 180px; object-fit: cover; border-radius: 16px; background: #f2f4f7; }
.store-main { display: grid; gap: 16px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.metric-label { color: #667085; font-size: 14px; }
.metric-value { margin-top: 10px; font-size: 28px; font-weight: 700; color: #101828; }
.metric-value.success { color: #16a34a; }
.metric-value.warning { color: #d97706; }
.metric-value.danger { color: #dc2626; }
.chart-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.status-list, .trend-list, .ranking-list { display: grid; gap: 14px; }
.status-row { display: grid; grid-template-columns: 72px 1fr 48px; gap: 12px; align-items: center; }
.status-label, .status-value, .trend-date, .trend-value, .ranking-meta { color: #475467; font-size: 13px; }
.trend-row { display: grid; grid-template-columns: 48px 1fr 140px; gap: 12px; align-items: center; }
.trend-bar-wrap { height: 10px; background: #eaecf0; border-radius: 999px; overflow: hidden; }
.trend-bar { height: 100%; min-width: 4px; border-radius: 999px; background: linear-gradient(90deg, #2563eb, #38bdf8); }
.ranking-row { display: grid; grid-template-columns: 1fr 80px 100px; gap: 12px; align-items: center; }
.ranking-name, .sku-title { color: #101828; font-weight: 600; }
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.input { width: 260px; }
.select { width: 180px; }
.dialog-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; }
.full-row { grid-column: 1 / -1; }
.full-input { width: 100%; }
.order-section { margin-top: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
@media (max-width: 1280px) { .summary-grid, .chart-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 900px) {
  .page-head, .store-card__content, .summary-grid, .chart-grid, .dialog-grid { display: grid; grid-template-columns: 1fr; }
  .page-actions, .header-actions, .order-head { flex-wrap: wrap; }
  .store-cover { width: 100%; height: 220px; }
}
</style>
