<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { HelpCenterItem, HelpCenterPayload, HelpCenterSummary } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import { createHelpCenterApi, deleteHelpCenterApi, getHelpCenterListApi, toggleHelpCenterStatusApi, updateHelpCenterApi } from "../../api/modules/operation";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const list = ref<HelpCenterItem[]>([]);
const total = ref(0);
const summary = ref<HelpCenterSummary>({
  total: 0,
  publishedCount: 0,
  categoryOptions: [],
  schoolOptions: []
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  category: "",
  status: ""
});

const form = reactive<HelpCenterPayload>({
  category: "",
  title: "",
  school: "全部高校",
  status: "发布中",
  content: "",
  sort: 1
});

const rules: FormRules<typeof form> = {
  category: [{ required: true, message: "请输入分类", trigger: "blur" }],
  title: [{ required: true, message: "请输入标题", trigger: "blur" }],
  school: [{ required: true, message: "请选择适用范围", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  content: [{ required: true, message: "请输入正文", trigger: "blur" }],
  sort: [{ required: true, message: "请输入排序", trigger: "blur" }]
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
  form.category = "";
  form.title = "";
  form.school = "全部高校";
  form.status = "发布中";
  form.content = "";
  form.sort = 1;
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: HelpCenterItem) {
  editingId.value = row.id;
  form.category = row.category;
  form.title = row.title;
  form.school = row.school;
  form.status = row.status;
  form.content = row.content;
  form.sort = row.sort;
  dialogVisible.value = true;
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getHelpCenterListApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } catch (error) {
    showApiError(error, "帮助中心加载失败");
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
  query.category = "";
  query.status = "";
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
    const payload: HelpCenterPayload = {
      category: form.category.trim(),
      title: form.title.trim(),
      school: form.school,
      status: form.status,
      content: form.content.trim(),
      sort: Number(form.sort)
    };
    if (editingId.value) {
      await updateHelpCenterApi(editingId.value, payload);
      ElMessage.success("帮助文章已更新");
    } else {
      await createHelpCenterApi(payload);
      ElMessage.success("帮助文章已创建");
    }
    dialogVisible.value = false;
    loadData();
  } catch (error) {
    showApiError(error, "帮助文章保存失败");
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: HelpCenterItem) {
  const action = row.status === "发布中" ? "转草稿" : "发布";
  await ElMessageBox.confirm(`确认${action}“${row.title}”吗？`, "状态确认", { type: "warning" });
  try {
    await toggleHelpCenterStatusApi(row.id);
    ElMessage.success("帮助文章状态已更新");
    loadData();
  } catch (error) {
    showApiError(error, "帮助文章状态更新失败");
  }
}

async function removeRow(row: HelpCenterItem) {
  await ElMessageBox.confirm(`确认删除“${row.title}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteHelpCenterApi(row.id);
    ElMessage.success("帮助文章已删除");
    loadData();
  } catch (error) {
    showApiError(error, "帮助文章删除失败");
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">文章总数</div><div class="metric-value">{{ summary.total }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">发布中</div><div class="metric-value success">{{ summary.publishedCount }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">分类数量</div><div class="metric-value">{{ summary.categoryOptions.length }}</div></el-card></el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索分类、标题或正文" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.category" placeholder="全部分类" clearable class="select">
          <el-option v-for="item in summary.categoryOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="发布中" value="发布中" />
          <el-option label="草稿" value="草稿" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-permission="'operation:help:add'" type="primary" plain @click="openCreateDialog">新增文章</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>帮助中心列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="category" label="分类" width="140" />
        <el-table-column prop="title" label="标题" min-width="260" />
        <el-table-column prop="school" label="适用范围" width="140" />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === '发布中' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'operation:help:edit'" link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-permission="'operation:help:edit'" link :type="row.status === '发布中' ? 'warning' : 'success'" @click="toggleStatus(row)">
              {{ row.status === "发布中" ? "转草稿" : "发布" }}
            </el-button>
            <el-button v-permission="'operation:help:edit'" link type="danger" @click="removeRow(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑帮助文章' : '新增帮助文章'" width="760px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="分类" prop="category"><el-input v-model="form.category" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="适用范围" prop="school">
              <el-select v-model="form.school" class="full-width" filterable allow-create default-first-option>
                <el-option label="全部高校" value="全部高校" />
                <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="排序" prop="sort"><el-input-number v-model="form.sort" :min="0" class="full-width" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" class="full-width">
                <el-option label="发布中" value="发布中" />
                <el-option label="草稿" value="草稿" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24"><el-form-item label="正文" prop="content"><el-input v-model="form.content" type="textarea" :rows="6" /></el-form-item></el-col>
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
.metric-value { margin-top: 12px; font-size: 30px; font-weight: 700; }
.metric-value.success { color: #16a34a; }
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.input { width: 320px; }
.select { width: 180px; }
.full-width { width: 100%; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
