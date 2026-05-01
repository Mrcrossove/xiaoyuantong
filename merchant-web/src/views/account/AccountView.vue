<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { getAccountProfileApi, updateAccountPasswordApi, updateAccountProfileApi } from "../../api/modules/merchant";
import { useMerchantAuthStore } from "../../stores/auth";

const authStore = useMerchantAuthStore();
const loading = ref(false);
const savingProfile = ref(false);
const savingPassword = ref(false);
const profile = ref<any>(null);

const profileForm = reactive({
  name: "",
  withdrawRealName: "",
  acceptWithdrawAgreement: false
});

const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

const withdrawProfile = computed(() => profile.value?.withdrawProfile || {});

async function loadData() {
  loading.value = true;
  try {
    const result = await getAccountProfileApi();
    profile.value = result;
    profileForm.name = result.name || "";
    profileForm.withdrawRealName = result.withdrawProfile?.realName || "";
    profileForm.acceptWithdrawAgreement = Boolean(result.withdrawProfile?.agreementAccepted);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "账号信息加载失败");
  } finally {
    loading.value = false;
  }
}

async function handleUpdateProfile() {
  savingProfile.value = true;
  try {
    await updateAccountProfileApi({
      name: profileForm.name,
      withdrawRealName: profileForm.withdrawRealName,
      acceptWithdrawAgreement: profileForm.acceptWithdrawAgreement
    });
    await authStore.refreshSession();
    ElMessage.success("账号资料已更新");
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "账号资料更新失败");
  } finally {
    savingProfile.value = false;
  }
}

async function handleUpdatePassword() {
  if (passwordForm.oldPassword.length < 6) {
    ElMessage.warning("请输入至少 6 位原密码");
    return;
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning("新密码至少 6 位");
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning("两次输入的新密码不一致");
    return;
  }

  savingPassword.value = true;
  try {
    await updateAccountPasswordApi({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });
    passwordForm.oldPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
    ElMessage.success("密码已更新");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "密码更新失败");
  } finally {
    savingPassword.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <el-card>
      <template #header>
        <div class="section-title">账号资料</div>
      </template>
      <el-descriptions class="profile-desc" :column="2" border>
        <el-descriptions-item label="登录手机号">{{ profile?.phone || "-" }}</el-descriptions-item>
        <el-descriptions-item label="账号状态">{{ profile?.status || "-" }}</el-descriptions-item>
        <el-descriptions-item label="店铺名称">{{ profile?.storeName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="所属学校">{{ profile?.school || "-" }}</el-descriptions-item>
        <el-descriptions-item label="最近登录">{{ profile?.lastLoginAt || "-" }}</el-descriptions-item>
        <el-descriptions-item label="登录方式">账号密码 / 短信验证码</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-form label-position="top">
        <el-form-item label="联系人姓名">
          <el-input v-model.trim="profileForm.name" maxlength="20" />
        </el-form-item>
        <el-button type="primary" :loading="savingProfile" @click="handleUpdateProfile">保存资料</el-button>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="section-title">修改登录密码</div>
      </template>
      <el-alert
        title="如果你还在使用小程序消息里的初始密码，建议登录后在这里修改为自己的密码。"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />
      <el-form label-position="top" class="password-form">
        <el-form-item label="原密码">
          <el-input v-model.trim="passwordForm.oldPassword" type="password" show-password maxlength="30" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model.trim="passwordForm.newPassword" type="password" show-password maxlength="30" />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model.trim="passwordForm.confirmPassword" type="password" show-password maxlength="30" />
        </el-form-item>
        <el-button type="primary" :loading="savingPassword" @click="handleUpdatePassword">保存新密码</el-button>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="section-title">微信提现建档</div>
      </template>
      <el-alert
        :type="withdrawProfile.status === '已建档' ? 'success' : 'warning'"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      >
        {{ withdrawProfile.blockedReason || "微信提现收款资料已完成建档" }}
      </el-alert>

      <el-descriptions class="profile-desc" :column="2" border>
        <el-descriptions-item label="收款方式">{{ withdrawProfile.channel || "微信零钱" }}</el-descriptions-item>
        <el-descriptions-item label="建档状态">{{ withdrawProfile.status || "未建档" }}</el-descriptions-item>
        <el-descriptions-item label="微信身份绑定">{{ withdrawProfile.openidBound ? "已绑定" : "未绑定" }}</el-descriptions-item>
        <el-descriptions-item label="绑定时间">{{ withdrawProfile.openidBoundAt || "-" }}</el-descriptions-item>
        <el-descriptions-item label="协议确认">{{ withdrawProfile.agreementAccepted ? "已确认" : "未确认" }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ withdrawProfile.completedAt || "-" }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-form label-position="top">
        <el-form-item label="收款人真实姓名">
          <el-input
            v-model.trim="profileForm.withdrawRealName"
            maxlength="20"
            placeholder="用于后续补齐大额提现实名能力，当前可先选填"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="profileForm.acceptWithdrawAgreement">
            我已确认提现资金打入当前微信绑定的零钱账户，并接受平台审核、查单与打款结果同步机制
          </el-checkbox>
        </el-form-item>
        <div class="hint">{{ withdrawProfile.amountLimitNote || "" }}</div>
        <el-button type="primary" :loading="savingProfile" @click="handleUpdateProfile">保存提现建档</el-button>
      </el-form>
    </el-card>
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

.password-form {
  max-width: 520px;
}

.hint {
  margin: -8px 0 16px;
  color: #667085;
  font-size: 13px;
}

@media (max-width: 720px) {
  :deep(.el-descriptions__body table),
  :deep(.el-descriptions__body tbody),
  :deep(.el-descriptions__body tr),
  :deep(.el-descriptions__body th),
  :deep(.el-descriptions__body td) {
    display: block;
    width: 100% !important;
  }

  :deep(.el-descriptions__label) {
    border-bottom: 0;
  }
}
</style>
