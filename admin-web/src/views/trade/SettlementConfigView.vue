<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type {
  StoreSettlementConfigItem,
  StoreSettlementConfigPayload,
  StoreSettlementConfigQuery
} from "../../api/contracts";
import { getStoreSettlementConfigListApi, updateStoreSettlementConfigApi } from "../../api/modules/trade";
import { ApiRequestError } from "../../api/request";

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref(0);
const list = ref<StoreSettlementConfigItem[]>([]);
const total = ref(0);
const summary = ref({
  total: 0,
  activeCount: 0,
  enabledCount: 0,
  defaultCommissionRate: 0.05,
  schoolOptions: [] as string[]
});

const query = reactive<StoreSettlementConfigQuery>({
  page: 1,
  pageSize: 10,
  keyword: "",
  school: "",
  status: ""
});

const form = reactive<StoreSettlementConfigPayload>({
  wechatSubMchId: "",
  wechatSubMchStatus: "not_invited",
  commissionRate: 0.05,
  profitSharingEnabled: true,
  settlementMode: "auto",
  merchantContactName: "",
  merchantContactPhone: ""
});

const statusOptions = [
  { label: "未邀请", value: "not_invited", type: "info" },
  { label: "审核中", value: "pending", type: "warning" },
  { label: "已开通", value: "active", type: "success" },
  { label: "已驳回", value: "rejected", type: "danger" },
  { label: "已停用", value: "disabled", type: "info" }
] as const;

const settlementModeOptions = [
  { label: "自动分账", value: "auto" },
  { label: "人工结算", value: "manual" },
  { label: "关闭结算", value: "disabled" }
] as const;

function getStatusMeta(value: string) {
  return statusOptions.find((item) => item.value === value) || statusOptions[0];
}

function getSettlementModeLabel(value: string) {
  return settlementModeOptions.find((item) => item.value === value)?.label || "自动分账";
}

function formatPercent(value: number | null | undefined) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

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
    const result = await getStoreSettlementConfigListApi(query);
    list.value = result.list;
    total.value = result.total;
    summary.value = result.summary;
  } catch (error) {
    showApiError(error, "分账配置加载失败");
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

function openEdit(row: StoreSettlementConfigItem) {
  editingId.value = row.id;
  form.wechatSubMchId = row.wechatSubMchId || "";
  form.wechatSubMchStatus = row.wechatSubMchStatus || "not_invited";
  form.commissionRate = Number(row.commissionRate ?? row.effectiveCommissionRate ?? summary.value.defaultCommissionRate);
  form.profitSharingEnabled = row.profitSharingEnabled;
  form.settlementMode = row.settlementMode || "auto";
  form.merchantContactName = row.merchantContactName || row.ownerName || "";
  form.merchantContactPhone = row.merchantContactPhone || row.ownerPhone || "";
  dialogVisible.value = true;
}

async function handleSave() {
  if (!editingId.value) return;
  saving.value = true;
  try {
    await updateStoreSettlementConfigApi(editingId.value, form);
    ElMessage.success("分账配置已保存");
    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    showApiError(error, "分账配置保存失败");
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-alert
      title="这里配置每家店铺的微信服务商特约商户号和平台分成比例。已支付订单会按下单时的比例快照分账，修改配置不会影响历史订单。"
      type="info"
      show-icon
      :closable="false"
    />

    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">店铺总数</div><div class="metric-value">{{ summary.total }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">已开通特约商户</div><div class="metric-value success">{{ summary.activeCount }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">开启分账</div><div class="metric-value">{{ summary.enabledCount }}</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="metric-label">默认平台分成</div><div class="metric-value warning">{{ formatPercent(summary.defaultCommissionRate) }}</div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>筛选条件</template>
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索店铺、手机号或特约商户号" clearable class="input" @keyup.enter="handleSearch" />
        <el-select v-model="query.school" placeholder="全部高校" clearable class="select">
          <el-option v-for="item in summary.schoolOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="query.status" placeholder="全部特约状态" clearable class="select">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>店铺分账配置</template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column label="店铺" min-width="220">
          <template #default="{ row }">
            <div class="store-name">{{ row.storeName }}</div>
            <div class="sub-text">{{ row.school }}</div>
          </template>
        </el-table-column>
        <el-table-column label="商家联系人" min-width="150">
          <template #default="{ row }">
            <div>{{ row.merchantContactName || row.ownerName || "-" }}</div>
            <div class="sub-text">{{ row.merchantContactPhone || row.ownerPhone || "-" }}</div>
          </template>
        </el-table-column>
        <el-table-column label="特约商户号" min-width="150">
          <template #default="{ row }">{{ row.wechatSubMchId || "未配置" }}</template>
        </el-table-column>
        <el-table-column label="特约状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusMeta(row.wechatSubMchStatus).type">{{ getStatusMeta(row.wechatSubMchStatus).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="平台分成" width="120">
          <template #default="{ row }">
            <div>{{ formatPercent(row.effectiveCommissionRate) }}</div>
            <div class="sub-text">{{ row.commissionRate == null ? "使用默认" : "店铺独立" }}</div>
          </template>
        </el-table-column>
        <el-table-column label="结算模式" width="120">
          <template #default="{ row }">{{ getSettlementModeLabel(row.settlementMode) }}</template>
        </el-table-column>
        <el-table-column label="分账开关" width="100">
          <template #default="{ row }">
            <el-tag :type="row.profitSharingEnabled ? 'success' : 'info'">{{ row.profitSharingEnabled ? "开启" : "关闭" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'settlement:config'" link type="primary" @click="openEdit(row)">配置</el-button>
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

    <el-dialog v-model="dialogVisible" title="店铺分账配置" width="560px">
      <el-form label-width="130px">
        <el-form-item label="特约商户号">
          <el-input v-model="form.wechatSubMchId" placeholder="填写微信支付服务商下的 sub_mchid" />
        </el-form-item>
        <el-form-item label="特约状态">
          <el-select v-model="form.wechatSubMchStatus" class="full-width">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台分成比例">
          <el-input-number v-model="form.commissionRate" :min="0" :max="0.3" :step="0.005" :precision="4" class="full-width" />
          <div class="form-tip">例如 0.05 表示平台抽成 5%，商家获得 95%。上限暂定 30%。</div>
        </el-form-item>
        <el-form-item label="结算模式">
          <el-select v-model="form.settlementMode" class="full-width">
            <el-option v-for="item in settlementModeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="开启自动分账">
          <el-switch v-model="form.profitSharingEnabled" />
        </el-form-item>
        <el-form-item label="联系人姓名">
          <el-input v-model="form.merchantContactName" placeholder="商家联系人姓名" />
        </el-form-item>
        <el-form-item label="联系人手机号">
          <el-input v-model="form.merchantContactPhone" placeholder="商家联系人手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 16px; }
.metric-label { color: #667085; font-size: 14px; }
.metric-value { margin-top: 12px; font-size: 30px; font-weight: 700; }
.metric-value.success { color: #16a34a; }
.metric-value.warning { color: #d97706; }
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; }
.input { width: 280px; }
.select { width: 180px; }
.store-name { font-weight: 600; color: #101828; }
.sub-text { margin-top: 4px; font-size: 12px; color: #667085; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.full-width { width: 100%; }
.form-tip { margin-top: 6px; font-size: 12px; color: #667085; line-height: 1.5; }
</style>
