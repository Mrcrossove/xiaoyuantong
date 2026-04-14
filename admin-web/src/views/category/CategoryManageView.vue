<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { CategoryItem, CategoryPayload, CategoryQuery, CategorySummary, CategoryType } from "../../api/modules/category";
import {
  batchDeleteCategoryApi,
  batchSetCategoryStatusApi,
  createCategoryApi,
  deleteCategoryApi,
  getCategoryListApi,
  toggleCategoryStatusApi,
  updateCategoryApi
} from "../../api/modules/category";
import { ApiRequestError } from "../../api/request";
import { exportTableToCsv } from "../../utils/export";

const props = defineProps<{
  type: CategoryType;
}>();

const CATEGORY_META: Record<
  CategoryType,
  {
    title: string;
    relatedLabel: string;
    addPermission: string;
    editPermission: string;
    codePlaceholder: string;
  }
> = {
  post: {
    title: "帖子分类",
    relatedLabel: "帖子数",
    addPermission: "post:category:add",
    editPermission: "post:category:edit",
    codePlaceholder: "例如 post_help"
  },
  store: {
    title: "店铺分类",
    relatedLabel: "店铺数",
    addPermission: "store:category:add",
    editPermission: "store:category:edit",
    codePlaceholder: "例如 student_store"
  },
  product: {
    title: "商品分类",
    relatedLabel: "商品数",
    addPermission: "product:category:add",
    editPermission: "product:category:edit",
    codePlaceholder: "例如 fruit_snack"
  }
};

const STATUS_OPTIONS: Array<"启用" | "停用"> = ["启用", "停用"];

const meta = computed(() => CATEGORY_META[props.type]);
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const list = ref<CategoryItem[]>([]);
const total = ref(0);
const selectedRows = ref<CategoryItem[]>([]);
const summary = ref<CategorySummary>({
  total: 0,
  enabledCount: 0,
  schoolOptions: []
});

const query = reactive<CategoryQuery>({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  status: ""
});

const form = reactive<CategoryPayload>({
  school: "",
  name: "",
  code: "",
  sort: 1,
  status: "启用"
});

const rules: FormRules<typeof form> = {
  school: [{ required: true, message: "请选择高校", trigger: "change" }],
  name: [{ required: true, message: "请输入分类名称", trigger: "blur" }],
  code: [
    { required: true, message: "请输入分类编码", trigger: "blur" },
    { pattern: /^[a-zA-Z0-9_]+$/, message: "分类编码仅支持字母、数字和下划线", trigger: "blur" }
  ],
  sort: [{ required: true, message: "请输入排序", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

const selectedIds = computed(() => selectedRows.value.map((item) => item.id));
const currentPageRelatedTotal = computed(() => list.value.reduce((sum, item) => sum + item.relatedCount, 0));

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

function resetForm() {
  editingId.value = null;
  form.school = summary.value.schoolOptions[0] || "";
  form.name = "";
  form.code = "";
  form.sort = 1;
  form.status = "启用";
}

function handleSelectionChange(rows: CategoryItem[]) {
  selectedRows.value = rows;
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: CategoryItem) {
  editingId.value = row.id;
  form.school = row.school;
  form.name = row.name;
  form.code = row.code;
  form.sort = row.sort;
  form.status = row.status as "启用" | "停用";
  dialogVisible.value = true;
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getCategoryListApi(props.type, query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
    selectedRows.value = [];
  } catch (error) {
    showApiError(error, `${meta.value.title}加载失败`);
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
  loadData();
}

function handlePageChange(page: number) {
  query.page = page;
  loadData();
}

function handlePageSizeChange(pageSize: number) {
  query.page = 1;
  query.pageSize = pageSize;
  loadData();
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate();
  submitting.value = true;

  try {
    const payload: CategoryPayload = {
      school: form.school,
      name: form.name.trim(),
      code: form.code.trim(),
      sort: Number(form.sort),
      status: form.status
    };

    if (editingId.value !== null) {
      await updateCategoryApi(props.type, editingId.value, payload);
      ElMessage.success(`${meta.value.title}已更新`);
    } else {
      await createCategoryApi(props.type, payload);
      ElMessage.success(`${meta.value.title}已创建`);
    }

    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    showApiError(error, `${meta.value.title}保存失败`);
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: CategoryItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}分类“${row.name}”吗？`, "状态确认", { type: "warning" });

  try {
    await toggleCategoryStatusApi(props.type, row.id);
    ElMessage.success(`已${action}`);
    await loadData();
  } catch (error) {
    showApiError(error, `${meta.value.title}状态更新失败`);
  }
}

async function removeRow(row: CategoryItem) {
  await ElMessageBox.confirm(`确认删除分类“${row.name}”吗？`, "删除确认", { type: "warning" });

  try {
    await deleteCategoryApi(props.type, row.id);
    ElMessage.success(`${meta.value.title}已删除`);
    await loadData();
  } catch (error) {
    showApiError(error, `${meta.value.title}删除失败`);
  }
}

async function batchSetStatus(status: "启用" | "停用") {
  if (!selectedIds.value.length) {
    ElMessage.warning("请先选择数据");
    return;
  }

  await ElMessageBox.confirm(`确认批量设置为“${status}”吗？`, "批量操作确认", { type: "warning" });

  try {
    await batchSetCategoryStatusApi(props.type, {
      ids: selectedIds.value,
      status
    });
    ElMessage.success("批量状态更新成功");
    await loadData();
  } catch (error) {
    showApiError(error, "批量状态更新失败");
  }
}

async function batchRemove() {
  if (!selectedIds.value.length) {
    ElMessage.warning("请先选择数据");
    return;
  }

  await ElMessageBox.confirm(`确认删除已选中的 ${selectedIds.value.length} 条记录吗？`, "批量删除确认", { type: "warning" });

  try {
    await batchDeleteCategoryApi(props.type, {
      ids: selectedIds.value
    });
    ElMessage.success("批量删除成功");
    await loadData();
  } catch (error) {
    showApiError(error, "批量删除失败");
  }
}

function exportData() {
  exportTableToCsv(
    meta.value.title,
    ["分类名称", "分类编码", "所属高校", meta.value.relatedLabel, "排序", "状态", "更新时间"],
    list.value.map((item) => [item.name, item.code, item.school, item.relatedCount, item.sort, item.status, item.updatedAt])
  );
  ElMessage.success("当前页已导出");
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never">
          <div class="metric-label">{{ meta.title }}总数</div>
          <div class="metric-value">{{ summary.total }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <div class="metric-label">启用中的{{ meta.title }}</div>
          <div class="metric-value success">{{ summary.enabledCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <div class="metric-label">当前页{{ meta.relatedLabel }}合计</div>
          <div class="metric-value">{{ currentPageRelatedTotal }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>{{ meta.title }}筛选</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索分类名称、编码或高校" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select" filterable>
          <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option v-for="item in STATUS_OPTIONS" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-permission="meta.addPermission" type="primary" plain @click="openCreateDialog">新增分类</el-button>
        <el-button @click="exportData">导出</el-button>
      </div>

      <div class="batch-bar">
        <span>已选 {{ selectedIds.length }} 项</span>
        <el-button v-permission="meta.editPermission" :disabled="!selectedIds.length" @click="batchSetStatus('启用')">批量启用</el-button>
        <el-button v-permission="meta.editPermission" :disabled="!selectedIds.length" @click="batchSetStatus('停用')">批量停用</el-button>
        <el-button v-permission="meta.editPermission" :disabled="!selectedIds.length" type="danger" plain @click="batchRemove">批量删除</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>{{ meta.title }}列表</template>
      <el-table :data="list" stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="48" />
        <el-table-column prop="name" label="分类名称" min-width="160" />
        <el-table-column prop="code" label="分类编码" min-width="160" />
        <el-table-column prop="school" label="所属高校" min-width="140" />
        <el-table-column prop="relatedCount" :label="meta.relatedLabel" width="100" />
        <el-table-column prop="sort" label="排序" width="90" />
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="meta.editPermission" link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              v-permission="meta.editPermission"
              link
              :type="row.status === '启用' ? 'danger' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === "启用" ? "停用" : "启用" }}
            </el-button>
            <el-button v-permission="meta.editPermission" link type="danger" @click="removeRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :current-page="query.page"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId !== null ? `编辑${meta.title}` : `新增${meta.title}`" width="640px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="所属高校" prop="school">
          <el-select v-model="form.school" class="full-width" filterable>
            <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="form.code" :placeholder="meta.codePlaceholder" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" class="full-width" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" class="full-width">
            <el-option v-for="item in STATUS_OPTIONS" :key="item" :label="item" :value="item" />
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

.metric-value.success {
  color: #16a34a;
}

.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.batch-bar {
  margin-top: 12px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.input {
  width: 320px;
}

.select {
  width: 180px;
}

.full-width {
  width: 100%;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
