<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { BannerConfigItem, BannerConfigPayload } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import { createBannerConfigApi, deleteBannerConfigApi, getBannerConfigListApi, toggleBannerConfigStatusApi, updateBannerConfigApi } from "../../api/modules/operation";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const list = ref<BannerConfigItem[]>([]);
const total = ref(0);
const enabledCount = ref(0);
const positionOptions = ref<string[]>([]);
const schoolOptions = ref<string[]>([]);

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  position: "",
  status: ""
});

const form = reactive<BannerConfigPayload>({
  title: "",
  position: "",
  school: "",
  imageUrl: "",
  linkUrl: "",
  sort: 1,
  status: "启用",
  remark: ""
});

const rules: FormRules<typeof form> = {
  title: [{ required: true, message: "请输入标题", trigger: "blur" }],
  position: [{ required: true, message: "请输入投放位置", trigger: "blur" }],
  school: [{ required: true, message: "请选择所属高校", trigger: "change" }],
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
  form.title = "";
  form.position = "";
  form.school = schoolOptions.value[0] || "";
  form.imageUrl = "";
  form.linkUrl = "";
  form.sort = 1;
  form.status = "启用";
  form.remark = "";
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: BannerConfigItem) {
  editingId.value = row.id;
  form.title = row.title;
  form.position = row.position;
  form.school = row.school;
  form.imageUrl = row.imageUrl;
  form.linkUrl = row.linkUrl;
  form.sort = row.sort;
  form.status = row.status;
  form.remark = row.remark;
  dialogVisible.value = true;
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getBannerConfigListApi(query);
    list.value = result.list;
    total.value = result.total;
    enabledCount.value = result.summary.enabledCount;
    positionOptions.value = result.summary.positionOptions;
    schoolOptions.value = result.summary.schoolOptions;
  } catch (error) {
    showApiError(error, "轮播图配置加载失败");
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
  query.position = "";
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
    const payload: BannerConfigPayload = {
      title: form.title.trim(),
      position: form.position.trim(),
      school: form.school,
      imageUrl: form.imageUrl?.trim() || "",
      linkUrl: form.linkUrl?.trim() || "",
      sort: Number(form.sort),
      status: form.status,
      remark: form.remark?.trim() || ""
    };
    if (editingId.value) {
      await updateBannerConfigApi(editingId.value, payload);
      ElMessage.success("轮播图已更新");
    } else {
      await createBannerConfigApi(payload);
      ElMessage.success("轮播图已创建");
    }
    dialogVisible.value = false;
    loadData();
  } catch (error) {
    showApiError(error, "轮播图保存失败");
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: BannerConfigItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}轮播图“${row.title}”吗？`, "状态确认", { type: "warning" });
  try {
    await toggleBannerConfigStatusApi(row.id);
    ElMessage.success(`已${action}`);
    loadData();
  } catch (error) {
    showApiError(error, "轮播图状态更新失败");
  }
}

async function removeRow(row: BannerConfigItem) {
  await ElMessageBox.confirm(`确认删除轮播图“${row.title}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteBannerConfigApi(row.id);
    ElMessage.success("轮播图已删除");
    loadData();
  } catch (error) {
    showApiError(error, "轮播图删除失败");
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">轮播图数量</div><div class="metric-value">{{ total }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">启用中</div><div class="metric-value success">{{ enabledCount }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">投放位置</div><div class="metric-value">{{ positionOptions.length }}</div></el-card></el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索标题或备注" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.position" placeholder="全部位置" clearable class="select">
          <el-option v-for="item in positionOptions" :key="item" :label="item" :value="item" />
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
        <el-button v-permission="'operation:banner:add'" type="primary" plain @click="openCreateDialog">新增轮播图</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>轮播图配置</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="title" label="标题" min-width="220" />
        <el-table-column prop="position" label="投放位置" width="140" />
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
            <el-button v-permission="'operation:banner:edit'" link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-permission="'operation:banner:edit'" link :type="row.status === '启用' ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === "启用" ? "停用" : "启用" }}
            </el-button>
            <el-button v-permission="'operation:banner:edit'" link type="danger" @click="removeRow(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑轮播图' : '新增轮播图'" width="720px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="投放位置" prop="position"><el-input v-model="form.position" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="所属高校" prop="school">
              <el-select v-model="form.school" class="full-width" filterable allow-create default-first-option>
                <el-option v-for="item in schoolOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="排序" prop="sort"><el-input-number v-model="form.sort" :min="0" class="full-width" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="图片地址"><el-input v-model="form.imageUrl" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="跳转地址"><el-input v-model="form.linkUrl" /></el-form-item></el-col>
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
.input { width: 320px; }
.select { width: 180px; }
.full-width { width: 100%; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
