<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { createWithdrawApi, getWalletApi } from "../../api/modules/merchant";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const data = ref<any>({
  summary: {},
  withdrawProfile: {},
  withdraws: []
});

const form = reactive({
  amount: 0,
  remark: ""
});

const cards = [
  { key: "balance", label: "钱包余额" },
  { key: "withdrawableAmount", label: "可提现金额" },
  { key: "frozenAmount", label: "冻结金额" },
  { key: "totalIncome", label: "累计收入" },
  { key: "totalWithdrawn", label: "累计提现" }
];

const canWithdraw = computed(() => data.value.withdrawProfile?.status === "已建档");

function resetForm() {
  form.amount = 0;
  form.remark = "";
}

async function loadData() {
  loading.value = true;
  try {
    data.value = await getWalletApi();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "钱包数据加载失败");
  } finally {
    loading.value = false;
  }
}

async function handleWithdraw() {
  submitting.value = true;
  try {
    await createWithdrawApi({
      amount: Number(form.amount || 0),
      accountType: "微信零钱",
      accountNo: "微信零钱账户",
      remark: form.remark
    });
    ElMessage.success("提现申请已提交");
    dialogVisible.value = false;
    resetForm();
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "提现申请失败");
  } finally {
    submitting.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="16">
      <el-col v-for="item in cards" :key="item.key" :xs="24" :sm="12" :lg="8">
        <el-card shadow="hover">
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ data.summary[item.key] ?? 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span class="section-title">提现记录</span>
          <el-button type="primary" :disabled="!canWithdraw" @click="dialogVisible = true">申请提现</el-button>
        </div>
      </template>

      <el-alert
        :type="canWithdraw ? 'success' : 'warning'"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      >
        {{ data.withdrawProfile?.blockedReason || "微信提现建档已完成，可正常发起提现" }}
      </el-alert>

      <el-table :data="data.withdraws || []" empty-text="暂无提现记录">
        <el-table-column prop="withdrawNo" label="提现单号" min-width="180" />
        <el-table-column prop="amount" label="金额" width="100" />
        <el-table-column prop="accountType" label="账户类型" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="reviewNote" label="审核备注" min-width="180" />
        <el-table-column prop="transferFailReason" label="失败原因" min-width="180" />
        <el-table-column prop="applyTime" label="申请时间" min-width="170" />
        <el-table-column prop="transferSuccessAt" label="到账时间" min-width="170" />
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="申请提现" width="520px" @closed="resetForm">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px">
        当前可提现金额：{{ data.summary.withdrawableAmount ?? 0 }}，到账方式固定为微信零钱
      </el-alert>

      <el-form label-position="top">
        <el-form-item label="提现金额">
          <el-input-number v-model="form.amount" :min="0" :precision="2" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="到账方式">
          <el-input model-value="微信零钱" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model.trim="form.remark" type="textarea" :rows="3" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleWithdraw">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
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
</style>
