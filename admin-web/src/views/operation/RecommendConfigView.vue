<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { RecommendConfigItem, RecommendConfigPayload } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import {
  createRecommendConfigApi,
  deleteRecommendConfigApi,
  getRecommendConfigListApi,
  toggleRecommendConfigStatusApi,
  updateRecommendConfigApi
} from "../../api/modules/operation";
import { getAdminStoreListApi } from "../../api/modules/store";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const list = ref<RecommendConfigItem[]>([]);
const storeOptions = ref<{ label: string; value: string; school: string }[]>([]);
const total = ref(0);
const enabledCount = ref(0);
const typeOptions = ref<string[]>([]);
const schoolOptions = ref<string[]>([]);

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  type: "",
  status: ""
});

const form = reactive<RecommendConfigPayload>({
  title: "",
  type: "",
  school: "",
  targetName: "",
  targetId: "",
  sort: 1,
  status: "启用",
  remark: ""
});

const rules: FormRules<typeof form> = {
  title: [{ required: true, message: "请输入推荐标题", trigger: "blur" }],
  type: [{ required: true, message: "请输入推荐类型", trigger: "blur" }],
  school: [{ required: true, message: "请选择所属高校", trigger: "change" }],
  sort: [{ required: true, message: "请输入显示排序", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

const isStoreRecommend = computed(() => form.type.trim() === "store");

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
  form.title = "";
  form.type = "";
  form.school = schoolOptions.value[0] || "";
  form.targetName = "";
  form.targetId = "";
  form.sort = 1;
  form.status = "启用";
  form.remark = "";
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
  loadStoreOptions();
}

function openEditDialog(row: RecommendConfigItem) {
  editingId.value = row.id;
  form.title = row.title;
  form.type = row.type;
  form.school = row.school;
  form.targetName = row.targetName;
  form.targetId = row.targetId;
  form.sort = row.sort;
  form.status = row.status;
  form.remark = row.remark;
  dialogVisible.value = true;
  loadStoreOptions();
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getRecommendConfigListApi(query);
    list.value = result.list;
    total.value = result.total;
    enabledCount.value = result.summary.enabledCount;
    typeOptions.value = result.summary.typeOptions;
    schoolOptions.value = result.summary.schoolOptions;
  } catch (error) {
    showApiError(error, "推荐位加载失败");
  } finally {
    loading.value = false;
  }
}

async function loadStoreOptions() {
  try {
    const result = await getAdminStoreListApi({
      page: 1,
      pageSize: 200,
      category: ""
    });
    storeOptions.value = result.list.map((item) => ({
      label: `${item.storeName} / ${item.school} / ${item.detailId}`,
      value: item.detailId,
      school: item.school
    }));
  } catch (error) {
    showApiError(error, "店铺列表加载失败");
  }
}

function handleStoreTargetChange(detailId: string) {
  const selected = storeOptions.value.find((item) => item.value === detailId);
  if (!selected) return;
  form.targetId = selected.value;
  form.targetName = selected.label.split(" / ")[0] || "";
  form.school = selected.school || form.school;
}

function handleSearch() {
  query.page = 1;
  loadData();
}

function handleReset() {
  query.page = 1;
  query.keyword = "";
  query.school = "";
  query.type = "";
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
    const payload: RecommendConfigPayload = {
      title: form.title.trim(),
      type: form.type.trim(),
      school: form.school,
      targetName: form.targetName?.trim() || "",
      targetId: form.targetId?.trim() || "",
      sort: Number(form.sort),
      status: form.status,
      remark: form.remark?.trim() || ""
    };
    if (editingId.value) {
      await updateRecommendConfigApi(editingId.value, payload);
      ElMessage.success("推荐位已更新");
    } else {
      await createRecommendConfigApi(payload);
      ElMessage.success("推荐位已创建");
    }
    dialogVisible.value = false;
    loadData();
  } catch (error) {
    showApiError(error, "推荐位保存失败");
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: RecommendConfigItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}推荐位“${row.title}”吗？`, "状态确认", { type: "warning" });
  try {
    await toggleRecommendConfigStatusApi(row.id);
    ElMessage.success(`已${action}`);
    loadData();
  } catch (error) {
    showApiError(error, "推荐位状态更新失败");
  }
}

async function removeRow(row: RecommendConfigItem) {
  await ElMessageBox.confirm(`确认删除推荐位“${row.title}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteRecommendConfigApi(row.id);
    ElMessage.success("推荐位已删除");
    loadData();
  } catch (error) {
    showApiError(error, "推荐位删除失败");
  }
}

onMounted(loadData);

watch(
  () => form.type,
  (value) => {
    if (String(value || "").trim() === "store" && !storeOptions.value.length) {
      loadStoreOptions();
    }
  }
);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">推荐位总数</div><div class="metric-value">{{ total }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">启用中</div><div class="metric-value success">{{ enabledCount }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">推荐类型数</div><div class="metric-value">{{ typeOptions.length }}</div></el-card></el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索推荐标题或关联内容" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.type" placeholder="全部类型" clearable class="select">
          <el-option v-for="item in typeOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="启用" value="启用" />
          <el-option label="停用" value="停用" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-permission="'operation:recommend:add'" type="primary" plain @click="openCreateDialog">新增推荐位</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>推荐位配置</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="title" label="推荐标题" min-width="220" />
        <el-table-column prop="type" label="推荐类型" width="120" />
        <el-table-column prop="targetName" label="关联内容" min-width="180" />
        <el-table-column prop="school" label="所属高校" min-width="160" />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'operation:recommend:edit'" link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-permission="'operation:recommend:edit'" link :type="row.status === '启用' ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === "启用" ? "停用" : "启用" }}
            </el-button>
            <el-button v-permission="'operation:recommend:edit'" link type="danger" @click="removeRow(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑推荐位' : '新增推荐位'" width="720px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="推荐标题" prop="title">
              <el-input v-model="form.title" placeholder="例如：校园优选店铺、热门打印店" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="推荐类型" prop="type">
              <el-input v-model="form.type" placeholder="店铺推荐请填写 store" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属高校" prop="school">
              <el-select v-model="form.school" class="full-width" filterable allow-create default-first-option>
                <el-option v-for="item in schoolOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联内容">
              <el-select
                v-if="isStoreRecommend"
                v-model="form.targetId"
                class="full-width"
                filterable
                placeholder="选择要推荐的店铺"
                @change="handleStoreTargetChange"
              >
                <el-option v-for="item in storeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <el-input v-else v-model="form.targetName" placeholder="填写要关联的对象名称，例如店铺名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联编号">
              <el-input
                v-model="form.targetId"
                :disabled="isStoreRecommend"
                :placeholder="isStoreRecommend ? '选择店铺后自动生成' : '填写关联对象的唯一编号'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" class="full-width">
                <el-option label="启用" value="启用" />
                <el-option label="停用" value="停用" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="填写说明">
              <el-alert
                title="如果推荐店铺：推荐类型填 store，然后直接选择店铺，系统会自动带出关联编号。"
                type="info"
                :closable="false"
                show-icon
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="可填写推荐原因、投放说明等" />
            </el-form-item>
          </el-col>
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
