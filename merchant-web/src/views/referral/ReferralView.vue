<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { getReferralOverviewApi } from "../../api/modules/merchant";

const loading = ref(false);
const data = ref<any>({
  store: {},
  scene: "",
  page: "",
  miniCode: {},
  summary: {},
  recentUsers: []
});

const qrImage = computed(() => data.value?.miniCode?.dataUrl || "");
const summary = computed(() => data.value?.summary || {});

async function loadData() {
  loading.value = true;
  try {
    data.value = await getReferralOverviewApi();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "推广数据加载失败");
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page referral-page" v-loading="loading">
    <el-row :gutter="16">
      <el-col :xs="24" :lg="10">
        <el-card class="qr-card">
          <template #header>
            <div class="section-title">专属小程序码</div>
          </template>
          <div class="qr-wrap">
            <img v-if="qrImage" class="qr-image" :src="qrImage" alt="商家专属小程序码" />
            <el-empty v-else description="暂无小程序码" />
          </div>
          <div class="store-name">{{ data.store?.name || "-" }}</div>
          <div class="store-meta">{{ data.store?.school || "-" }}</div>
          <div class="scene-box">
            <span>推广码</span>
            <strong>{{ data.scene || "-" }}</strong>
          </div>
          <el-alert
            v-if="data.miniCode?.mocked"
            class="mock-alert"
            type="warning"
            show-icon
            :closable="false"
            title="当前为测试二维码占位。服务器配置真实 WECHAT_APP_ID、WECHAT_APP_SECRET，并关闭 WECHAT_USE_MOCK 后会生成微信小程序码。"
          />
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="14">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-card shadow="hover">
              <div class="metric-label">累计扫码授权用户</div>
              <div class="metric-value">{{ summary.totalCount || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-card shadow="hover">
              <div class="metric-label">可计费人数</div>
              <div class="metric-value">{{ summary.billableCount || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-card shadow="hover">
              <div class="metric-label">单价</div>
              <div class="metric-value">¥{{ summary.unitPrice ?? "1.00" }}</div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-card shadow="hover">
              <div class="metric-label">预估费用</div>
              <div class="metric-value">¥{{ summary.estimatedAmount || 0 }}</div>
            </el-card>
          </el-col>
        </el-row>

        <el-card>
          <template #header>
            <div class="section-title">最近授权用户</div>
          </template>
          <el-table :data="data.recentUsers || []" empty-text="暂无获客记录">
            <el-table-column prop="nickname" label="用户" min-width="140" />
            <el-table-column prop="school" label="学校" min-width="140" />
            <el-table-column label="计费" width="100">
              <template #default="{ row }">
                <el-tag :type="row.billable ? 'success' : 'info'">{{ row.billable ? "计费" : "不计费" }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
            <el-table-column prop="firstLoginAt" label="授权时间" min-width="170" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.referral-page {
  align-items: start;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
}

.qr-card {
  min-height: 100%;
}

.qr-wrap {
  display: grid;
  place-items: center;
  min-height: 260px;
}

.qr-image {
  width: min(260px, 80vw);
  height: min(260px, 80vw);
  object-fit: contain;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.store-name {
  margin-top: 16px;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  text-align: center;
}

.store-meta {
  margin-top: 6px;
  color: #667085;
  text-align: center;
}

.scene-box {
  margin-top: 16px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #667085;
}

.scene-box strong {
  color: #111827;
  word-break: break-all;
}

.mock-alert {
  margin-top: 16px;
}
</style>
