<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type {
  AdminManagerCreatePayload,
  AdminManagerItem,
  AdminManagerSummary,
  AdminManagerTransferPayload,
  AdminManagerTransferResult,
  AdminManagerUpdatePayload,
  AuthManageMeta,
  RoleOptionItem
} from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import {
  createAdminManagerApi,
  deleteAdminManagerApi,
  getAdminManagerListApi,
  getAuthManageMetaApi,
  toggleAdminManagerStatusApi,
  transferSchoolAdminAccountApi,
  updateAdminManagerApi
} from "../../api/modules/auth-manage";
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const transferSubmitting = ref(false);
const transferDialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const transferFormRef = ref<FormInstance>();
const transferTarget = ref<AdminManagerItem | null>(null);
const list = ref<AdminManagerItem[]>([]);
const total = ref(0);
const summary = ref<AdminManagerSummary>({
  total: 0,
  enabledCount: 0,
  roleCount: 0,
  roleOptions: []
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
  role: "",
  status: ""
});

const form = reactive({
  account: "",
  password: "",
  name: "",
  roleId: 0,
  schools: [] as string[],
  status: "启用" as "启用" | "停用"
});

const transferForm = reactive<AdminManagerTransferPayload>({
  mode: "revoke",
  school: "",
  note: "",
  replacement: {
    account: "",
    name: ""
  }
});

const currentRole = computed<RoleOptionItem | undefined>(() => meta.value.roleOptions.find((item) => item.id === form.roleId));
const schoolDisabled = computed(() => currentRole.value?.scopeType === "all");

const rules: FormRules<typeof form> = {
  account: [{ required: true, message: "请输入管理员账号", trigger: "blur" }],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (!editingId.value && !String(value || "").trim()) {
          callback(new Error("请输入登录密码"));
          return;
        }
        if (value && String(value).trim().length < 6) {
          callback(new Error("密码至少 6 位"));
          return;
        }
        callback();
      },
      trigger: "blur"
    }
  ],
  name: [{ required: true, message: "请输入管理员姓名", trigger: "blur" }],
  roleId: [{ required: true, message: "请选择角色", trigger: "change" }],
  schools: [
    {
      validator: (_rule, value, callback) => {
        if (schoolDisabled.value) {
          callback();
          return;
        }
        if (!Array.isArray(value) || value.length === 0) {
          callback(new Error("请至少选择一个负责高校"));
          return;
        }
        callback();
      },
      trigger: "change"
    }
  ]
};

const transferRules: FormRules<typeof transferForm> = {
  school: [{ required: true, message: "请选择需要回收的学校", trigger: "change" }],
  replacement: [
    {
      validator: (_rule, value, callback) => {
        if (transferForm.mode !== "transfer") {
          callback();
          return;
        }
        if (!value?.account?.trim()) {
          callback(new Error("请输入新管理员账号"));
          return;
        }
        if (!value?.name?.trim()) {
          callback(new Error("请输入新管理员姓名"));
          return;
        }
        callback();
      },
      trigger: "blur"
    }
  ]
};

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
  form.account = "";
  form.password = "";
  form.name = "";
  form.roleId = meta.value.roleOptions[0]?.id || 0;
  form.schools = [];
  form.status = "启用";
}

function syncSchoolsByRole() {
  if (schoolDisabled.value) {
    form.schools = [];
  }
}

function openCreateDialog() {
  resetForm();
  syncSchoolsByRole();
  dialogVisible.value = true;
}

function openEditDialog(row: AdminManagerItem) {
  editingId.value = row.id;
  form.account = row.account;
  form.password = "";
  form.name = row.name;
  form.roleId = row.roleId;
  form.schools = [...row.schools];
  form.status = row.status as "启用" | "停用";
  syncSchoolsByRole();
  dialogVisible.value = true;
}

function openTransferDialog(row: AdminManagerItem) {
  transferTarget.value = row;
  transferForm.mode = "revoke";
  transferForm.school = row.schools[0] || "";
  transferForm.note = "";
  transferForm.replacement = {
    account: "",
    name: ""
  };
  transferDialogVisible.value = true;
}

async function loadMeta() {
  meta.value = await getAuthManageMetaApi();
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getAdminManagerListApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } catch (error) {
    showApiError(error, "管理员列表加载失败");
  } finally {
    loading.value = false;
  }
}

async function loadPage() {
  try {
    await loadMeta();
  } catch (error) {
    showApiError(error, "权限元数据加载失败");
  }
  await loadData();
}

async function refreshCurrentSessionIfNeeded(targetAdminId: number) {
  if (targetAdminId !== authStore.profile?.id) return false;
  await authStore.refreshSession();
  const menuPath = String(route.meta.menuPath || route.path);
  if (!authStore.hasMenuAccess(menuPath)) {
    ElMessage.warning("当前账号权限已更新，已返回可访问页面");
    await router.replace("/dashboard/overview");
    return true;
  }
  return false;
}

function handleSearch() {
  query.page = 1;
  loadData();
}

function handleReset() {
  query.page = 1;
  query.keyword = "";
  query.role = "";
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
    if (editingId.value) {
      const targetAdminId = editingId.value;
      const payload: AdminManagerUpdatePayload = {
        account: form.account.trim(),
        password: form.password.trim() || undefined,
        name: form.name.trim(),
        roleId: form.roleId,
        schools: schoolDisabled.value ? [] : [...form.schools]
      };
      await updateAdminManagerApi(targetAdminId, payload);
      ElMessage.success("管理员已更新");
      dialogVisible.value = false;
      const redirected = await refreshCurrentSessionIfNeeded(targetAdminId);
      if (!redirected) {
        await loadPage();
      }
    } else {
      const payload: AdminManagerCreatePayload = {
        account: form.account.trim(),
        password: form.password.trim(),
        name: form.name.trim(),
        roleId: form.roleId,
        schools: schoolDisabled.value ? [] : [...form.schools],
        status: form.status
      };
      await createAdminManagerApi(payload);
      ElMessage.success("管理员已创建");
      dialogVisible.value = false;
      await loadPage();
    }
  } catch (error) {
    showApiError(error, "管理员保存失败");
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: AdminManagerItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}管理员“${row.name}”吗？`, "状态确认", { type: "warning" });
  try {
    await toggleAdminManagerStatusApi(row.id);
    ElMessage.success(`已${action}`);
    await loadData();
  } catch (error) {
    showApiError(error, "管理员状态更新失败");
  }
}

async function removeRow(row: AdminManagerItem) {
  await ElMessageBox.confirm(`确认删除管理员“${row.name}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteAdminManagerApi(row.id);
    ElMessage.success("管理员已删除");
    await loadData();
  } catch (error) {
    showApiError(error, "管理员删除失败");
  }
}

async function showTransferResult(result: AdminManagerTransferResult) {
  if (!result.replacementAdmin) {
    ElMessage.success("学校管理员账号已回收并停用");
    return;
  }

  await ElMessageBox.alert(
    `学校：${result.school}<br>新账号：${result.replacementAdmin.account}<br>初始密码：${result.replacementAdmin.initialPassword}<br>请线下发送给接任管理员，并要求首次登录后修改密码。`,
    "交接账号已创建",
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: "我已记录"
    }
  );
}

async function submitTransfer() {
  if (!transferFormRef.value || !transferTarget.value) return;
  await transferFormRef.value.validate();
  await ElMessageBox.confirm(
    transferForm.mode === "transfer"
      ? "确认回收旧账号并创建新学校管理员账号吗？旧账号将立即停用。"
      : "确认回收该学校管理员账号吗？账号将立即停用并解除学校绑定。",
    "回收确认",
    { type: "warning" }
  );

  transferSubmitting.value = true;
  try {
    const payload: AdminManagerTransferPayload = {
      mode: transferForm.mode,
      school: transferForm.school,
      note: transferForm.note?.trim() || undefined,
      replacement:
        transferForm.mode === "transfer" && transferForm.replacement
          ? {
              account: transferForm.replacement.account.trim(),
              name: transferForm.replacement.name.trim()
            }
          : undefined
    };
    const result = await transferSchoolAdminAccountApi(transferTarget.value.id, payload);
    transferDialogVisible.value = false;
    await showTransferResult(result);
    await loadPage();
  } catch (error) {
    if (error !== "cancel") {
      showApiError(error, "学校管理员账号回收失败");
    }
  } finally {
    transferSubmitting.value = false;
  }
}

onMounted(loadPage);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">管理员数量</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">启用账号</div><div class="metric-value success">{{ summary.enabledCount }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">可用角色</div><div class="metric-value warning">{{ meta.roleOptions.length }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索姓名或账号" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.role" placeholder="全部角色" clearable class="select">
          <el-option v-for="item in summary.roleOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="启用" value="启用" />
          <el-option label="停用" value="停用" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-permission="'auth:admin:add'" type="primary" plain @click="openCreateDialog">新增管理员</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>管理员列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="account" label="账号" min-width="160" />
        <el-table-column prop="role" label="角色" min-width="160" />
        <el-table-column prop="school" label="负责高校" min-width="260" />
        <el-table-column prop="lastLoginTime" label="最近登录时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="310" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'auth:admin:edit'" link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              v-if="row.roleCode === 'school_admin'"
              v-permission="'auth:admin:edit'"
              link
              type="warning"
              :disabled="row.id === authStore.profile?.id"
              @click="openTransferDialog(row)"
            >
              回收/交接
            </el-button>
            <el-button
              v-permission="'auth:admin:edit'"
              link
              :type="row.status === '启用' ? 'danger' : 'success'"
              :disabled="row.id === authStore.profile?.id"
              @click="toggleStatus(row)"
            >
              {{ row.status === "启用" ? "停用" : "启用" }}
            </el-button>
            <el-button
              v-permission="'auth:admin:edit'"
              link
              type="danger"
              :disabled="row.id === authStore.profile?.id"
              @click="removeRow(row)"
            >
              删除
            </el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑管理员' : '新增管理员'" width="720px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="管理员姓名" prop="name"><el-input v-model="form.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="登录账号" prop="account"><el-input v-model="form.account" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item :label="editingId ? '重置密码' : '登录密码'" prop="password">
              <el-input v-model="form.password" type="password" show-password placeholder="留空则不修改" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="roleId">
              <el-select v-model="form.roleId" class="full-width" @change="syncSchoolsByRole">
                <el-option
                  v-for="item in meta.roleOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                  :disabled="!editingId && item.status !== '启用'"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="负责高校" prop="schools">
              <el-select v-model="form.schools" class="full-width" multiple collapse-tags :disabled="schoolDisabled">
                <el-option v-for="item in meta.schoolOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="!editingId" :span="12">
            <el-form-item label="初始状态">
              <el-select v-model="form.status" class="full-width">
                <el-option label="启用" value="启用" />
                <el-option label="停用" value="停用" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="transferDialogVisible" title="回收/交接学校管理员" width="620px">
      <el-alert
        v-if="transferTarget"
        type="warning"
        :closable="false"
        class="transfer-alert"
        :title="`旧账号：${transferTarget.name}（${transferTarget.account}），回收后将立即停用并解除学校绑定。`"
      />
      <el-form ref="transferFormRef" :model="transferForm" :rules="transferRules" label-width="110px">
        <el-form-item label="回收学校" prop="school">
          <el-select v-model="transferForm.school" class="full-width" placeholder="请选择学校">
            <el-option v-for="item in transferTarget?.schools || []" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理方式">
          <el-radio-group v-model="transferForm.mode">
            <el-radio-button label="revoke">仅回收停用</el-radio-button>
            <el-radio-button label="transfer">回收并交接</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <template v-if="transferForm.mode === 'transfer'">
          <el-form-item label="新管理员账号" prop="replacement">
            <el-input v-model="transferForm.replacement!.account" placeholder="例如 school_gzu_02" />
          </el-form-item>
          <el-form-item label="新管理员姓名" prop="replacement">
            <el-input v-model="transferForm.replacement!.name" placeholder="请输入接任管理员姓名" />
          </el-form-item>
        </template>
        <el-form-item label="处理备注">
          <el-input v-model="transferForm.note" type="textarea" :rows="3" placeholder="例如：原管理员毕业，已线下确认交接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="warning" :loading="transferSubmitting" @click="submitTransfer">确认回收</el-button>
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
.transfer-alert {
  margin-bottom: 16px;
}
</style>
