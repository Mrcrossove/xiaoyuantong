<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  exportSupplyRequestListApi,
  getSupplyRequestListApi,
  updateSupplyRequestStatusApi
} from "../../api/modules/trade";
import { exportTableToCsv } from "../../utils/export";

const loading = ref(false);
const exporting = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  status: "",
  dateFrom: "",
  dateTo: ""
});

const schoolOptions = computed(() => [...new Set(list.value.map((item) => item.school).filter(Boolean))]);

function statusText(status: string) {
  const map: Record<string, string> = {
    pending: "待处理",
    delivering: "配送中",
    completed: "已完成",
    rejected: "已驳回"
  };
  return map[status] || status || "-";
}

function statusType(status: string) {
  if (status === "completed") return "success";
  if (status === "delivering") return "warning";
  if (status === "rejected") return "danger";
  return "info";
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getSupplyRequestListApi(query);
    list.value = result.list || [];
    total.value = result.total || 0;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "补给申请加载失败");
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
  query.dateFrom = "";
  query.dateTo = "";
  loadData();
}

function handlePageChange(page: number) {
  query.page = page;
  loadData();
}

async function handleStatus(row: any, status: string) {
  try {
    const { value } = await ElMessageBox.prompt("请输入处理备注，可为空", "处理补给申请", {
      inputValue: row.adminNote || "",
      inputPlaceholder: "处理备注",
      confirmButtonText: "确认",
      cancelButtonText: "取消"
    });
    await updateSupplyRequestStatusApi(row.id, {
      status,
      adminNote: value || ""
    });
    ElMessage.success("补给申请状态已更新");
    await loadData();
  } catch (error) {
    if (error === "cancel") return;
    ElMessage.error(error instanceof Error ? error.message : "状态更新失败");
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const rows = await exportSupplyRequestListApi({
      keyword: query.keyword,
      school: query.school,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo
    });
    exportTableToCsv(
      `商品补给申请_${new Date().toISOString().slice(0, 10)}`,
      ["申请编号", "店铺名称", "店主", "联系电话", "高校", "店铺详细地址", "商品名称", "申请数量", "申请时间", "处理状态", "处理人", "处理时间", "处理备注"],
      rows.map((item) => [
        item.requestNo,
        item.storeName,
        item.ownerName,
        item.phone,
        item.school,
        item.address,
        item.productName,
        item.quantity,
        item.createdAt,
        statusText(item.status),
        item.handlerName || "",
        item.handledAt || "",
        item.adminNote || ""
      ])
    );
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "导出失败");
  } finally {
    exporting.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page supply-admin-page">
    <el-card shadow="never">
      <template #header>补给申请筛选</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索编号、店铺、店主、电话、商品" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="处理状态" clearable class="select">
          <el-option label="待处理" value="pending" />
          <el-option label="配送中" value="delivering" />
          <el-option label="已完成" value="completed" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-date-picker v-model="query.dateFrom" value-format="YYYY-MM-DD" type="date" placeholder="开始日期" class="date" />
        <el-date-picker v-model="query.dateTo" value-format="YYYY-MM-DD" type="date" placeholder="结束日期" class="date" />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-permission="'supply:export'" :loading="exporting" @click="handleExport">导出 CSV</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>商品补给申请</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="requestNo" label="申请编号" min-width="170" />
        <el-table-column prop="storeName" label="店铺名称" min-width="160" />
        <el-table-column prop="ownerName" label="店主" width="110" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="school" label="高校" min-width="140" />
        <el-table-column prop="address" label="详细地址" min-width="220" show-overflow-tooltip />
        <el-table-column prop="productName" label="商品名称" min-width="160" />
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="170" />
        <el-table-column prop="handlerName" label="处理人" width="110" />
        <el-table-column prop="handledAt" label="处理时间" width="170" />
        <el-table-column prop="adminNote" label="处理备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'supply:handle'" link type="warning" @click="handleStatus(row, 'delivering')">配送中</el-button>
            <el-button v-permission="'supply:handle'" link type="success" @click="handleStatus(row, 'completed')">完成</el-button>
            <el-button v-permission="'supply:handle'" link type="danger" @click="handleStatus(row, 'rejected')">驳回</el-button>
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
.supply-admin-page {
  display: grid;
  gap: 16px;
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
  width: 160px;
}

.date {
  width: 150px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
