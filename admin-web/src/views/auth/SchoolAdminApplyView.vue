<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type {
  SchoolAdminApplicationAssignPayload,
  SchoolAdminApplicationAssignResult,
  SchoolAdminApplicationItem,
  SchoolAdminApplicationListResult
} from "../../api/contracts";
import {
  assignSchoolAdminApplicationApi,
  getSchoolAdminApplicationListApi,
  reviewSchoolAdminApplicationApi
} from "../../api/modules/school-admin-apply";
import { ApiRequestError } from "../../api/request";

const loading = ref(false);
const assigning = ref(false);
const assignDialogVisible = ref(false);
const assignFormRef = ref<FormInstance>();
const currentRow = ref<SchoolAdminApplicationItem | null>(null);
const list = ref<SchoolAdminApplicationItem[]>([]);
const total = ref(0);
const summary = ref<SchoolAdminApplicationListResult["summary"]>({
  total: 0,
  pendingCount: 0,
  contactedCount: 0,
  assignedCount: 0,
  schoolOptions: []
});
const query = reactive({
  page: 1,
  pageSize: 10,
  school: "",
  status: "",
  keyword: ""
});
const assignForm = reactive<SchoolAdminApplicationAssignPayload>({
  account: "",
  name: "",
  reviewNote: ""
});

const assignRules: FormRules<typeof assignForm> = {
  account: [
    { required: true, message: "请输入后台账号", trigger: "blur" },
    { min: 4, message: "账号至少 4 位", trigger: "blur" }
  ],
  name: [{ required: true, message: "请输入管理员姓名", trigger: "blur" }]
};

const canAssign = computed(() => currentRow.value && currentRow.value.status !== "已分配账号");

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

async function loadData() {
  loading.value = true;
  try {
    const result = await getSchoolAdminApplicationListApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } catch (error) {
    showApiError(error, "管理员申请加载失败");
  } finally {
    loading.value = false;
  }
}

async function updateStatus(row: SchoolAdminApplicationItem, status: "待处理" | "已联系" | "已拒绝" | "已关闭") {
  try {
    const { value } = await ElMessageBox.prompt("请输入处理备注，可为空", `更新为${status}`, {
      inputValue: row.reviewNote || "",
      inputPlaceholder: "处理备注",
      confirmButtonText: "确认",
      cancelButtonText: "取消"
    });
    await reviewSchoolAdminApplicationApi(row.id, {
      status,
      reviewNote: value || ""
    });
    ElMessage.success("申请状态已更新");
    await loadData();
  } catch (error) {
    if (error !== "cancel") {
      showApiError(error, "申请状态更新失败");
    }
  }
}

function openAssignDialog(row: SchoolAdminApplicationItem) {
  currentRow.value = row;
  assignForm.account = "";
  assignForm.name = row.applicantName && row.applicantName !== "-" ? row.applicantName : "";
  assignForm.reviewNote = row.reviewNote || "";
  assignDialogVisible.value = true;
}

async function submitAssign() {
  if (!assignFormRef.value || !currentRow.value || !canAssign.value) return;
  await assignFormRef.value.validate();
  assigning.value = true;
  try {
    const result = await assignSchoolAdminApplicationApi(currentRow.value.id, assignForm);
    assignDialogVisible.value = false;
    await showAssignResult(result);
    await loadData();
  } catch (error) {
    showApiError(error, "学校管理员账号分配失败");
  } finally {
    assigning.value = false;
  }
}

async function showAssignResult(result: SchoolAdminApplicationAssignResult) {
  const { adminUser } = result;
  await ElMessageBox.alert(
    `学校：${adminUser.school}<br>账号：${adminUser.account}<br>初始密码：${adminUser.initialPassword}<br>请立即线下保存并通知申请团队。`,
    "账号已创建",
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: "我已记录"
    }
  );
}

function handleSearch() {
  query.page = 1;
  loadData();
}

function handleReset() {
  query.page = 1;
  query.school = "";
  query.status = "";
  query.keyword = "";
  loadData();
}

function handlePageChange(page: number) {
  query.page = page;
  loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">申请总数</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">待处理</div><div class="metric-value warning">{{ summary.pendingCount }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="metric-label">已分配</div><div class="metric-value success">{{ summary.assignedCount }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>申请筛选</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索学校、申请人、手机号或联系方式" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部学校" clearable class="select">
          <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="待处理" value="待处理" />
          <el-option label="已联系" value="已联系" />
          <el-option label="已分配账号" value="已分配账号" />
          <el-option label="已拒绝" value="已拒绝" />
          <el-option label="已关闭" value="已关闭" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>校园管理员申请</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="school" label="学校" min-width="180" />
        <el-table-column prop="applicantName" label="申请人" width="120" />
        <el-table-column prop="applicantPhone" label="注册手机号" width="140" />
        <el-table-column prop="teamSize" label="团队人数" width="100" />
        <el-table-column prop="contact" label="联系方式" min-width="160" show-overflow-tooltip />
        <el-table-column label="同校待处理" width="100">
          <template #default="{ row }">{{ row.schoolPendingCount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '已分配账号' ? 'success' : row.status === '待处理' ? 'warning' : row.status === '已联系' ? 'primary' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignedAdminAccount" label="已分配账号" width="140" />
        <el-table-column prop="reviewNote" label="处理备注" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="申请时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== '已分配账号'" v-permission="'auth:school-admin-apply:review'" link type="primary" @click="updateStatus(row, '已联系')">
              标记已联系
            </el-button>
            <el-button v-if="row.status !== '已分配账号'" v-permission="'auth:school-admin-apply:assign'" link type="success" @click="openAssignDialog(row)">
              分配账号
            </el-button>
            <el-button v-if="row.status !== '已分配账号'" v-permission="'auth:school-admin-apply:review'" link type="danger" @click="updateStatus(row, '已拒绝')">
              拒绝
            </el-button>
            <el-button v-if="row.status !== '已分配账号'" v-permission="'auth:school-admin-apply:review'" link @click="updateStatus(row, '已关闭')">
              关闭
            </el-button>
            <span v-if="row.status === '已分配账号'" class="muted">已完成</span>
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

    <el-dialog v-model="assignDialogVisible" title="分配学校管理员账号" width="520px">
      <el-alert
        v-if="currentRow"
        type="info"
        :closable="false"
        class="assign-alert"
        :title="`学校：${currentRow.school}；团队人数：${currentRow.teamSize}；联系方式：${currentRow.contact}`"
      />
      <el-form ref="assignFormRef" :model="assignForm" :rules="assignRules" label-width="96px">
        <el-form-item label="后台账号" prop="account">
          <el-input v-model="assignForm.account" placeholder="例如 school_gzu_01" />
        </el-form-item>
        <el-form-item label="管理员姓名" prop="name">
          <el-input v-model="assignForm.name" placeholder="请输入后台显示姓名" />
        </el-form-item>
        <el-form-item label="分配备注">
          <el-input v-model="assignForm.reviewNote" type="textarea" :rows="3" placeholder="可记录沟通情况或团队信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="assigning" @click="submitAssign">创建账号并分配</el-button>
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
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.muted {
  color: #98a2b3;
}
.assign-alert {
  margin-bottom: 16px;
}
</style>
