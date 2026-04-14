<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { SchoolContentItem } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import {
  batchDeleteSchoolContentApi,
  batchSetSchoolContentStatusApi,
  createSchoolContentApi,
  deleteSchoolContentApi,
  getSchoolContentListApi,
  toggleSchoolContentStatusApi,
  updateSchoolContentApi
} from "../../api/modules/school";
import { exportTableToCsv } from "../../utils/export";

const loading = ref(false);
const submitting = ref(false);
const list = ref<SchoolContentItem[]>([]);
const total = ref(0);
const selectedRows = ref<SchoolContentItem[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  status: ""
});

const form = reactive({
  school: "",
  userCount: 0,
  postCount: 0,
  storeCount: 0,
  orderCount: 0,
  gmv: 0,
  verifyPassRate: "80%",
  status: "启用"
});

const validateSchool = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value.trim()) return callback(new Error("请输入高校名称"));
  if (value.trim().length < 2) return callback(new Error("高校名称至少 2 个字"));
  callback();
};

const validateRate = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!/^\d{1,3}(\.\d{1,2})?%$/.test(value.trim())) return callback(new Error("请输入正确的百分比，例如 85.6%"));
  const num = Number(value.replace("%", ""));
  if (num < 0 || num > 100) return callback(new Error("认证通过率需在 0% 到 100%"));
  callback();
};

const rules: FormRules<typeof form> = {
  school: [{ validator: validateSchool, trigger: "blur" }],
  userCount: [{ required: true, message: "请输入用户数", trigger: "blur" }],
  postCount: [{ required: true, message: "请输入帖子数", trigger: "blur" }],
  storeCount: [{ required: true, message: "请输入店铺数", trigger: "blur" }],
  orderCount: [{ required: true, message: "请输入订单数", trigger: "blur" }],
  gmv: [{ required: true, message: "请输入成交额", trigger: "blur" }],
  verifyPassRate: [{ validator: validateRate, trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

const selectedIds = computed(() => selectedRows.value.map((item) => item.id));
const totalUserCount = computed(() => list.value.reduce((sum, item) => sum + item.userCount, 0));
const totalPostCount = computed(() => list.value.reduce((sum, item) => sum + item.postCount, 0));
const totalOrderCount = computed(() => list.value.reduce((sum, item) => sum + item.orderCount, 0));
const totalGmv = computed(() => list.value.reduce((sum, item) => sum + item.gmv, 0));

function showApiError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    ElMessage.error(error.traceId ? `${error.message}（追踪号: ${error.traceId}）` : error.message);
    return;
  }
  if (error instanceof Error) ElMessage.error(error.message);
  else ElMessage.error(fallback);
}

function rateToNumber(rate: string) {
  return Number(String(rate).replace("%", "")) || 0;
}

function handleSelectionChange(rows: SchoolContentItem[]) {
  selectedRows.value = rows;
}

function resetForm() {
  editingId.value = null;
  form.school = "";
  form.userCount = 0;
  form.postCount = 0;
  form.storeCount = 0;
  form.orderCount = 0;
  form.gmv = 0;
  form.verifyPassRate = "80%";
  form.status = "启用";
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: SchoolContentItem) {
  editingId.value = row.id;
  form.school = row.school;
  form.userCount = row.userCount;
  form.postCount = row.postCount;
  form.storeCount = row.storeCount;
  form.orderCount = row.orderCount;
  form.gmv = row.gmv;
  form.verifyPassRate = row.verifyPassRate;
  form.status = row.status;
  dialogVisible.value = true;
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
    list.value = result.list;
    total.value = result.total;
    selectedRows.value = [];
  } catch (error) {
    showApiError(error, "加载失败");
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload = {
      school: form.school.trim(),
      userCount: Number(form.userCount),
      postCount: Number(form.postCount),
      storeCount: Number(form.storeCount),
      orderCount: Number(form.orderCount),
      gmv: Number(form.gmv),
      verifyPassRate: form.verifyPassRate.trim(),
      status: form.status
    };

    if (editingId.value) {
      await updateSchoolContentApi(editingId.value, payload);
      ElMessage.success("高校内容已更新");
    } else {
      await createSchoolContentApi(payload);
      ElMessage.success("高校内容已新增");
    }

    dialogVisible.value = false;
    loadData();
  } catch (error) {
    showApiError(error, "保存失败");
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: SchoolContentItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}“${row.school}”吗？`, "状态确认", { type: "warning" });
  try {
    await toggleSchoolContentStatusApi(row.id);
    ElMessage.success(`已${action}`);
    loadData();
  } catch (error) {
    showApiError(error, "状态更新失败");
  }
}

async function removeRow(row: SchoolContentItem) {
  await ElMessageBox.confirm(`确认删除“${row.school}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteSchoolContentApi(row.id);
    ElMessage.success("已删除");
    loadData();
  } catch (error) {
    showApiError(error, "删除失败");
  }
}

async function batchSetStatus(nextStatus: "启用" | "停用") {
  if (!selectedIds.value.length) return ElMessage.warning("请先选择数据");
  await ElMessageBox.confirm(`确认批量${nextStatus}已选记录吗？`, "批量操作确认", { type: "warning" });
  try {
    await batchSetSchoolContentStatusApi({ ids: selectedIds.value, status: nextStatus });
    ElMessage.success(`已批量${nextStatus}`);
    loadData();
  } catch (error) {
    showApiError(error, "批量更新失败");
  }
}

async function batchRemove() {
  if (!selectedIds.value.length) return ElMessage.warning("请先选择数据");
  await ElMessageBox.confirm(`确认删除已选的 ${selectedIds.value.length} 条记录吗？`, "批量删除确认", { type: "warning" });
  try {
    await batchDeleteSchoolContentApi({ ids: selectedIds.value });
    ElMessage.success("已批量删除");
    loadData();
  } catch (error) {
    showApiError(error, "批量删除失败");
  }
}

function exportData() {
  exportTableToCsv(
    "高校内容统计",
    ["高校", "用户数", "帖子数", "店铺数", "订单数", "成交额", "认证通过率", "状态"],
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
      <el-col :span="6"><el-card shadow="never"><div class="metric-label">当前页用户总量</div><div class="metric-value">{{ totalUserCount }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="never"><div class="metric-label">当前页帖子总量</div><div class="metric-value">{{ totalPostCount }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="never"><div class="metric-label">当前页订单总量</div><div class="metric-value">{{ totalOrderCount }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="never"><div class="metric-label">当前页成交额</div><div class="metric-value">¥{{ totalGmv.toLocaleString() }}</div></el-card></el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索高校名称" clearable class="input" />
        <el-input v-model="query.school" placeholder="按高校精确筛选" clearable class="input" />
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="启用" value="启用" />
          <el-option label="停用" value="停用" />
        </el-select>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button type="primary" @click="openCreateDialog">新增</el-button>
        <el-button @click="exportData">导出</el-button>
      </div>
      <div class="batch-bar">
        <span>已选 {{ selectedIds.length }} 项</span>
        <el-button :disabled="!selectedIds.length" @click="batchSetStatus('启用')">批量启用</el-button>
        <el-button :disabled="!selectedIds.length" @click="batchSetStatus('停用')">批量停用</el-button>
        <el-button :disabled="!selectedIds.length" type="danger" plain @click="batchRemove">批量删除</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>高校内容统计</template>
      <el-table :data="list" stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="48" />
        <el-table-column prop="school" label="高校" min-width="150" />
        <el-table-column prop="userCount" label="用户数" width="100" />
        <el-table-column prop="postCount" label="帖子数" width="100" />
        <el-table-column prop="storeCount" label="店铺数" width="100" />
        <el-table-column prop="orderCount" label="订单数" width="100" />
        <el-table-column label="成交额" width="130"><template #default="{ row }">¥{{ row.gmv.toLocaleString() }}</template></el-table-column>
        <el-table-column label="认证通过率" min-width="220">
          <template #default="{ row }">
            <div class="rate-cell">
              <el-progress :percentage="rateToNumber(row.verifyPassRate)" :stroke-width="10" />
              <span>{{ row.verifyPassRate }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link :type="row.status === '启用' ? 'danger' : 'success'" @click="toggleStatus(row)">{{ row.status === "启用" ? "停用" : "启用" }}</el-button>
            <el-button link type="danger" @click="removeRow(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑高校内容' : '新增高校内容'" width="640px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="高校名称" prop="school"><el-input v-model="form.school" placeholder="请输入高校名称" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="用户数" prop="userCount"><el-input-number v-model="form.userCount" :min="0" class="full-width" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="帖子数" prop="postCount"><el-input-number v-model="form.postCount" :min="0" class="full-width" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="店铺数" prop="storeCount"><el-input-number v-model="form.storeCount" :min="0" class="full-width" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="订单数" prop="orderCount"><el-input-number v-model="form.orderCount" :min="0" class="full-width" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="成交额" prop="gmv"><el-input-number v-model="form.gmv" :min="0" :precision="2" class="full-width" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="认证通过率" prop="verifyPassRate"><el-input v-model="form.verifyPassRate" placeholder="例如 85.6%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="状态" prop="status"><el-select v-model="form.status" class="full-width"><el-option label="启用" value="启用" /><el-option label="停用" value="停用" /></el-select></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 16px; }
.metric-label { color: #667085; font-size: 14px; }
.metric-value { margin-top: 12px; font-size: 28px; font-weight: 700; }
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.batch-bar { margin-top: 12px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.input { width: 220px; }
.select { width: 160px; }
.rate-cell { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; }
.full-width { width: 100%; }
.pager-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
