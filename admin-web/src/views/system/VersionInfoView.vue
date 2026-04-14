<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { VersionInfo } from "../../api/contracts";
import { getVersionInfoApi } from "../../api/modules/system";

const loading = ref(false);
const info = ref<VersionInfo>({
  currentVersion: "-",
  env: "-",
  buildTime: "-",
  latestRelease: "-",
  changelog: []
});

async function loadData() {
  loading.value = true;
  try {
    info.value = (await getVersionInfoApi()) as VersionInfo;
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="16">
      <el-col :span="6"><el-card shadow="never"><div class="label">当前版本</div><div class="value">{{ info.currentVersion }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="never"><div class="label">运行环境</div><div class="value">{{ info.env }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="never"><div class="label">构建时间</div><div class="value">{{ info.buildTime }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="never"><div class="label">最新发布</div><div class="value">{{ info.latestRelease }}</div></el-card></el-col>
    </el-row>
    <el-card shadow="never">
      <template #header>版本更新记录</template>
      <el-timeline>
        <el-timeline-item v-for="item in info.changelog" :key="item.version + item.date" :timestamp="item.date" placement="top">
          <el-card shadow="never">
            <div class="log-title">{{ item.version }}</div>
            <div class="log-content">{{ item.content }}</div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 16px; }
.label { color: #667085; font-size: 14px; }
.value { margin-top: 8px; font-size: 22px; font-weight: 700; }
.log-title { font-weight: 700; color: #111827; }
.log-content { margin-top: 6px; color: #667085; line-height: 1.7; }
</style>
