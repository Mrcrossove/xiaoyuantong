<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const form = reactive({
  account: "",
  password: ""
});

async function handleLogin() {
  try {
    loading.value = true;
    await authStore.login(form);
    ElMessage.success("登录成功");
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard/overview";
    router.replace(redirect);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "登录失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">校园通管理后台</div>
      <div class="sub">统一管理高校、用户、认证、店铺、订单和运营配置。</div>

      <el-form label-position="top" @submit.prevent>
        <el-form-item label="账号">
          <el-input v-model="form.account" placeholder="请输入后台账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入登录密码" />
        </el-form-item>
        <el-button type="primary" class="submit" :loading="loading" @click="handleLogin">登录后台</el-button>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top, #e8f1ff, #f5f7fb 45%);
}

.login-card {
  width: 420px;
  padding: 32px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(53, 88, 163, 0.12);
}

.brand {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
}

.sub {
  margin: 10px 0 20px;
  color: #667085;
  line-height: 1.7;
}

.submit {
  width: 100%;
  height: 44px;
}
</style>
