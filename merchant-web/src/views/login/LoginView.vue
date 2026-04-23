<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ApiRequestError } from "../../api/request";
import { sendCodeApi } from "../../api/modules/merchant";
import { useMerchantAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useMerchantAuthStore();

const activeTab = ref<"code" | "password">("password");
const loading = ref(false);
const sending = ref(false);

const codeForm = reactive({
  phone: "",
  code: ""
});

const passwordForm = reactive({
  phone: "",
  password: ""
});

const redirectPath = computed(() => String(route.query.redirect || "/dashboard"));

function nextPath() {
  return authStore.mustChangePassword ? "/account" : redirectPath.value;
}

async function handleSendCode() {
  if (!/^1\d{10}$/.test(codeForm.phone)) {
    ElMessage.warning("请输入正确的手机号");
    return;
  }

  sending.value = true;
  try {
    await sendCodeApi({ phone: codeForm.phone, scene: "login" });
    ElMessage.success("验证码已发送");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "验证码发送失败");
  } finally {
    sending.value = false;
  }
}

async function handleCodeLogin() {
  loading.value = true;
  try {
    await authStore.loginByCode({ phone: codeForm.phone, code: codeForm.code });
    ElMessage.success("登录成功");
    router.replace(nextPath());
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "登录失败");
  } finally {
    loading.value = false;
  }
}

async function handlePasswordLogin() {
  loading.value = true;
  try {
    await authStore.loginByPassword(passwordForm);
    ElMessage.success("登录成功");
    router.replace(nextPath());
  } catch (error) {
    if (error instanceof ApiRequestError) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error("登录失败");
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="hero">
        <div class="hero-badge">校园通商家中心</div>
        <h1>商家后台登录</h1>
        <p>
          平台审核通过后，系统会自动创建商家后台账号，并把登录账号和初始密码推送到小程序消息中心。
          首次登录后必须先修改密码，修改完成后才能正常使用后台。
        </p>
        <ul class="tips">
          <li>登录账号默认是入驻申请里填写的手机号</li>
          <li>初始密码请到小程序“消息”页查看</li>
          <li>短信验证码登录可作为补充登录方式</li>
        </ul>
      </div>
      <div class="form-card">
        <el-tabs v-model="activeTab" stretch>
          <el-tab-pane label="密码登录" name="password">
            <el-form label-position="top" @submit.prevent="handlePasswordLogin">
              <el-form-item label="手机号">
                <el-input v-model.trim="passwordForm.phone" maxlength="11" placeholder="请输入入驻申请联系人手机号" />
              </el-form-item>
              <el-form-item label="密码">
                <el-input v-model.trim="passwordForm.password" show-password placeholder="请输入登录密码" />
              </el-form-item>
              <el-button class="submit-btn" type="primary" :loading="loading" @click="handlePasswordLogin">
                登录并进入后台
              </el-button>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="验证码登录" name="code">
            <el-form label-position="top" @submit.prevent="handleCodeLogin">
              <el-form-item label="手机号">
                <el-input v-model.trim="codeForm.phone" maxlength="11" placeholder="请输入入驻申请联系人手机号" />
              </el-form-item>
              <el-form-item label="验证码">
                <div class="code-row">
                  <el-input v-model.trim="codeForm.code" maxlength="6" placeholder="请输入验证码" />
                  <el-button :loading="sending" @click="handleSendCode">发送验证码</el-button>
                </div>
              </el-form-item>
              <el-button class="submit-btn" type="primary" :loading="loading" @click="handleCodeLogin">
                登录并进入后台
              </el-button>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 30%),
    radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.18), transparent 28%),
    linear-gradient(180deg, #f7fbff, #eef4ff 45%, #f5f7fb);
}

.login-panel {
  width: min(1080px, 100%);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 24px;
}

.hero,
.form-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(219, 234, 254, 0.9);
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

.hero {
  padding: 36px;
}

.hero-badge {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
}

h1 {
  margin: 18px 0 14px;
  font-size: 38px;
  line-height: 1.15;
  color: #0f172a;
}

p {
  margin: 0;
  color: #475467;
  line-height: 1.8;
}

.tips {
  margin: 26px 0 0;
  padding-left: 18px;
  color: #334155;
  line-height: 2;
}

.form-card {
  padding: 28px;
}

.code-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}

.submit-btn {
  width: 100%;
  margin-top: 18px;
  height: 44px;
}

@media (max-width: 900px) {
  .login-panel {
    grid-template-columns: 1fr;
  }
}
</style>
