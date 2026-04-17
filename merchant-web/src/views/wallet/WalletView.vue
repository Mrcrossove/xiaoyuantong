<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { createWithdrawApi, getWalletApi } from "../../api/modules/merchant";

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const data = ref<any>({
  summary: {},
  withdraws: []
});

const form = reactive({
  amount: 0,
  accountType: "微信零钱",
  accountNo: "",
  remark: ""
});

const cards = [
  { key: "balance", label: "钱包余额" },
  { key: "withdrawableAmount", label: "可提现金额" },
  { key: "frozenAmount", label: "冻结金额" },
  { key: "totalIncome", label: "累计收入" },
  { key: "totalWithdrawn", label: "累计提现" }
];

function resetForm() {
  form.amount = 0;
  form.accountType = "微信零钱";
  form.accountNo = "";
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
      accountType: form.accountType,
      accountNo: form.accountNo,
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
          <el-button type="primary" @click="dialogVisible = true">申请提现</el-button>
        </div>
      </template>

      <el-table :data="data.withdraws || []" empty-text="暂无提现记录">
        <el-table-column prop="withdrawNo" label="提现单号" min-width="180" />
        <el-table-column prop="amount" label="金额" width="100" />
        <el-table-column prop="accountType" label="账户类型" width="120" />
        <el-table-column prop="accountNo" label="提现账户" min-width="180" />
        <el-table-column prop="status" label="状态" width="110" />
        <el-table-column prop="reviewNote" label="审核备注" min-width="180" />
        <el-table-column prop="applyTime" label="申请时间" min-width="170" />
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="申请提现" width="520px" @closed="resetForm">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      >
        当前可提现金额：{{ data.summary.withdrawableAmount ?? 0 }}
      </el-alert>

      <el-form label-position="top">
        <el-form-item label="提现金额">
          <el-input-number v-model="form.amount" :min="0" :precision="2" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="提现方式">
          <el-input v-model.trim="form.accountType" />
        </el-form-item>
        <el-form-item label="提现账户">
          <el-input v-model.trim="form.accountNo" placeholder="请输入微信号、银行卡号或收款账户" />
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
</style>
