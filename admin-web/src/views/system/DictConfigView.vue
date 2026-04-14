<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { DictConfigResult, DictItemPayload, DictTypeItem, DictTypePayload, DictValueItem } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import {
  createDictItemApi,
  createDictTypeApi,
  deleteDictItemApi,
  deleteDictTypeApi,
  getDictConfigApi,
  toggleDictItemStatusApi,
  toggleDictTypeStatusApi,
  updateDictItemApi,
  updateDictTypeApi
} from "../../api/modules/system";

const loading = ref(false);
const typeDialogVisible = ref(false);
const itemDialogVisible = ref(false);
const typeSubmitting = ref(false);
const itemSubmitting = ref(false);
const editingTypeId = ref<number | null>(null);
const editingItemId = ref<number | null>(null);
const typeFormRef = ref<FormInstance>();
const itemFormRef = ref<FormInstance>();
const dictTypeList = ref<DictTypeItem[]>([]);
const dictItemMap = ref<Record<number, DictValueItem[]>>({});
const summary = ref<DictConfigResult["summary"]>({
  typeCount: 0,
  itemCount: 0
});
const activeTypeId = ref(0);

const currentItems = computed(() => dictItemMap.value[activeTypeId.value] ?? []);
const activeType = computed(() => dictTypeList.value.find((item) => item.id === activeTypeId.value) || null);

const typeForm = reactive<DictTypePayload>({
  name: "",
  code: "",
  status: "启用",
  remark: "",
  sort: 1
});

const itemForm = reactive<DictItemPayload>({
  typeId: 0,
  label: "",
  value: "",
  sort: 1,
  status: "启用",
  remark: ""
});

const typeRules: FormRules<typeof typeForm> = {
  name: [{ required: true, message: "请输入字典名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入字典编码", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  sort: [{ required: true, message: "请输入排序", trigger: "blur" }]
};

const itemRules: FormRules<typeof itemForm> = {
  typeId: [{ required: true, message: "请选择所属字典", trigger: "change" }],
  label: [{ required: true, message: "请输入字典标签", trigger: "blur" }],
  value: [{ required: true, message: "请输入字典值", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
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

function resetTypeForm() {
  editingTypeId.value = null;
  typeForm.name = "";
  typeForm.code = "";
  typeForm.status = "启用";
  typeForm.remark = "";
  typeForm.sort = dictTypeList.value.length + 1;
}

function resetItemForm() {
  editingItemId.value = null;
  itemForm.typeId = activeTypeId.value || dictTypeList.value[0]?.id || 0;
  itemForm.label = "";
  itemForm.value = "";
  itemForm.status = "启用";
  itemForm.remark = "";
  itemForm.sort = currentItems.value.length + 1;
}

function openCreateTypeDialog() {
  resetTypeForm();
  typeDialogVisible.value = true;
}

function openEditTypeDialog(row: DictTypeItem) {
  editingTypeId.value = row.id;
  typeForm.name = row.name;
  typeForm.code = row.code;
  typeForm.status = row.status;
  typeForm.remark = row.remark;
  typeForm.sort = row.sort;
  typeDialogVisible.value = true;
}

function openCreateItemDialog() {
  resetItemForm();
  itemDialogVisible.value = true;
}

function openEditItemDialog(row: DictValueItem) {
  editingItemId.value = row.id;
  itemForm.typeId = row.typeId;
  itemForm.label = row.label;
  itemForm.value = row.value;
  itemForm.status = row.status;
  itemForm.remark = row.remark;
  itemForm.sort = row.sort;
  itemDialogVisible.value = true;
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getDictConfigApi();
    dictTypeList.value = result.types;
    dictItemMap.value = result.items;
    summary.value = result.summary;
    if (!activeTypeId.value || !dictTypeList.value.some((item) => item.id === activeTypeId.value)) {
      activeTypeId.value = dictTypeList.value[0]?.id || 0;
    }
  } catch (error) {
    showApiError(error, "字典配置加载失败");
  } finally {
    loading.value = false;
  }
}

async function submitTypeForm() {
  if (!typeFormRef.value) return;
  await typeFormRef.value.validate();
  typeSubmitting.value = true;
  try {
    const payload: DictTypePayload = {
      name: typeForm.name.trim(),
      code: typeForm.code.trim(),
      status: typeForm.status,
      remark: typeForm.remark.trim(),
      sort: Number(typeForm.sort)
    };

    if (editingTypeId.value) {
      await updateDictTypeApi(editingTypeId.value, payload);
      ElMessage.success("字典类型已更新");
    } else {
      await createDictTypeApi(payload);
      ElMessage.success("字典类型已创建");
    }

    typeDialogVisible.value = false;
    loadData();
  } catch (error) {
    showApiError(error, "字典类型保存失败");
  } finally {
    typeSubmitting.value = false;
  }
}

async function submitItemForm() {
  if (!itemFormRef.value) return;
  await itemFormRef.value.validate();
  itemSubmitting.value = true;
  try {
    const payload: DictItemPayload = {
      typeId: Number(itemForm.typeId),
      label: itemForm.label.trim(),
      value: itemForm.value.trim(),
      status: itemForm.status,
      remark: itemForm.remark.trim(),
      sort: Number(itemForm.sort)
    };

    if (editingItemId.value) {
      await updateDictItemApi(editingItemId.value, payload);
      ElMessage.success("字典项已更新");
    } else {
      await createDictItemApi(payload);
      ElMessage.success("字典项已创建");
    }

    itemDialogVisible.value = false;
    loadData();
  } catch (error) {
    showApiError(error, "字典项保存失败");
  } finally {
    itemSubmitting.value = false;
  }
}

async function toggleTypeStatus(row: DictTypeItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}字典类型“${row.name}”吗？`, "状态确认", { type: "warning" });
  try {
    await toggleDictTypeStatusApi(row.id);
    ElMessage.success(`已${action}`);
    loadData();
  } catch (error) {
    showApiError(error, "字典类型状态更新失败");
  }
}

async function removeType(row: DictTypeItem) {
  await ElMessageBox.confirm(`确认删除字典类型“${row.name}”吗？删除后其下所有字典项也会被清除。`, "删除确认", { type: "warning" });
  try {
    await deleteDictTypeApi(row.id);
    ElMessage.success("字典类型已删除");
    loadData();
  } catch (error) {
    showApiError(error, "字典类型删除失败");
  }
}

async function toggleItemStatus(row: DictValueItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}字典项“${row.label}”吗？`, "状态确认", { type: "warning" });
  try {
    await toggleDictItemStatusApi(row.id);
    ElMessage.success(`已${action}`);
    loadData();
  } catch (error) {
    showApiError(error, "字典项状态更新失败");
  }
}

async function removeItem(row: DictValueItem) {
  await ElMessageBox.confirm(`确认删除字典项“${row.label}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteDictItemApi(row.id);
    ElMessage.success("字典项已删除");
    loadData();
  } catch (error) {
    showApiError(error, "字典项删除失败");
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="16">
      <el-col :span="12"><el-card shadow="never"><div class="metric-label">字典类型</div><div class="metric-value">{{ summary.typeCount }}</div></el-card></el-col>
      <el-col :span="12"><el-card shadow="never"><div class="metric-label">字典项总数</div><div class="metric-value success">{{ summary.itemCount }}</div></el-card></el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>字典类型</span>
              <el-button v-permission="'system:dict:add'" type="primary" link @click="openCreateTypeDialog">新增类型</el-button>
            </div>
          </template>
          <el-table
            :data="dictTypeList"
            stripe
            highlight-current-row
            row-key="id"
            :current-row-key="activeTypeId"
            @current-change="(row) => row && (activeTypeId = row.id)"
          >
            <el-table-column prop="name" label="字典名称" min-width="140" />
            <el-table-column prop="code" label="字典编码" min-width="150" />
            <el-table-column prop="sort" label="排序" width="70" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button v-permission="'system:dict:edit'" link type="primary" @click.stop="openEditTypeDialog(row)">编辑</el-button>
                <el-button v-permission="'system:dict:edit'" link :type="row.status === '启用' ? 'danger' : 'success'" @click.stop="toggleTypeStatus(row)">
                  {{ row.status === "启用" ? "停用" : "启用" }}
                </el-button>
                <el-button v-permission="'system:dict:edit'" link type="danger" @click.stop="removeType(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>字典项配置<span v-if="activeType"> / {{ activeType.name }}</span></span>
              <el-button v-permission="'system:dict:add'" type="primary" link :disabled="!activeTypeId" @click="openCreateItemDialog">新增字典项</el-button>
            </div>
          </template>
          <el-table :data="currentItems" stripe>
            <el-table-column prop="label" label="标签" min-width="140" />
            <el-table-column prop="value" label="值" min-width="140" />
            <el-table-column prop="sort" label="排序" width="70" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }"><el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" width="170" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button v-permission="'system:dict:edit'" link type="primary" @click="openEditItemDialog(row)">编辑</el-button>
                <el-button v-permission="'system:dict:edit'" link :type="row.status === '启用' ? 'danger' : 'success'" @click="toggleItemStatus(row)">
                  {{ row.status === "启用" ? "停用" : "启用" }}
                </el-button>
                <el-button v-permission="'system:dict:edit'" link type="danger" @click="removeItem(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="typeDialogVisible" :title="editingTypeId ? '编辑字典类型' : '新增字典类型'" width="620px">
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="90px">
        <el-form-item label="字典名称" prop="name"><el-input v-model="typeForm.name" /></el-form-item>
        <el-form-item label="字典编码" prop="code"><el-input v-model="typeForm.code" /></el-form-item>
        <el-form-item label="排序" prop="sort"><el-input-number v-model="typeForm.sort" :min="0" class="full-width" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="typeForm.status" class="full-width">
            <el-option label="启用" value="启用" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明"><el-input v-model="typeForm.remark" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="typeSubmitting" @click="submitTypeForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="itemDialogVisible" :title="editingItemId ? '编辑字典项' : '新增字典项'" width="620px">
      <el-form ref="itemFormRef" :model="itemForm" :rules="itemRules" label-width="90px">
        <el-form-item label="所属字典" prop="typeId">
          <el-select v-model="itemForm.typeId" class="full-width">
            <el-option v-for="item in dictTypeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签" prop="label"><el-input v-model="itemForm.label" /></el-form-item>
        <el-form-item label="值" prop="value"><el-input v-model="itemForm.value" /></el-form-item>
        <el-form-item label="排序" prop="sort"><el-input-number v-model="itemForm.sort" :min="0" class="full-width" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="itemForm.status" class="full-width">
            <el-option label="启用" value="启用" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明"><el-input v-model="itemForm.remark" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="itemSubmitting" @click="submitItemForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 16px; }
.metric-label { color: #667085; font-size: 14px; }
.metric-value { margin-top: 12px; font-size: 30px; font-weight: 700; }
.metric-value.success { color: #16a34a; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.full-width { width: 100%; }
</style>
