<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getAccountProfileApi,
  updateAccountPasswordApi,
  updateAccountProfileApi
} from "../../api/modules/merchant";
import { useMerchantAuthStore } from "../../stores/auth";

const authStore = useMerchantAuthStore();
const loading = ref(false);
const savingProfile = ref(false);
const savingPassword = ref(false);
const activating = ref(false);
const profile = ref<any>(null);

const profileForm = reactive({
  name: ""
});

const passwordForm = reactive({
  oldPassword: "",
  newPassword: ""
});

const activateForm = reactive({
  password: ""
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getAccountProfileApi();
    profile.value = result;
    profileForm.name = result.name || "";
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "账号信息加载失败");
  } finally {
    loading.value = false;
  }
}

async function handleUpdateProfile() {
  savingProfile.value = true;
  try {
    await updateAccountProfileApi({ name: profileForm.name });
    await authStore.refreshSession();
    ElMessage.success("账号信息已更新");
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "账号信息更新失败");
  } finally {
    savingProfile.value = false;
  }
}

async function handleUpdatePassword() {
  savingPassword.value = true;
  try {
    await updateAccountPasswordApi(passwordForm);
    passwordForm.oldPassword = "";
    passwordForm.newPassword = "";
    ElMessage.success("登录密码已更新");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "密码更新失败");
  } finally {
    savingPassword.value = false;
  }
}

async function handleActivate() {
  activating.value = true;
  try {
    await authStore.activate(activateForm.password);
    activateForm.password = "";
    ElMessage.success("商家账号已激活");
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "账号激活失败");
  } finally {
    activating.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <el-card v-if="authStore.needActivate" class="activate-card">
      <template #header>
        <div class="section-title">首次登录激活</div>
      </template>
      <p class="activate-desc">当前账号仍处于待激活状态，请先设置登录密码。激活后即可使用密码登录商家后台。</p>
      <div class="activate-row">
        <el-input v-model.trim="activateForm.password" show-password placeholder="请设置 6-30 位登录密码" />
        <el-button type="primary" :loading="activating" @click="handleActivate">立即激活</el-button>
      </div>
    </el-card>

    <el-card>
      <template #header>
        <div class="section-title">账号资料</div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="登录手机号">{{ profile?.phone || "-" }}</el-descriptions-item>
        <el-descriptions-item label="账号状态">{{ profile?.status || "-" }}</el-descriptions-item>
        <el-descriptions-item label="店铺名称">{{ profile?.storeName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="所属高校">{{ profile?.school || "-" }}</el-descriptions-item>
        <el-descriptions-item label="最近登录">{{ profile?.lastLoginAt || "-" }}</el-descriptions-item>
        <el-descriptions-item label="激活状态">{{ profile?.isActivated ? "已激活" : "待激活" }}</el-descriptions-item>
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
        <div class="section-title">修改密码</div>
      </template>
      <el-form label-position="top">
        <el-form-item label="原密码">
          <el-input v-model.trim="passwordForm.oldPassword" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model.trim="passwordForm.newPassword" show-password />
        </el-form-item>
        <el-button type="primary" :loading="savingPassword" @click="handleUpdatePassword">更新密码</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 700;
}

.activate-card {
  border: 1px solid #fde68a;
}

.activate-desc {
  margin: 0 0 16px;
  color: #475467;
}

.activate-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}
</style>
