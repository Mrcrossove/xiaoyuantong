<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { PostStatResult } from "../../api/modules/stat";
import { getPostStatApi } from "../../api/modules/stat";

const loading = ref(false);
const data = ref<PostStatResult>({ cards: [], categoryRank: [] });

async function loadData() {
  loading.value = true;
  try {
    data.value = await getPostStatApi();
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
      <template #header>帖子分类热度排行</template>
      <el-table :data="data.categoryRank" stripe>
        <el-table-column prop="name" label="分类" min-width="180" />
        <el-table-column prop="value" label="帖子数" width="140" />
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
