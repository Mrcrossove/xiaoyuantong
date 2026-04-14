<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import type { MessageTemplateItem, MessageTemplatePayload, MessageTemplateSummary } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import {
  createMessageTemplateApi,
  deleteMessageTemplateApi,
  getMessageTemplatesApi,
  toggleMessageTemplateStatusApi,
  updateMessageTemplateApi
} from "../../api/modules/message";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();
const list = ref<MessageTemplateItem[]>([]);
const total = ref(0);
const summary = ref<MessageTemplateSummary>({
  total: 0,
  enabledCount: 0,
  channelOptions: [],
  schoolOptions: []
});

const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  status: ""
});

const form = reactive<MessageTemplatePayload>({
  code: "",
  name: "",
  school: "全部高校",
  channel: "小程序站内信",
  status: "启用",
  content: "",
  remark: ""
});

const rules: FormRules<typeof form> = {
  code: [{ required: true, message: "请输入模板编码", trigger: "blur" }],
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  school: [{ required: true, message: "请选择适用高校", trigger: "change" }],
  channel: [{ required: true, message: "请选择发送渠道", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
  content: [{ required: true, message: "请输入模板内容", trigger: "blur" }]
};

const schoolOptions = computed(() => Array.from(new Set(["全部高校", ...summary.value.schoolOptions])));

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
  form.school = "全部高校";
  form.channel = "小程序站内信";
  form.status = "启用";
  form.content = "";
  form.remark = "";
}

function openCreateDialog() {
  resetForm();
  dialogVisible.value = true;
}

function openEditDialog(row: MessageTemplateItem) {
  editingId.value = row.id;
  form.code = row.code;
  form.name = row.name;
  form.school = row.school;
  form.channel = row.channel;
  form.status = row.status;
  form.content = row.content;
  form.remark = row.remark;
  dialogVisible.value = true;
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getMessageTemplatesApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } catch (error) {
    showApiError(error, "消息模板加载失败");
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

async function submitForm() {
  if (!formRef.value) return;
  await formRef.value.validate();
  submitting.value = true;
  try {
    const payload: MessageTemplatePayload = {
      code: form.code.trim(),
      name: form.name.trim(),
      school: form.school,
      channel: form.channel,
      status: form.status,
      content: form.content.trim(),
      remark: form.remark.trim()
    };

    if (editingId.value) {
      await updateMessageTemplateApi(editingId.value, payload);
      ElMessage.success("消息模板已更新");
    } else {
      await createMessageTemplateApi(payload);
      ElMessage.success("消息模板已创建");
    }

    dialogVisible.value = false;
    loadData();
  } catch (error) {
    showApiError(error, "消息模板保存失败");
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(row: MessageTemplateItem) {
  const action = row.status === "启用" ? "停用" : "启用";
  await ElMessageBox.confirm(`确认${action}模板“${row.name}”吗？`, "状态确认", { type: "warning" });
  try {
    await toggleMessageTemplateStatusApi(row.id);
    ElMessage.success(`已${action}`);
    loadData();
  } catch (error) {
    showApiError(error, "模板状态更新失败");
  }
}

async function removeRow(row: MessageTemplateItem) {
  await ElMessageBox.confirm(`确认删除模板“${row.name}”吗？`, "删除确认", { type: "warning" });
  try {
    await deleteMessageTemplateApi(row.id);
    ElMessage.success("消息模板已删除");
    loadData();
  } catch (error) {
    showApiError(error, "消息模板删除失败");
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">模板数量</div><div class="metric-value">{{ summary.total }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">启用模板</div><div class="metric-value success">{{ summary.enabledCount }}</div></el-card></el-col>
      <el-col :span="8"><el-card shadow="never"><div class="metric-label">发送渠道</div><div class="metric-value">{{ summary.channelOptions.length }}</div></el-card></el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索模板名称或编码" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部状态" clearable class="select">
          <el-option label="启用" value="启用" />
          <el-option label="停用" value="停用" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button v-permission="'message:template:add'" type="primary" plain @click="openCreateDialog">新增模板</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>消息模板列表</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="name" label="模板名称" min-width="180" />
        <el-table-column prop="code" label="模板编码" min-width="200" />
        <el-table-column prop="school" label="适用高校" width="140" />
        <el-table-column prop="channel" label="发送渠道" width="140" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'message:template:edit'" link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-permission="'message:template:edit'" link :type="row.status === '启用' ? 'danger' : 'success'" @click="toggleStatus(row)">
              {{ row.status === "启用" ? "停用" : "启用" }}
            </el-button>
            <el-button v-permission="'message:template:edit'" link type="danger" @click="removeRow(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑消息模板' : '新增消息模板'" width="720px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="模板名称" prop="name"><el-input v-model="form.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="模板编码" prop="code"><el-input v-model="form.code" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="适用高校" prop="school">
              <el-select v-model="form.school" class="full-width">
                <el-option v-for="item in schoolOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发送渠道" prop="channel">
              <el-select v-model="form.channel" class="full-width">
                <el-option label="小程序站内信" value="小程序站内信" />
                <el-option label="短信" value="短信" />
                <el-option label="站内信+短信" value="站内信+短信" />
              </el-select>
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
          <el-col :span="24"><el-form-item label="模板内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item></el-col>
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
.input { width: 280px; }
.select { width: 180px; }
.full-width { width: 100%; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
