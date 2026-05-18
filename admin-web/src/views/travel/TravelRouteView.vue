<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createTravelRouteApi,
  createTravelScheduleApi,
  getTravelProviderListApi,
  getTravelRouteListApi,
  notifyTravelSchedulePaymentApi,
  updateTravelRouteApi,
  updateTravelScheduleApi
} from "../../api/modules/travel";

const loading = ref(false);
const router = useRouter();
const list = ref<any[]>([]);
const providers = ref<any[]>([]);
const total = ref(0);
const routeDialog = ref(false);
const scheduleDialog = ref(false);
const editingRouteId = ref(0);
const editingScheduleId = ref(0);
const currentRouteId = ref(0);
const query = reactive({ page: 1, pageSize: 10, keyword: "", status: "" });
const routeForm = reactive({
  providerId: 0,
  title: "",
  tripType: "一日游",
  destination: "",
  cover: "",
  highlightsText: "",
  itineraryText: "",
  feeIncluded: "",
  feeExcluded: "",
  notice: "",
  refundRule: "",
  serviceSchoolsText: "",
  status: "draft",
  sort: 0
});
const scheduleForm = reactive({
  departDate: "",
  returnDate: "",
  gatherTime: "",
  gatherPlace: "",
  price: 0,
  minGroupSize: 20,
  maxGroupSize: 40,
  signupDeadline: "",
  paymentDeadline: "",
  status: "open"
});

const toArray = (text: string) => String(text || "").split(/\n|,|，/).map((item) => item.trim()).filter(Boolean);
const statusText = (status: string) => ({ draft: "草稿", open: "报名中", paused: "暂停", offline: "下架" }[status] || status);
const scheduleStatusText = (status: string) => ({ open: "报名中", grouped: "已成团", payment: "待支付", full: "已满员", canceled: "已取消", completed: "已完成" }[status] || status);

async function loadData() {
  loading.value = true;
  try {
    const [routeResult, providerResult] = await Promise.all([getTravelRouteListApi(query), getTravelProviderListApi()]);
    list.value = routeResult.list || [];
    total.value = routeResult.total || 0;
    providers.value = providerResult.list || [];
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "线路加载失败");
  } finally {
    loading.value = false;
  }
}

function resetRouteForm() {
  Object.assign(routeForm, {
    providerId: 0,
    title: "",
    tripType: "一日游",
    destination: "",
    cover: "",
    highlightsText: "",
    itineraryText: "",
    feeIncluded: "",
    feeExcluded: "",
    notice: "",
    refundRule: "",
    serviceSchoolsText: "",
    status: "draft",
    sort: 0
  });
}

function openCreateRoute() {
  editingRouteId.value = 0;
  resetRouteForm();
  routeDialog.value = true;
}

function openEditRoute(row: any) {
  editingRouteId.value = row.id;
  Object.assign(routeForm, {
    providerId: row.providerId || 0,
    title: row.title,
    tripType: row.tripType,
    destination: row.destination,
    cover: row.cover,
    highlightsText: (row.highlights || []).join("\n"),
    itineraryText: (row.itinerary || []).join("\n"),
    feeIncluded: row.feeIncluded,
    feeExcluded: row.feeExcluded,
    notice: row.notice,
    refundRule: row.refundRule,
    serviceSchoolsText: (row.serviceSchools || []).join("\n"),
    status: row.status,
    sort: row.sort
  });
  routeDialog.value = true;
}

async function submitRoute() {
  const payload = {
    ...routeForm,
    highlights: toArray(routeForm.highlightsText),
    itinerary: toArray(routeForm.itineraryText),
    serviceSchools: toArray(routeForm.serviceSchoolsText),
    banners: routeForm.cover ? [routeForm.cover] : []
  };
  try {
    if (editingRouteId.value) await updateTravelRouteApi(editingRouteId.value, payload);
    else await createTravelRouteApi(payload);
    ElMessage.success("线路已保存");
    routeDialog.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  }
}

function openCreateSchedule(row: any) {
  currentRouteId.value = row.id;
  editingScheduleId.value = 0;
  Object.assign(scheduleForm, {
    departDate: "",
    returnDate: "",
    gatherTime: "",
    gatherPlace: "",
    price: 0,
    minGroupSize: 20,
    maxGroupSize: 40,
    signupDeadline: "",
    paymentDeadline: "",
    status: "open"
  });
  scheduleDialog.value = true;
}

function openEditSchedule(row: any, schedule: any) {
  currentRouteId.value = row.id;
  editingScheduleId.value = schedule.id;
  Object.assign(scheduleForm, schedule);
  scheduleDialog.value = true;
}

async function submitSchedule() {
  try {
    if (editingScheduleId.value) await updateTravelScheduleApi(currentRouteId.value, editingScheduleId.value, scheduleForm);
    else await createTravelScheduleApi(currentRouteId.value, scheduleForm);
    ElMessage.success("排期已保存");
    scheduleDialog.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "排期保存失败");
  }
}

async function notifyPayment(schedule: any) {
  try {
    await ElMessageBox.confirm("确认成团后会给该排期已报名/已确认用户发送缴费通知，并生成旅游支付订单。", "通知缴费");
    await notifyTravelSchedulePaymentApi(schedule.id);
    ElMessage.success("已通知缴费");
    await loadData();
  } catch (error) {
    if (error !== "cancel") ElMessage.error(error instanceof Error ? error.message : "通知失败");
  }
}

function viewScheduleBookings(schedule: any) {
  router.push({ path: "/travel/booking", query: { scheduleId: String(schedule.id) } });
}

function handleSearch() {
  query.page = 1;
  loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索线路/目的地" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="草稿" value="draft" />
          <el-option label="报名中" value="open" />
          <el-option label="暂停" value="paused" />
          <el-option label="下架" value="offline" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button v-permission="'travel:route:edit'" type="primary" @click="openCreateRoute">新增线路</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="title" label="线路" min-width="220" />
        <el-table-column prop="destination" label="目的地" width="120" />
        <el-table-column prop="tripType" label="类型" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag>{{ statusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="排期" min-width="360">
          <template #default="{ row }">
            <div v-for="item in row.schedules" :key="item.id" class="schedule-row">
              <span>{{ item.departDate }}</span>
              <span>{{ item.priceText }}</span>
              <span>{{ item.confirmedCount }}/{{ item.minGroupSize }}人成团</span>
              <el-tag size="small">{{ scheduleStatusText(item.status) }}</el-tag>
              <el-button link type="success" @click="viewScheduleBookings(item)">看报名</el-button>
              <el-button link type="primary" @click="openEditSchedule(row, item)">编辑</el-button>
              <el-button link type="warning" @click="notifyPayment(item)">通知缴费</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'travel:route:edit'" link type="primary" @click="openEditRoute(row)">编辑</el-button>
            <el-button v-permission="'travel:route:edit'" link type="success" @click="openCreateSchedule(row)">加排期</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination"><el-pagination background layout="total, prev, pager, next" :total="total" :page-size="query.pageSize" :current-page="query.page" @current-change="(p:number) => { query.page = p; loadData(); }" /></div>
    </el-card>

    <el-dialog v-model="routeDialog" title="线路信息" width="760px">
      <el-form label-width="110px">
        <el-form-item label="供应方"><el-select v-model="routeForm.providerId" clearable><el-option v-for="item in providers" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="标题"><el-input v-model="routeForm.title" /></el-form-item>
        <el-form-item label="类型"><el-input v-model="routeForm.tripType" /></el-form-item>
        <el-form-item label="目的地"><el-input v-model="routeForm.destination" /></el-form-item>
        <el-form-item label="封面图"><el-input v-model="routeForm.cover" placeholder="图片 URL" /></el-form-item>
        <el-form-item label="亮点"><el-input v-model="routeForm.highlightsText" type="textarea" placeholder="一行一个亮点" /></el-form-item>
        <el-form-item label="行程"><el-input v-model="routeForm.itineraryText" type="textarea" placeholder="一行一个行程节点" /></el-form-item>
        <el-form-item label="费用包含"><el-input v-model="routeForm.feeIncluded" type="textarea" /></el-form-item>
        <el-form-item label="费用不含"><el-input v-model="routeForm.feeExcluded" type="textarea" /></el-form-item>
        <el-form-item label="注意事项"><el-input v-model="routeForm.notice" type="textarea" /></el-form-item>
        <el-form-item label="退款规则"><el-input v-model="routeForm.refundRule" type="textarea" /></el-form-item>
        <el-form-item label="服务高校"><el-input v-model="routeForm.serviceSchoolsText" type="textarea" placeholder="一行一个高校，不填则全校可见" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="routeForm.status"><el-option label="草稿" value="draft" /><el-option label="报名中" value="open" /><el-option label="暂停" value="paused" /><el-option label="下架" value="offline" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="routeDialog = false">取消</el-button><el-button type="primary" @click="submitRoute">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="scheduleDialog" title="排期信息" width="620px">
      <el-form label-width="120px">
        <el-form-item label="出发日期"><el-date-picker v-model="scheduleForm.departDate" value-format="YYYY-MM-DD" type="date" /></el-form-item>
        <el-form-item label="返回日期"><el-date-picker v-model="scheduleForm.returnDate" value-format="YYYY-MM-DD" type="date" /></el-form-item>
        <el-form-item label="集合时间"><el-input v-model="scheduleForm.gatherTime" /></el-form-item>
        <el-form-item label="集合地点"><el-input v-model="scheduleForm.gatherPlace" /></el-form-item>
        <el-form-item label="价格"><el-input-number v-model="scheduleForm.price" :min="0" /></el-form-item>
        <el-form-item label="成团人数"><el-input-number v-model="scheduleForm.minGroupSize" :min="1" /></el-form-item>
        <el-form-item label="人数上限"><el-input-number v-model="scheduleForm.maxGroupSize" :min="1" /></el-form-item>
        <el-form-item label="报名截止"><el-date-picker v-model="scheduleForm.signupDeadline" value-format="YYYY-MM-DD HH:mm:ss" type="datetime" /></el-form-item>
        <el-form-item label="支付截止"><el-date-picker v-model="scheduleForm.paymentDeadline" value-format="YYYY-MM-DD HH:mm:ss" type="datetime" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="scheduleForm.status"><el-option label="报名中" value="open" /><el-option label="已成团" value="grouped" /><el-option label="待支付" value="payment" /><el-option label="已满员" value="full" /><el-option label="取消" value="canceled" /><el-option label="完成" value="completed" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="scheduleDialog = false">取消</el-button><el-button type="primary" @click="submitSchedule">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 16px; }
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; }
.input { width: 260px; }
.select { width: 150px; }
.schedule-row { display: flex; gap: 10px; align-items: center; line-height: 28px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
