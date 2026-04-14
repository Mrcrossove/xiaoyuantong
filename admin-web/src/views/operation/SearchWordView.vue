<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { SearchWordItem, SearchWordPayload, SearchWordSummary } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import {
  createSearchKeywordApi,
  deleteSearchKeywordApi,
  getSearchKeywordsApi,
  toggleSearchKeywordStatusApi,
  updateSearchKeywordApi
} from "../../api/modules/operation";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const list = ref<SearchWordItem[]>([]);
const total = ref(0);
const summary = ref<SearchWordSummary>({
  total: 0,
  enabledCount: 0,
  schoolOptions: []
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: ""
});

const form = reactive<SearchWordPayload>({
  school: "",
  keyword: "",
  searchCount: 0,
  sort: 1,
  status: "启用"
});

const rules: FormRules<typeof form> = {
  school: [{ required: true, message: "请选择高校", trigger: "change" }],
  keyword: [{ required: true, message: "请输入搜索热词", trigger: "blur" }],
  searchCount: [{ required: true, message: "请输入搜索量", trigger: "blur" }],
  sort: [{ required: true, message: "请输入排序", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

function showApiError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    ElMessage.error(error.traceId ? `${error.message}（追踪号: ${error.traceId}）` : error.message);
    return;
  }
  if (error instanceof Error) ElMessage.error(error.message);
  else ElMessage.error(fallback);
}

function resetForm() {
  editingId.value = null;
  form.school = summary.value.schoolOptions[0] || "";
  form.keyword = "";
  form.searchCount = 0;
  form.sort = 1;
  form.status = "启用";
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: SearchWordItem) {
  editingId.value = row.id;
  form.school = row.school;
  form.keyword = row.keyword;
  form.searchCount = row.searchCount;
  form.sort = row.sort;
  form.status = row.status;
  dialogVisible.value = true;
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getSearchKeywordsApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } catch (error) {
    showApiError(error, "搜索热词加载失败");
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
  loadData();
}

function handlePageChange(page: number) {
  query.page = page;
  loadData();
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload: SearchWordPayload = {
      school: form.school,
      keyword: form.keyword.trim(),
      searchCount: Number(form.searchCount),
      sort: Number(form.sort),
      status: form.status
    };

    if (editingId.value) {
      await updateSearchKeywordApi(editingId.value, payload);
      ElMessage.success("搜索热词已更新");
    } else {
      await createSearchKeywordApi(payload);
      ElMessage.success("搜索热词已创建");
    }

    dialogVisible.value = false;
    loadData();
  } catch (error) {
    showApiError(error, "搜索热词保存失败");
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: SearchWordItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}热词“${row.keyword}”吗？`, "状态确认", { type: "warning" });
  try {
    await toggleSearchKeywordStatusApi(row.id);
    ElMessage.success(`已${action}`);
    loadData();
  } catch (error) {
    showApiError(error, "热词状态更新失败");
  }
}

async function removeRow(row: SearchWordItem) {
  await ElMessageBox.confirm(`确认删除热词“${row.keyword}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteSearchKeywordApi(row.id);
    ElMessage.success("搜索热词已删除");
    loadData();
  } catch (error) {
    showApiError(error, "搜索热词删除失败");
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">热词数量</div><div class="metric-value">{{ summary.total }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">启用热词</div><div class="metric-value success">{{ summary.enabledCount }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">高校范围</div><div class="metric-value">{{ summary.schoolOptions.length }}</div></el-card></el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索热词或高校" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-permission="'operation:search:add'" type="primary" plain @click="openCreateDialog">新增热词</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>搜索热词列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="school" label="高校" min-width="140" />
        <el-table-column prop="keyword" label="关键词" min-width="180" />
        <el-table-column prop="searchCount" label="搜索量" width="120" />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'operation:search:edit'" link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-permission="'operation:search:edit'" link :type="row.status === '启用' ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === "启用" ? "停用" : "启用" }}
            </el-button>
            <el-button v-permission="'operation:search:edit'" link type="danger" @click="removeRow(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑搜索热词' : '新增搜索热词'" width="620px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="所属高校" prop="school">
          <el-select v-model="form.school" class="full-width" filterable allow-create default-first-option>
            <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索热词" prop="keyword"><el-input v-model="form.keyword" /></el-form-item>
        <el-form-item label="搜索量" prop="searchCount"><el-input-number v-model="form.searchCount" :min="0" class="full-width" /></el-form-item>
        <el-form-item label="排序" prop="sort"><el-input-number v-model="form.sort" :min="0" class="full-width" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" class="full-width">
            <el-option label="启用" value="启用" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
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
.metric-value { margin-top: 12px; font-size: 30px; font-weight: 700; }
.metric-value.success { color: #16a34a; }
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.input { width: 320px; }
.select { width: 180px; }
.full-width { width: 100%; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
