<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getTravelBookingListApi, updateTravelBookingStatusApi } from "../../api/modules/travel";
import { exportTableToCsv } from "../../utils/export";

const loading = ref(false);
const exporting = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({ page: 1, pageSize: 10, keyword: "", status: "" });

const statusText = (status: string) =>
  ({
    submitted: "已报名",
    confirmed: "已确认占位",
    payment: "待支付",
    paid: "已支付",
    canceled: "已取消",
    rejected: "已驳回",
    expired: "超时未支付",
    traveled: "已出行"
  }[status] || status);

async function loadData() {
  loading.value = true;
  try {
    const result = await getTravelBookingListApi(query);
    list.value = result.list || [];
    total.value = result.total || 0;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "报名加载失败");
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  loadData();
}

async function updateStatus(row: any, status: string) {
  try {
    const { value } = await ElMessageBox.prompt("请输入处理备注，可为空", "处理报名", {
      inputValue: row.reviewNote || "",
      confirmButtonText: "确认",
      cancelButtonText: "取消"
    });
    await updateTravelBookingStatusApi(row.id, { status, reviewNote: value || "" });
    ElMessage.success("报名状态已更新");
    await loadData();
  } catch (error) {
    if (error !== "cancel") ElMessage.error(error instanceof Error ? error.message : "处理失败");
  }
}

function exportRows() {
  exporting.value = true;
  try {
    exportTableToCsv(
      `旅游报名_${new Date().toISOString().slice(0, 10)}`,
      ["报名号", "线路", "出发日期", "姓名", "手机", "学校", "人数", "状态", "支付状态", "备注", "报名时间"],
      list.value.map((item) => [
        item.bookingNo,
        item.routeTitle,
        item.departDate,
        item.contactName,
        item.contactPhone,
        item.school,
        item.participantCount,
        statusText(item.status),
        item.paymentStatus,
        item.remark,
        item.createdAt
      ])
    );
  } finally {
    exporting.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="报名号/姓名/手机/学校" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="已报名" value="submitted" />
          <el-option label="已确认占位" value="confirmed" />
          <el-option label="待支付" value="payment" />
          <el-option label="已支付" value="paid" />
          <el-option label="已取消" value="canceled" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button v-permission="'travel:booking:export'" :loading="exporting" @click="exportRows">导出当前页</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="bookingNo" label="报名号" min-width="160" />
        <el-table-column prop="routeTitle" label="线路" min-width="180" />
        <el-table-column prop="departDate" label="出发日期" width="110" />
        <el-table-column prop="contactName" label="姓名" width="100" />
        <el-table-column prop="contactPhone" label="手机号" width="130" />
        <el-table-column prop="school" label="学校" min-width="150" />
        <el-table-column prop="participantCount" label="人数" width="80" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }"><el-tag>{{ statusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="paymentStatus" label="支付状态" width="110" />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="报名时间" width="170" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'travel:booking:review'" link type="success" @click="updateStatus(row, 'confirmed')">确认占位</el-button>
            <el-button v-permission="'travel:booking:review'" link type="warning" @click="updateStatus(row, 'payment')">通知缴费</el-button>
            <el-button v-permission="'travel:booking:review'" link type="danger" @click="updateStatus(row, 'rejected')">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination"><el-pagination background layout="total, prev, pager, next" :total="total" :page-size="query.pageSize" :current-page="query.page" @current-change="(p:number) => { query.page = p; loadData(); }" /></div>
    </el-card>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 16px; }
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; }
.input { width: 280px; }
.select { width: 160px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
