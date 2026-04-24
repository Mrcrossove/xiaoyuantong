<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { getAdminAccountProfileApi, updateAdminAccountPasswordApi } from "../../api/modules/auth";
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();
const loading = ref(false);
const activating = ref(false);
const savingPassword = ref(false);
const profile = ref<any>(null);

const activateForm = reactive({
  password: ""
});

const passwordForm = reactive({
  oldPassword: "",
  newPassword: ""
});

const mustChangePassword = computed(() => Boolean(profile.value?.mustChangePassword || authStore.mustChangePassword));

async function loadData() {
  loading.value = true;
  try {
    profile.value = await getAdminAccountProfileApi();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "账号信息加载失败");
  } finally {
    loading.value = false;
  }
}

async function handleActivate() {
  activating.value = true;
  try {
    await authStore.activate(activateForm.password);
    activateForm.password = "";
    ElMessage.success("新密码设置成功");
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "新密码设置失败");
  } finally {
    activating.value = false;
  }
}

async function handleUpdatePassword() {
  savingPassword.value = true;
  try {
    await updateAdminAccountPasswordApi(passwordForm);
    passwordForm.oldPassword = "";
    passwordForm.newPassword = "";
    await authStore.refreshSession();
    ElMessage.success("登录密码已更新");
    await loadData();
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
    <el-card v-if="mustChangePassword" class="activate-card">
      <template #header>
        <div class="section-title">首次登录请先修改密码</div>
      </template>
      <p class="activate-desc">当前账号正在使用系统下发的初始密码。为保证后台安全，首次登录后必须先设置一个新的登录密码。</p>
      <div class="activate-row">
        <el-input v-model.trim="activateForm.password" show-password placeholder="请设置 6-30 位新密码" />
        <el-button type="primary" :loading="activating" @click="handleActivate">保存新密码</el-button>
      </div>
    </el-card>

    <el-card>
      <template #header>
        <div class="section-title">账号资料</div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="登录账号">{{ profile?.account || "-" }}</el-descriptions-item>
        <el-descriptions-item label="账号状态">{{ profile?.status || "-" }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ profile?.roleName || "-" }}</el-descriptions-item>
        <el-descriptions-item label="学校范围">{{ profile?.schools?.join("、") || "全部高校" }}</el-descriptions-item>
        <el-descriptions-item label="最近登录">{{ profile?.lastLoginAt || "-" }}</el-descriptions-item>
        <el-descriptions-item label="密码状态">{{ mustChangePassword ? "需立即修改" : "正常" }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card v-if="!mustChangePassword">
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
.page {
  display: grid;
  gap: 16px;
}

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
