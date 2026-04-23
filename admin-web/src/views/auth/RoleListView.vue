<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { AdminRoleItem, AdminRolePayload, AdminRoleSummary, AuthManageMeta, RoleTemplateItem } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import {
  createAdminRoleApi,
  createAdminRoleFromTemplateApi,
  deleteAdminRoleApi,
  getAdminRoleListApi,
  getAuthManageMetaApi,
  toggleAdminRoleStatusApi,
  updateAdminRoleApi
} from "../../api/modules/auth-manage";
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const list = ref<AdminRoleItem[]>([]);
const total = ref(0);
const summary = ref<AdminRoleSummary>({
  total: 0,
  enabledCount: 0,
  userCount: 0
});
const meta = ref<AuthManageMeta>({
  currentRoleId: 0,
  currentRoleCode: "",
  currentRoleName: "",
  schoolOptions: [],
  roleOptions: [],
  roleTemplates: [],
  menuTree: [],
  permissionGroups: []
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  status: ""
});

const form = reactive<AdminRolePayload>({
  code: "",
  name: "",
  scopeType: "assigned",
  status: "启用"
});

const rules: FormRules<typeof form> = {
  code: [{ required: true, message: "请输入角色编码", trigger: "blur" }],
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  scopeType: [{ required: true, message: "请选择数据范围", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

const templateMap = computed(() =>
  meta.value.roleTemplates.reduce<Record<string, RoleTemplateItem>>((result, item) => {
    result[item.code] = item;
    return result;
  }, {})
);

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
  form.code = "";
  form.name = "";
  form.scopeType = "assigned";
  form.status = "启用";
}

async function loadMeta() {
  meta.value = await getAuthManageMetaApi();
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getAdminRoleListApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } catch (error) {
    showApiError(error, "角色列表加载失败");
  } finally {
    loading.value = false;
  }
}

async function loadPage() {
  try {
    await loadMeta();
  } catch (error) {
    showApiError(error, "角色元数据加载失败");
  }
  await loadData();
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: AdminRoleItem) {
  editingId.value = row.id;
  form.code = row.code;
  form.name = row.name;
  form.scopeType = row.scopeTypeValue;
  form.status = row.status as "启用" | "停用";
  dialogVisible.value = true;
}

async function refreshCurrentSessionIfNeeded(targetRoleId: number) {
  if (targetRoleId !== authStore.profile?.roleId) return false;
  await authStore.refreshSession();
  const menuPath = String(route.meta.menuPath || route.path);
  if (!authStore.hasMenuAccess(menuPath)) {
    ElMessage.warning("当前账号权限已更新，已返回可访问页面");
    await router.replace("/dashboard/overview");
    return true;
  }
  return false;
}

async function createFromTemplate(template: RoleTemplateItem) {
  try {
    await ElMessageBox.confirm(
      `确认按模板创建角色“${template.name}”吗？系统会自动写入菜单和按钮权限。`,
      "创建角色模板",
      { type: "warning" }
    );
    await createAdminRoleFromTemplateApi(template.code);
    ElMessage.success("角色模板已创建");
    await loadPage();
  } catch (error) {
    if (error === "cancel") return;
    showApiError(error, "角色模板创建失败");
  }
}

function applyTemplateToForm(template: RoleTemplateItem) {
  editingId.value = null;
  form.code = template.code;
  form.name = template.name;
  form.scopeType = template.scopeType;
  form.status = "启用";
  dialogVisible.value = true;
}

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload: AdminRolePayload = {
      code: form.code.trim(),
      name: form.name.trim(),
      scopeType: form.scopeType,
      status: form.status
    };

    if (editingId.value) {
      const targetRoleId = editingId.value;
      await updateAdminRoleApi(targetRoleId, payload);
      ElMessage.success("角色已更新");
      dialogVisible.value = false;
      const redirected = await refreshCurrentSessionIfNeeded(targetRoleId);
      if (!redirected) {
        await loadData();
      }
    } else {
      await createAdminRoleApi(payload);
      ElMessage.success("角色已创建");
      dialogVisible.value = false;
      await loadPage();
    }
  } catch (error) {
    showApiError(error, "角色保存失败");
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: AdminRoleItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}角色“${row.name}”吗？`, "状态确认", { type: "warning" });
  try {
    await toggleAdminRoleStatusApi(row.id);
    ElMessage.success(`已${action}`);
    await loadData();
  } catch (error) {
    showApiError(error, "角色状态更新失败");
  }
}

async function removeRow(row: AdminRoleItem) {
  await ElMessageBox.confirm(`确认删除角色“${row.name}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteAdminRoleApi(row.id);
    ElMessage.success("角色已删除");
    await loadPage();
  } catch (error) {
    showApiError(error, "角色删除失败");
  }
}

function handleSearch() {
  query.page = 1;
  loadData();
}

function handleReset() {
  query.page = 1;
  query.keyword = "";
  query.status = "";
  loadData();
}

function handlePageChange(page: number) {
  query.page = page;
  loadData();
}

onMounted(loadPage);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">角色数量</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">启用角色</div><div class="metric-value success">{{ summary.enabledCount }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">关联管理员</div><div class="metric-value warning">{{ summary.userCount }}</div></el-card>
      </el-col>
    </el-row>

    <el-card v-if="meta.roleTemplates.length" shadow="never">
      <template #header>角色模板</template>
      <div class="template-grid">
        <div v-for="item in meta.roleTemplates" :key="item.code" class="template-card">
          <div class="template-title">{{ item.name }}</div>
          <div class="template-desc">{{ item.description }}</div>
          <div class="template-tags">
            <el-tag size="small">{{ item.scopeType === "assigned" ? "指定高校" : "全部高校" }}</el-tag>
            <el-tag size="small" type="info">菜单 {{ item.menuPaths.length }}</el-tag>
            <el-tag size="small" type="warning">权限 {{ item.permissionsList.length }}</el-tag>
          </div>
          <div class="template-actions">
            <el-button v-permission="'auth:role:add'" type="primary" plain @click="createFromTemplate(item)">一键创建</el-button>
            <el-button v-permission="'auth:role:add'" @click="applyTemplateToForm(item)">仅填入表单</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>角色筛选</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索角色名称或编码" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="启用" value="启用" />
          <el-option label="停用" value="停用" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-permission="'auth:role:add'" type="primary" plain @click="openCreateDialog">新增角色</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>角色列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="name" label="角色名称" min-width="160" />
        <el-table-column prop="code" label="角色编码" min-width="180" />
        <el-table-column prop="scopeType" label="数据范围" width="120" />
        <el-table-column prop="permissions" label="按钮权限" min-width="320" show-overflow-tooltip />
        <el-table-column prop="menuCount" label="菜单数" width="100" />
        <el-table-column prop="userCount" label="管理员数" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'auth:role:edit'" link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-permission="'auth:role:edit'" link :type="row.status === '启用' ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === "启用" ? "停用" : "启用" }}
            </el-button>
            <el-button v-permission="'auth:role:edit'" link type="danger" @click="removeRow(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑角色' : '新增角色'" width="620px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="角色名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code">
            <template v-if="!editingId && templateMap[form.code]" #append>模板</template>
          </el-input>
        </el-form-item>
        <el-form-item label="数据范围" prop="scopeType">
          <el-radio-group v-model="form.scopeType">
            <el-radio label="assigned">指定高校</el-radio>
            <el-radio label="all">全部高校</el-radio>
          </el-radio-group>
        </el-form-item>
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
  font-size: 30px;
  font-weight: 700;
}
.metric-value.success {
  color: #16a34a;
}
.metric-value.warning {
  color: #d97706;
}
.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.input {
  width: 320px;
}
.select,
.full-width {
  width: 180px;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.template-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
.template-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 12px;
}
.template-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}
.template-desc {
  color: #667085;
  line-height: 1.7;
}
.template-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.template-actions {
  display: flex;
  gap: 10px;
}
</style>
