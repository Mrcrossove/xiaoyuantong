<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { UserStatResult } from "../../api/modules/stat";
import { getUserStatApi } from "../../api/modules/stat";

const loading = ref(false);
const data = ref<UserStatResult>({ cards: [], schoolRank: [] });

async function loadData() {
  loading.value = true;
  try {
    data.value = await getUserStatApi();
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="16">
      <el-col v-for="item in data.cards" :key="item.label" :span="8">
        <el-card shadow="never">
          <div class="label">{{ item.label }}</div>
          <div class="value">{{ item.value }}</div>
          <div class="trend">{{ item.trend }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-card shadow="never">
      <template #header>高校用户排行</template>
      <el-table :data="data.schoolRank" stripe>
        <el-table-column prop="school" label="高校" min-width="180" />
        <el-table-column prop="value" label="用户数" width="140" />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 16px; }
.label { color: #667085; font-size: 14px; }
.value { font-size: 30px; margin-top: 8px; font-weight: 700; }
.trend { color: #16a34a; margin-top: 8px; }
</style>
