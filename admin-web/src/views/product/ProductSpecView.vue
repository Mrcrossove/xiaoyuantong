<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { ProductSpecItem } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import {
  batchDeleteProductSpecApi,
  batchSetProductSpecStatusApi,
  createProductSpecApi,
  deleteProductSpecApi,
  getProductSpecsApi,
  toggleProductSpecStatusApi,
  updateProductSpecApi
} from "../../api/modules/product";
import { exportTableToCsv } from "../../utils/export";

const loading = ref(false);
const submitting = ref(false);
const list = ref<ProductSpecItem[]>([]);
const total = ref(0);
const selectedRows = ref<ProductSpecItem[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  storeName: "",
  status: ""
});

const form = reactive({
  school: "",
  storeName: "",
  productName: "",
  specGroup: "",
  specValue: "",
  price: 0,
  stock: 0,
  status: "启用"
});

const rules: FormRules<typeof form> = {
  school: [{ required: true, message: "请输入高校", trigger: "blur" }],
  storeName: [{ required: true, message: "请输入店铺名称", trigger: "blur" }],
  productName: [{ required: true, message: "请输入商品名称", trigger: "blur" }],
  specGroup: [{ required: true, message: "请输入规格组", trigger: "blur" }],
  specValue: [{ required: true, message: "请输入规格值", trigger: "blur" }],
  price: [{ required: true, message: "请输入价格", trigger: "blur" }],
  stock: [{ required: true, message: "请输入库存", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

const selectedIds = computed(() => selectedRows.value.map((item) => item.id));
const enabledCount = computed(() => list.value.filter((item) => item.status === "启用").length);
const disabledCount = computed(() => list.value.filter((item) => item.status !== "启用").length);
const lowStockCount = computed(() => list.value.filter((item) => item.stock <= 20).length);

function showApiError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    ElMessage.error(error.traceId ? `${error.message}（追踪号: ${error.traceId}）` : error.message);
    return;
  }
  if (error instanceof Error) ElMessage.error(error.message);
  else ElMessage.error(fallback);
}

function handleSelectionChange(rows: ProductSpecItem[]) {
  selectedRows.value = rows;
}

function resetForm() {
  editingId.value = null;
  form.school = "";
  form.storeName = "";
  form.productName = "";
  form.specGroup = "";
  form.specValue = "";
  form.price = 0;
  form.stock = 0;
  form.status = "启用";
}

function resetQuery() {
  query.keyword = "";
  query.school = "";
  query.storeName = "";
  query.status = "";
  query.page = 1;
  loadData();
}

function search() {
  query.page = 1;
  loadData();
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: ProductSpecItem) {
  editingId.value = row.id;
  form.school = row.school;
  form.storeName = row.storeName;
  form.productName = row.productName;
  form.specGroup = row.specGroup;
  form.specValue = row.specValue;
  form.price = row.price;
  form.stock = row.stock;
  form.status = row.status;
  dialogVisible.value = true;
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getProductSpecsApi({ ...query });
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
      storeName: form.storeName.trim(),
      productName: form.productName.trim(),
      specGroup: form.specGroup.trim(),
      specValue: form.specValue.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      status: form.status
    };
    if (editingId.value) {
      await updateProductSpecApi(editingId.value, payload);
      ElMessage.success("商品规格已更新");
    } else {
      await createProductSpecApi(payload);
      ElMessage.success("商品规格已新增");
    }
    dialogVisible.value = false;
    loadData();
  } catch (error) {
    showApiError(error, "保存失败");
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: ProductSpecItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}该商品规格吗？`, "状态确认", { type: "warning" });
  try {
    await toggleProductSpecStatusApi(row.id);
    ElMessage.success(`已${action}`);
    loadData();
  } catch (error) {
    showApiError(error, "状态更新失败");
  }
}

async function removeRow(row: ProductSpecItem) {
  await ElMessageBox.confirm(`确认删除“${row.productName} - ${row.specValue}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteProductSpecApi(row.id);
    ElMessage.success("已删除");
    loadData();
  } catch (error) {
    showApiError(error, "删除失败");
  }
}

async function batchSetStatus(nextStatus: "启用" | "停用") {
  if (!selectedIds.value.length) return ElMessage.warning("请先选择数据");
  await ElMessageBox.confirm(`确认批量${nextStatus}已选规格吗？`, "批量操作确认", { type: "warning" });
  try {
    await batchSetProductSpecStatusApi({ ids: selectedIds.value, status: nextStatus });
    ElMessage.success(`已批量${nextStatus}`);
    loadData();
  } catch (error) {
    showApiError(error, "批量更新失败");
  }
}

async function batchRemove() {
  if (!selectedIds.value.length) return ElMessage.warning("请先选择数据");
  await ElMessageBox.confirm(`确认删除已选的 ${selectedIds.value.length} 条规格吗？`, "批量删除确认", { type: "warning" });
  try {
    await batchDeleteProductSpecApi({ ids: selectedIds.value });
    ElMessage.success("已批量删除");
    loadData();
  } catch (error) {
    showApiError(error, "批量删除失败");
  }
}

function exportData() {
  exportTableToCsv(
    "商品规格列表",
    ["高校", "店铺", "商品", "规格组", "规格值", "价格", "库存", "状态", "更新时间"],
    list.value.map((item) => [
      item.school,
      item.storeName,
      item.productName,
      item.specGroup,
      item.specValue,
      item.price,
      item.stock,
      item.status,
      item.updatedAt
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
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">当前页启用规格</div><div class="metric-value success">{{ enabledCount }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">当前页停用规格</div><div class="metric-value">{{ disabledCount }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">当前页低库存规格</div><div class="metric-value warning">{{ lowStockCount }}</div></el-card></el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索商品或规格值" clearable class="input" />
        <el-input v-model="query.school" placeholder="按高校精确筛选" clearable class="input" />
        <el-input v-model="query.storeName" placeholder="按店铺精确筛选" clearable class="input" />
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
      <template #header>商品规格列表</template>
      <el-table :data="list" stripe v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="48" />
        <el-table-column prop="school" label="高校" min-width="120" />
        <el-table-column prop="storeName" label="店铺" min-width="150" />
        <el-table-column prop="productName" label="商品" min-width="160" />
        <el-table-column prop="specGroup" label="规格组" width="90" />
        <el-table-column prop="specValue" label="规格值" width="90" />
        <el-table-column label="价格" width="100"><template #default="{ row }">¥{{ row.price.toFixed(2) }}</template></el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑商品规格' : '新增商品规格'" width="680px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="高校" prop="school"><el-input v-model="form.school" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="店铺" prop="storeName"><el-input v-model="form.storeName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="商品" prop="productName"><el-input v-model="form.productName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="规格组" prop="specGroup"><el-input v-model="form.specGroup" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="规格值" prop="specValue"><el-input v-model="form.specValue" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="价格" prop="price"><el-input-number v-model="form.price" :min="0" :precision="2" class="full-width" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="库存" prop="stock"><el-input-number v-model="form.stock" :min="0" class="full-width" /></el-form-item></el-col>
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
.metric-value.success { color: #16a34a; }
.metric-value.warning { color: #d97706; }
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.batch-bar { margin-top: 12px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.input { width: 200px; }
.select { width: 150px; }
.full-width { width: 100%; }
.pager-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
