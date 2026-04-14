<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { UserPublishItem } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import {
  batchDeleteUserPublishRecordApi,
  batchSetUserPublishStatusApi,
  createUserPublishRecordApi,
  deleteUserPublishRecordApi,
  getUserPublishRecordsApi,
  toggleUserPublishStatusApi,
  updateUserPublishRecordApi
} from "../../api/modules/user";
import { exportTableToCsv } from "../../utils/export";

const loading = ref(false);
const submitting = ref(false);
const list = ref<UserPublishItem[]>([]);
const total = ref(0);
const selectedRows = ref<UserPublishItem[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();

const typeChoices = ["帖子", "店铺", "商品"];
const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  type: "",
  status: ""
});

const form = reactive({
  school: "",
  user: "",
  type: "帖子",
  title: "",
  status: "已发布"
});

const rules: FormRules<typeof form> = {
  school: [{ required: true, message: "请输入高校名称", trigger: "blur" }],
  user: [{ required: true, message: "请输入用户名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择类型", trigger: "change" }],
  title: [{ required: true, message: "请输入内容标题", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

const selectedIds = computed(() => selectedRows.value.map((item) => item.id));
const postCount = computed(() => list.value.filter((item) => item.type === "帖子").length);
const storeCount = computed(() => list.value.filter((item) => item.type === "店铺").length);
const productCount = computed(() => list.value.filter((item) => item.type === "商品").length);

function showApiError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    ElMessage.error(error.traceId ? `${error.message}（追踪号: ${error.traceId}）` : error.message);
    return;
  }
  if (error instanceof Error) ElMessage.error(error.message);
  else ElMessage.error(fallback);
}

function getActiveStatus(typeValue: string) {
  return typeValue === "商品" ? "已上架" : "已发布";
}

function getStatusChoices(typeValue: string) {
  return [getActiveStatus(typeValue), "待审核", "已停用"];
}

function getTagType(value: string) {
  if (value.includes("发布") || value.includes("上架")) return "success";
  if (value.includes("待")) return "warning";
  return "info";
}

function syncStatusByType() {
  const choices = getStatusChoices(form.type);
  if (!choices.includes(form.status)) form.status = choices[0];
}

function resetForm() {
  editingId.value = null;
  form.school = "";
  form.user = "";
  form.type = "帖子";
  form.title = "";
  form.status = "已发布";
}

function resetQuery() {
  query.keyword = "";
  query.school = "";
  query.type = "";
  query.status = "";
  query.page = 1;
  loadData();
}

function search() {
  query.page = 1;
  loadData();
}

function handleSelectionChange(rows: UserPublishItem[]) {
  selectedRows.value = rows;
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: UserPublishItem) {
  editingId.value = row.id;
  form.school = row.school;
  form.user = row.user;
  form.type = row.type;
  form.title = row.title;
  form.status = row.status;
  dialogVisible.value = true;
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getUserPublishRecordsApi({ ...query });
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
      user: form.user.trim(),
      type: form.type,
      title: form.title.trim(),
      status: form.status
    };
    if (editingId.value) {
      await updateUserPublishRecordApi(editingId.value, payload);
      ElMessage.success("发布记录已更新");
    } else {
      await createUserPublishRecordApi(payload);
      ElMessage.success("发布记录已新增");
    }
    dialogVisible.value = false;
    loadData();
  } catch (error) {
    showApiError(error, "保存失败");
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: UserPublishItem) {
  const action = row.status === getActiveStatus(row.type) ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}这条发布记录吗？`, "状态确认", { type: "warning" });
  try {
    await toggleUserPublishStatusApi(row.id);
    ElMessage.success(`已${action}`);
    loadData();
  } catch (error) {
    showApiError(error, "状态更新失败");
  }
}

async function removeRow(row: UserPublishItem) {
  await ElMessageBox.confirm(`确认删除“${row.title}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteUserPublishRecordApi(row.id);
    ElMessage.success("已删除");
    loadData();
  } catch (error) {
    showApiError(error, "删除失败");
  }
}

async function batchSetStatus(nextStatus: string) {
  if (!selectedIds.value.length) return ElMessage.warning("请先选择数据");
  await ElMessageBox.confirm(`确认批量更新状态为“${nextStatus}”吗？`, "批量操作确认", { type: "warning" });
  try {
    await batchSetUserPublishStatusApi({ ids: selectedIds.value, status: nextStatus });
    ElMessage.success("已批量更新");
    loadData();
  } catch (error) {
    showApiError(error, "批量更新失败");
  }
}

async function batchRemove() {
  if (!selectedIds.value.length) return ElMessage.warning("请先选择数据");
  await ElMessageBox.confirm(`确认删除已选的 ${selectedIds.value.length} 条记录吗？`, "批量删除确认", { type: "warning" });
  try {
    await batchDeleteUserPublishRecordApi({ ids: selectedIds.value });
    ElMessage.success("已批量删除");
    loadData();
  } catch (error) {
    showApiError(error, "批量删除失败");
  }
}

function exportData() {
  exportTableToCsv(
    "用户发布记录",
    ["高校", "用户", "类型", "标题", "状态", "发布时间"],
    list.value.map((item) => [item.school, item.user, item.type, item.title, item.status, item.createdAt])
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
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">当前页帖子发布</div><div class="metric-value">{{ postCount }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">当前页店铺发布</div><div class="metric-value">{{ storeCount }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">当前页商品发布</div><div class="metric-value">{{ productCount }}</div></el-card></el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索用户或标题" clearable class="input" />
        <el-input v-model="query.school" placeholder="按高校精确筛选" clearable class="input" />
        <el-select v-model="query.type" placeholder="全部类型" clearable class="select"><el-option v-for="item in typeChoices" :key="item" :label="item" :value="item" /></el-select>
        <el-input v-model="query.status" placeholder="按状态筛选" clearable class="input" />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button type="primary" @click="openCreateDialog">新增</el-button>
        <el-button @click="exportData">导出</el-button>
      </div>
      <div class="batch-bar">
        <span>已选 {{ selectedIds.length }} 项</span>
        <el-button :disabled="!selectedIds.length" @click="batchSetStatus('已发布')">批量设为已发布</el-button>
        <el-button :disabled="!selectedIds.length" @click="batchSetStatus('待审核')">批量设为待审核</el-button>
        <el-button :disabled="!selectedIds.length" @click="batchSetStatus('已停用')">批量停用</el-button>
        <el-button :disabled="!selectedIds.length" type="danger" plain @click="batchRemove">批量删除</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>用户发布记录</template>
      <el-table :data="list" stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="48" />
        <el-table-column prop="school" label="高校" min-width="140" />
        <el-table-column prop="user" label="用户" width="110" />
        <el-table-column prop="type" label="类型" width="90" />
        <el-table-column prop="title" label="内容标题" min-width="240" />
        <el-table-column prop="createdAt" label="发布时间" width="170" />
        <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="getTagType(row.status)">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link :type="row.status === getActiveStatus(row.type) ? 'danger' : 'success'" @click="toggleStatus(row)">{{ row.status === getActiveStatus(row.type) ? "停用" : "启用" }}</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑发布记录' : '新增发布记录'" width="620px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="高校" prop="school"><el-input v-model="form.school" placeholder="请输入高校名称" /></el-form-item>
        <el-form-item label="用户" prop="user"><el-input v-model="form.user" placeholder="请输入用户名称" /></el-form-item>
        <el-form-item label="类型" prop="type"><el-select v-model="form.type" class="full-width" @change="syncStatusByType"><el-option v-for="item in typeChoices" :key="item" :label="item" :value="item" /></el-select></el-form-item>
        <el-form-item label="标题" prop="title"><el-input v-model="form.title" placeholder="请输入内容标题" /></el-form-item>
        <el-form-item label="状态" prop="status"><el-select v-model="form.status" class="full-width"><el-option v-for="item in getStatusChoices(form.type)" :key="item" :label="item" :value="item" /></el-select></el-form-item>
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
.input { width: 200px; }
.select { width: 150px; }
.full-width { width: 100%; }
.pager-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
