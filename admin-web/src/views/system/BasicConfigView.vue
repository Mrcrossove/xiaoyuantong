<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { BasicConfigItem, BasicConfigPayload, BasicConfigResult } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import { createBasicConfigApi, deleteBasicConfigApi, getBasicConfigApi, toggleBasicConfigStatusApi, updateBasicConfigApi } from "../../api/modules/system";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const list = ref<BasicConfigItem[]>([]);
const total = ref(0);
const summary = ref<BasicConfigResult["summary"]>({
  total: 0,
  enabledCount: 0,
  sectionOptions: []
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  sectionKey: "",
  status: ""
});

const form = reactive<BasicConfigPayload>({
  sectionKey: "",
  sectionTitle: "",
  configKey: "",
  label: "",
  value: "",
  valueType: "text",
  suffix: "",
  sort: 1,
  status: "启用",
  remark: ""
});

const rules: FormRules<typeof form> = {
  sectionKey: [{ required: true, message: "请输入分组标识", trigger: "blur" }],
  sectionTitle: [{ required: true, message: "请输入分组标题", trigger: "blur" }],
  configKey: [{ required: true, message: "请输入配置项标识", trigger: "blur" }],
  label: [{ required: true, message: "请输入配置项名称", trigger: "blur" }],
  valueType: [{ required: true, message: "请选择值类型", trigger: "change" }],
  sort: [{ required: true, message: "请输入排序", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

const sectionCount = computed(() => summary.value.sectionOptions.length);

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
  form.sectionKey = "";
  form.sectionTitle = "";
  form.configKey = "";
  form.label = "";
  form.value = "";
  form.valueType = "text";
  form.suffix = "";
  form.sort = 1;
  form.status = "启用";
  form.remark = "";
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: BasicConfigItem) {
  editingId.value = row.id;
  form.sectionKey = row.sectionKey;
  form.sectionTitle = row.sectionTitle;
  form.configKey = row.configKey;
  form.label = row.label;
  form.value = row.valueType === "switch" ? Boolean(row.value) : String(row.value ?? "");
  form.valueType = row.valueType;
  form.suffix = row.suffix || "";
  form.sort = row.sort;
  form.status = row.status;
  form.remark = row.remark;
  dialogVisible.value = true;
}

function handleValueTypeChange() {
  form.value = form.valueType === "switch" ? true : "";
}

function formatValue(row: BasicConfigItem) {
  if (row.valueType === "switch") return row.value ? "开启" : "关闭";
  return `${row.value}${row.suffix || ""}`;
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getBasicConfigApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } catch (error) {
    showApiError(error, "基础配置加载失败");
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
  query.sectionKey = "";
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
    const payload: BasicConfigPayload = {
      sectionKey: form.sectionKey.trim(),
      sectionTitle: form.sectionTitle.trim(),
      configKey: form.configKey.trim(),
      label: form.label.trim(),
      value: form.valueType === "switch" ? Boolean(form.value) : String(form.value ?? "").trim(),
      valueType: form.valueType,
      suffix: form.suffix?.trim() || "",
      sort: Number(form.sort),
      status: form.status,
      remark: form.remark?.trim() || ""
    };

    if (editingId.value) {
      await updateBasicConfigApi(editingId.value, payload);
      ElMessage.success("基础配置已更新");
    } else {
      await createBasicConfigApi(payload);
      ElMessage.success("基础配置已创建");
    }

    dialogVisible.value = false;
    loadData();
  } catch (error) {
    showApiError(error, "基础配置保存失败");
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: BasicConfigItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}配置“${row.label}”吗？`, "状态确认", { type: "warning" });
  try {
    await toggleBasicConfigStatusApi(row.id);
    ElMessage.success(`已${action}`);
    loadData();
  } catch (error) {
    showApiError(error, "基础配置状态更新失败");
  }
}

async function removeRow(row: BasicConfigItem) {
  await ElMessageBox.confirm(`确认删除配置“${row.label}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteBasicConfigApi(row.id);
    ElMessage.success("基础配置已删除");
    loadData();
  } catch (error) {
    showApiError(error, "基础配置删除失败");
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">配置项数量</div><div class="metric-value">{{ summary.total }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">启用配置</div><div class="metric-value success">{{ summary.enabledCount }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">配置分组</div><div class="metric-value">{{ sectionCount }}</div></el-card></el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索配置项名称或标识" clearable class="input" @keyup.enter="handleSearch" />
        <el-input v-model="query.sectionKey" placeholder="按分组标识筛选" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="启用" value="启用" />
          <el-option label="停用" value="停用" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-permission="'system:basic:add'" type="primary" plain @click="openCreateDialog">新增配置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>基础配置列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="sectionTitle" label="分组" width="160" />
        <el-table-column prop="label" label="配置项名称" min-width="180" />
        <el-table-column prop="configKey" label="配置项标识" min-width="180" />
        <el-table-column prop="valueType" label="值类型" width="100">
          <template #default="{ row }">{{ row.valueType === "switch" ? "开关" : "文本" }}</template>
        </el-table-column>
        <el-table-column label="当前值" min-width="160">
          <template #default="{ row }">{{ formatValue(row) }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'system:basic:edit'" link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-permission="'system:basic:edit'" link :type="row.status === '启用' ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === "启用" ? "停用" : "启用" }}
            </el-button>
            <el-button v-permission="'system:basic:edit'" link type="danger" @click="removeRow(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑基础配置' : '新增基础配置'" width="760px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="分组标识" prop="sectionKey"><el-input v-model="form.sectionKey" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="分组标题" prop="sectionTitle"><el-input v-model="form.sectionTitle" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="配置项标识" prop="configKey"><el-input v-model="form.configKey" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="配置项名称" prop="label"><el-input v-model="form.label" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="值类型" prop="valueType">
              <el-select v-model="form.valueType" class="full-width" @change="handleValueTypeChange">
                <el-option label="文本" value="text" />
                <el-option label="开关" value="switch" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="后缀"><el-input v-model="form.suffix" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="当前值">
              <el-switch v-if="form.valueType === 'switch'" v-model="form.value" />
              <el-input v-else v-model="form.value" />
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="排序" prop="sort"><el-input-number v-model="form.sort" :min="0" class="full-width" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" class="full-width">
                <el-option label="启用" value="启用" />
                <el-option label="停用" value="停用" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item></el-col>
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
.input { width: 220px; }
.select { width: 180px; }
.full-width { width: 100%; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
