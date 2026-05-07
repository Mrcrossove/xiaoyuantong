<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { sendCodeApi } from "../../api/modules/merchant";
import { useMerchantAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useMerchantAuthStore();

const activeMode = ref<"password" | "code">("password");
const loading = ref(false);
const sending = ref(false);
const countdown = ref(0);
let countdownTimer: number | undefined;

const passwordForm = reactive({
  phone: "",
  password: ""
});

const codeForm = reactive({
  phone: "",
  code: ""
});

const redirectPath = computed(() => String(route.query.redirect || "/dashboard"));
const canSendCode = computed(() => /^1\d{10}$/.test(codeForm.phone) && countdown.value <= 0 && !sending.value);

function startCountdown() {
  countdown.value = 60;
  window.clearInterval(countdownTimer);
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      window.clearInterval(countdownTimer);
    }
  }, 1000);
}

function validatePhone(phone: string) {
  if (!/^1\d{10}$/.test(phone)) {
    ElMessage.warning("请输入正确的手机号");
    return false;
  }
  return true;
}

async function handlePasswordLogin() {
  if (!validatePhone(passwordForm.phone)) return;
  if (!passwordForm.password || passwordForm.password.length < 6) {
    ElMessage.warning("请输入至少 6 位密码");
    return;
  }

  loading.value = true;
  try {
    await authStore.loginByPassword({ phone: passwordForm.phone, password: passwordForm.password });
    ElMessage.success("登录成功");
    router.replace(redirectPath.value);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "登录失败");
  } finally {
    loading.value = false;
  }
}

async function handleSendCode() {
  if (!validatePhone(codeForm.phone)) return;

  sending.value = true;
  try {
    await sendCodeApi({ phone: codeForm.phone, scene: "login" });
    startCountdown();
    ElMessage.success("验证码已发送");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "验证码发送失败");
  } finally {
    sending.value = false;
  }
}

async function handleCodeLogin() {
  if (!validatePhone(codeForm.phone)) return;
  if (!/^\d{6}$/.test(codeForm.code)) {
    ElMessage.warning("请输入 6 位验证码");
    return;
  }

  loading.value = true;
  try {
    await authStore.loginByCode({ phone: codeForm.phone, code: codeForm.code });
    ElMessage.success("登录成功");
    router.replace(redirectPath.value);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "登录失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-panel">
      <section class="hero">
        <div class="hero-badge">校院通商家中心</div>
        <h1>用账号密码或验证码登录商家后台</h1>
        <p>
          店铺入驻申请审核通过后，平台会把商家后台地址、登录账号和初始密码发送到小程序消息中心。短信服务审核通过后，也可以使用手机号验证码登录。
        </p>
        <div class="flow-card">
          <div class="flow-item">
            <span>1</span>
            <strong>提交开店申请</strong>
            <em>申请手机号就是商家后台登录账号</em>
          </div>
          <div class="flow-item">
            <span>2</span>
            <strong>平台审核通过</strong>
            <em>小程序消息中心收到后台地址和初始密码</em>
          </div>
          <div class="flow-item">
            <span>3</span>
            <strong>进入商家后台</strong>
            <em>手机和电脑浏览器都可以使用</em>
          </div>
        </div>
      </section>

      <section class="form-card">
        <div class="form-title">
          <h2>商家登录</h2>
          <p>登录地址：https://xy-merchant.jpwlkj.com/merchant/</p>
        </div>

        <div class="login-tabs">
          <button :class="{ active: activeMode === 'password' }" type="button" @click="activeMode = 'password'">
            账号密码登录
          </button>
          <button :class="{ active: activeMode === 'code' }" type="button" @click="activeMode = 'code'">
            短信验证码登录
          </button>
        </div>

        <el-form v-if="activeMode === 'password'" label-position="top" @submit.prevent="handlePasswordLogin">
          <el-form-item label="登录手机号">
            <el-input
              v-model.trim="passwordForm.phone"
              maxlength="11"
              inputmode="numeric"
              size="large"
              placeholder="请输入开店申请联系人手机号"
            />
          </el-form-item>
          <el-form-item label="登录密码">
            <el-input
              v-model.trim="passwordForm.password"
              type="password"
              maxlength="30"
              show-password
              size="large"
              placeholder="请输入小程序消息收到的初始密码"
            />
          </el-form-item>
          <el-button class="submit-btn" type="primary" size="large" :loading="loading" @click="handlePasswordLogin">
            登录商家后台
          </el-button>
        </el-form>

        <el-form v-else label-position="top" @submit.prevent="handleCodeLogin">
          <el-form-item label="登录手机号">
            <el-input
              v-model.trim="codeForm.phone"
              maxlength="11"
              inputmode="numeric"
              size="large"
              placeholder="请输入开店申请联系人手机号"
            />
          </el-form-item>
          <el-form-item label="短信验证码">
            <div class="code-row">
              <el-input
                v-model.trim="codeForm.code"
                maxlength="6"
                inputmode="numeric"
                size="large"
                placeholder="请输入 6 位验证码"
              />
              <el-button size="large" :disabled="!canSendCode" :loading="sending" @click="handleSendCode">
                {{ countdown > 0 ? `${countdown}s` : "发送验证码" }}
              </el-button>
            </div>
          </el-form-item>
          <el-button class="submit-btn" type="primary" size="large" :loading="loading" @click="handleCodeLogin">
            登录商家后台
          </el-button>
        </el-form>

        <div class="login-help">
          如果提示账号不存在，请确认店铺申请已审核通过；如果暂时收不到短信，请先使用小程序消息里的账号和初始密码登录。
        </div>
      </section>
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
    radial-gradient(circle at 8% 12%, rgba(37, 99, 235, 0.18), transparent 30%),
    radial-gradient(circle at 92% 88%, rgba(14, 165, 233, 0.2), transparent 28%),
    linear-gradient(135deg, #f8fbff 0%, #eef5ff 45%, #f7f9fc 100%);
}

.login-panel {
  width: min(1120px, 100%);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 24px;
  align-items: stretch;
}

.hero,
.form-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(219, 234, 254, 0.95);
  border-radius: 28px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
}

.hero {
  padding: 38px;
}

.hero-badge {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 800;
}

h1 {
  margin: 20px 0 16px;
  font-size: clamp(30px, 4vw, 46px);
  line-height: 1.12;
  color: #0f172a;
  letter-spacing: -0.04em;
}

.hero p,
.form-title p,
.login-help {
  margin: 0;
  color: #475467;
  line-height: 1.8;
}

.flow-card {
  display: grid;
  gap: 14px;
  margin-top: 28px;
}

.flow-item {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 4px 12px;
  padding: 14px;
  border-radius: 18px;
  background: #f8fbff;
  border: 1px solid #e5eefb;
}

.flow-item span {
  grid-row: span 2;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #2563eb;
  color: #fff;
  font-weight: 800;
}

.flow-item strong {
  color: #111827;
}

.flow-item em {
  font-style: normal;
  color: #667085;
  font-size: 13px;
}

.form-card {
  padding: 30px;
  align-self: center;
}

.form-title {
  margin-bottom: 20px;
}

.form-title h2 {
  margin: 0 0 8px;
  font-size: 26px;
  color: #111827;
}

.login-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 6px;
  margin-bottom: 20px;
  border-radius: 16px;
  background: #f1f5f9;
}

.login-tabs button {
  border: 0;
  border-radius: 12px;
  padding: 11px 8px;
  background: transparent;
  color: #64748b;
  font-weight: 800;
  cursor: pointer;
}

.login-tabs button.active {
  background: #fff;
  color: #1d4ed8;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.code-row {
  display: grid;
  grid-template-columns: 1fr 132px;
  gap: 12px;
  width: 100%;
}

.submit-btn {
  width: 100%;
  margin-top: 12px;
  height: 46px;
  font-weight: 700;
}

.login-help {
  margin-top: 18px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f8fafc;
  font-size: 13px;
}

@media (max-width: 900px) {
  .login-page {
    padding: 18px;
    place-items: start center;
  }

  .login-panel {
    grid-template-columns: 1fr;
  }

  .hero,
  .form-card {
    border-radius: 22px;
  }

  .hero {
    padding: 24px;
  }

  .form-card {
    padding: 22px;
  }
}

@media (max-width: 520px) {
  .login-page {
    padding: 12px;
  }

  .hero {
    display: none;
  }

  .login-tabs,
  .code-row {
    grid-template-columns: 1fr;
  }
}
</style>
