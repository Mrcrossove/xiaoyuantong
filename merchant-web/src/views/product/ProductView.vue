<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  batchDeleteProductsApi,
  batchDownProductsApi,
  createProductApi,
  deleteProductApi,
  getProductListApi,
  moveProductApi,
  toggleProductStatusApi,
  updateProductApi,
  uploadMerchantImageApi
} from "../../api/modules/merchant";
import { useMerchantAuthStore } from "../../stores/auth";
import { readFileAsDataUrl } from "../../utils/file";

type ProductStatus = "已上架" | "已下架";

type ProductSku = {
  id?: string;
  name: string;
  price: string;
  stock: number;
  dailyLimit: number;
  status: ProductStatus;
  isDefault: boolean;
};

const authStore = useMerchantAuthStore();

const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const coverUploading = ref(false);
const coverInputRef = ref<HTMLInputElement | null>(null);
const editingId = ref("");
const selectionIds = ref<string[]>([]);
const list = ref<any[]>([]);
const summary = ref<any>({});

function createSku(name = "默认规格"): ProductSku {
  return {
    name,
    price: "",
    stock: 0,
    dailyLimit: 0,
    status: "已上架",
    isDefault: true
  };
}

const form = reactive({
  name: "",
  desc: "",
  detailTitle: "",
  detailText: "",
  detailItems: [] as Array<{ label: string; value: string }>,
  specMode: "single" as "single" | "multi",
  price: "",
  cover: "",
  stock: 0,
  dailyLimit: 0,
  recommended: false,
  status: "已上架" as ProductStatus,
  skus: [createSku()]
});

const canCreate = computed(() => authStore.hasPermission("product:create"));
const canEdit = computed(() => authStore.hasPermission("product:edit"));
const canDelete = computed(() => authStore.hasPermission("product:delete"));
const canStatus = computed(() => authStore.hasPermission("product:status"));
const canSort = computed(() => authStore.hasPermission("product:sort"));

const dialogTitle = computed(() => (editingId.value ? "编辑商品" : "新增商品"));

function ensureSingleSku() {
  const current = form.skus[0] || createSku();
  form.skus = [
    {
      ...current,
      name: "默认规格",
      isDefault: true
    }
  ];
}

function syncSingleSkuFromBase() {
  ensureSingleSku();
  form.skus[0].price = form.price;
  form.skus[0].stock = Number(form.stock || 0);
  form.skus[0].dailyLimit = Number(form.dailyLimit || 0);
  form.skus[0].status = form.status;
}

function syncBaseFromSingleSku() {
  ensureSingleSku();
  form.price = form.skus[0].price;
  form.stock = Number(form.skus[0].stock || 0);
  form.dailyLimit = Number(form.skus[0].dailyLimit || 0);
  form.status = form.skus[0].status;
}

function resetForm() {
  editingId.value = "";
  form.name = "";
  form.desc = "";
  form.detailTitle = "";
  form.detailText = "";
  form.detailItems = [];
  form.specMode = "single";
  form.price = "";
  form.cover = "";
  form.stock = 0;
  form.dailyLimit = 0;
  form.recommended = false;
  form.status = "已上架";
  form.skus = [createSku()];
}

function handleSpecModeChange(value: "single" | "multi") {
  form.specMode = "single";
  syncSingleSkuFromBase();
}

function fillForm(row: any) {
  editingId.value = row.id;
  form.name = row.name;
  form.desc = row.desc;
  form.detailTitle = row.detailTitle || "";
  form.detailText = row.detailText || "";
  form.detailItems = Array.isArray(row.detailItems)
    ? row.detailItems.map((item: any) => ({
        label: String(item.label || ""),
        value: String(item.value || "")
      }))
    : [];
  form.specMode = "single";
  form.cover = row.cover || "";
  form.recommended = Boolean(row.recommended);
  form.status = row.status || "已上架";
  form.skus =
    (row.skus || []).map((sku: any) => ({
      id: sku.id,
      name: sku.name,
      price: String(sku.price || "").replace(/[^\d.]/g, ""),
      stock: Number(sku.stock || 0),
      dailyLimit: Number(sku.dailyLimit || 0),
      status: sku.status || "已上架",
      isDefault: Boolean(sku.isDefault)
    })) || [];

  if (!form.skus.length) {
    form.skus = [createSku()];
  }

  const defaultSku = form.skus.find((sku) => sku.isDefault) || form.skus[0];
  form.price = String(defaultSku?.price || "");
  form.stock = Number(defaultSku?.stock || 0);
  form.dailyLimit = Number(defaultSku?.dailyLimit || 0);

  syncBaseFromSingleSku();
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getProductListApi();
    list.value = result.list || [];
    summary.value = result.summary || {};
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "商品列表加载失败");
  } finally {
    loading.value = false;
  }
}

function triggerCoverUpload() {
  coverInputRef.value?.click();
}

async function handleCoverChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  coverUploading.value = true;
  try {
    const base64 = await readFileAsDataUrl(file);
    const result = await uploadMerchantImageApi({
      fileName: file.name,
      base64,
      scene: "merchant"
    });
    form.cover = result.url;
    ElMessage.success("商品封面上传成功");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "商品封面上传失败");
  } finally {
    coverUploading.value = false;
  }
}

function validateForm() {
  if (!form.name.trim()) {
    throw new Error("请输入商品名称");
  }
  if (!form.desc.trim()) {
    throw new Error("请输入商品描述");
  }

  if (!String(form.price || "").trim()) {
    throw new Error("请输入商品价格");
  }
  form.specMode = "single";
  syncSingleSkuFromBase();
}

function addDetailItem() {
  form.detailItems.push({ label: "", value: "" });
}

function removeDetailItem(index: number) {
  form.detailItems.splice(index, 1);
}

function buildPayload() {
  validateForm();

  form.specMode = "single";
  syncSingleSkuFromBase();

  return {
    name: form.name,
    desc: form.desc,
    detailTitle: form.detailTitle,
    detailText: form.detailText,
    detailItems: form.detailItems
      .map((item) => ({
        label: item.label.trim(),
        value: item.value.trim()
      }))
      .filter((item) => item.label && item.value),
    specMode: "single",
    price: form.price,
    cover: form.cover,
    stock: Number(form.stock || 0),
    dailyLimit: Number(form.dailyLimit || 0),
    recommended: form.recommended,
    status: form.status,
    skus: form.skus.map((sku) => ({
      id: sku.id,
      name: "默认规格",
      price: sku.price,
      stock: Number(sku.stock || 0),
      dailyLimit: Number(sku.dailyLimit || 0),
      status: sku.status,
      isDefault: Boolean(sku.isDefault)
    }))
  };
}

async function handleSave() {
  saving.value = true;
  try {
    const payload = buildPayload();
    if (editingId.value) {
      await updateProductApi(editingId.value, payload);
      ElMessage.success("商品已更新");
    } else {
      await createProductApi(payload);
      ElMessage.success("商品已创建");
    }
    dialogVisible.value = false;
    resetForm();
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "商品保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  await ElMessageBox.confirm("删除后不可恢复，确认继续吗？", "删除商品", { type: "warning" });
  await deleteProductApi(id);
  ElMessage.success("商品已删除");
  await loadData();
}

async function handleToggleStatus(id: string) {
  await toggleProductStatusApi(id);
  ElMessage.success("商品状态已更新");
  await loadData();
}

async function handleMove(id: string, direction: "up" | "down") {
  await moveProductApi(id, direction);
  await loadData();
}

async function handleBatchDown() {
  if (!selectionIds.value.length) {
    ElMessage.warning("请先选择商品");
    return;
  }
  await batchDownProductsApi(selectionIds.value);
  ElMessage.success("已批量下架");
  await loadData();
}

async function handleBatchDelete() {
  if (!selectionIds.value.length) {
    ElMessage.warning("请先选择商品");
    return;
  }
  await ElMessageBox.confirm("确认批量删除选中商品吗？", "批量删除", { type: "warning" });
  await batchDeleteProductsApi(selectionIds.value);
  ElMessage.success("已批量删除");
  await loadData();
}

function handleSelectionChange(rows: any[]) {
  selectionIds.value = rows.map((item) => item.id);
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="16">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="metric-label">商品总数</div>
          <div class="metric-value">{{ summary.total || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="metric-label">上架商品</div>
          <div class="metric-value">{{ summary.onSaleCount || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="metric-label">推荐商品</div>
          <div class="metric-value">{{ summary.recommendedCount || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品列表</span>
          <div class="header-actions">
            <el-button v-if="canStatus" @click="handleBatchDown">批量下架</el-button>
            <el-button v-if="canDelete" type="danger" plain @click="handleBatchDelete">批量删除</el-button>
            <el-button v-if="canCreate" type="primary" @click="resetForm(); dialogVisible = true">新增商品</el-button>
          </div>
        </div>
      </template>

      <el-table :data="list" empty-text="暂无商品" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="48" />
        <el-table-column prop="name" label="商品名称" min-width="160" />
        <el-table-column prop="desc" label="商品描述" min-width="180" />
        <el-table-column prop="price" label="售价" width="120" />
        <el-table-column label="规格" width="120">
          <template #default="{ row }">
            单规格
          </template>
        </el-table-column>
        <el-table-column label="封面" width="92">
          <template #default="{ row }">
            <img v-if="row.cover" :src="row.cover" class="table-cover" alt="商品封面" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="总库存" width="90" />
        <el-table-column prop="dailyLimit" label="限购" width="90" />
        <el-table-column label="推荐" width="90">
          <template #default="{ row }">
            <el-tag :type="row.recommended ? 'success' : 'info'">{{ row.recommended ? "是" : "否" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column label="操作" min-width="320" fixed="right">
          <template #default="{ row }">
            <el-button v-if="canEdit" link type="primary" @click="fillForm(row); dialogVisible = true">编辑</el-button>
            <el-button v-if="canSort" link @click="handleMove(row.id, 'up')">上移</el-button>
            <el-button v-if="canSort" link @click="handleMove(row.id, 'down')">下移</el-button>
            <el-button v-if="canStatus" link type="warning" @click="handleToggleStatus(row.id)">
              {{ row.status === "已上架" ? "下架" : "上架" }}
            </el-button>
            <el-button v-if="canDelete" link type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="840px" @closed="resetForm">
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="商品名称">
              <el-input v-model.trim="form.name" maxlength="30" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="商品描述">
          <el-input v-model.trim="form.desc" maxlength="60" />
        </el-form-item>

        <el-form-item label="商品详情标题">
          <el-input v-model.trim="form.detailTitle" maxlength="30" placeholder="例如 商品详情、购买须知、商品说明" />
        </el-form-item>

        <el-form-item label="商品详情内容">
          <el-input
            v-model="form.detailText"
            type="textarea"
            :rows="6"
            maxlength="1200"
            show-word-limit
            placeholder="可填写商品说明、使用方式、配送范围、过敏源、售后规则等，换行会在小程序详情页保留"
          />
        </el-form-item>

        <el-form-item label="详情参数">
          <div class="detail-items">
            <div v-for="(item, index) in form.detailItems" :key="index" class="detail-item-row">
              <el-input v-model.trim="item.label" maxlength="20" placeholder="名称，如 过敏源" />
              <el-input v-model.trim="item.value" maxlength="120" placeholder="内容，如 含乳制品、含蛋类" />
              <el-button type="danger" plain @click="removeDetailItem(index)">删除</el-button>
            </div>
            <el-button :disabled="form.detailItems.length >= 20" @click="addDetailItem">添加参数</el-button>
          </div>
        </el-form-item>

        <el-form-item label="商品封面">
          <div class="cover-panel">
            <div v-if="form.cover" class="cover-preview">
              <img :src="form.cover" alt="商品封面" />
            </div>
            <div v-else class="cover-placeholder">暂无封面</div>
            <div class="cover-actions">
              <el-button :loading="coverUploading" @click="triggerCoverUpload">上传封面图</el-button>
              <el-input v-model.trim="form.cover" placeholder="也可直接粘贴图片地址" />
            </div>
          </div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="8">
            <el-form-item label="售价">
              <el-input v-model.trim="form.price" placeholder="例如 12.80" @blur="syncSingleSkuFromBase" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="库存">
              <el-input-number v-model="form.stock" :min="0" :max="99999" @change="syncSingleSkuFromBase" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="每日限购">
              <el-input-number v-model="form.dailyLimit" :min="0" :max="9999" @change="syncSingleSkuFromBase" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :xs="24" :sm="8">
            <el-form-item label="商品状态">
              <el-select v-model="form.status" @change="syncSingleSkuFromBase">
                <el-option label="已上架" value="已上架" />
                <el-option label="已下架" value="已下架" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-checkbox v-model="form.recommended">设为推荐商品</el-checkbox>
        </el-form-item>
      </el-form>

      <input ref="coverInputRef" class="hidden-input" type="file" accept="image/*" @change="handleCoverChange" />

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.table-cover {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.cover-panel {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 16px;
  align-items: start;
}

.cover-preview,
.cover-placeholder {
  width: 160px;
  height: 120px;
  border-radius: 12px;
  border: 1px solid #dbe4f0;
  overflow: hidden;
  background: #f8fafc;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  display: grid;
  place-items: center;
  color: #98a2b3;
}

.cover-actions {
  display: grid;
  gap: 12px;
}

.detail-items {
  display: grid;
  gap: 10px;
  width: 100%;
}

.detail-item-row {
  display: grid;
  grid-template-columns: 180px 1fr auto;
  gap: 10px;
  align-items: center;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.hidden-input {
  display: none;
}

@media (max-width: 768px) {
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .cover-panel {
    grid-template-columns: 1fr;
  }

  .detail-item-row {
    grid-template-columns: 1fr;
  }

}
</style>
