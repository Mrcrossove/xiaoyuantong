<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { DashboardCardItem, DashboardRankingItem, DashboardTodoItem } from "../../api/contracts";
import { getDashboardOverviewApi } from "../../api/modules/dashboard";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const cards = ref<DashboardCardItem[]>([]);
const todos = ref<DashboardTodoItem[]>([]);
const rankings = ref<DashboardRankingItem[]>([]);

const boardTitle = computed(() => (authStore.profile?.roleCode === "school_admin" ? "校园运营看板" : "平台数据看板"));
const rankingTitle = computed(() => (authStore.profile?.scopeType === "assigned" ? "当前高校数据概览" : "高校数据排行"));

async function loadData() {
  loading.value = true;
  try {
    const result = await getDashboardOverviewApi();
    cards.value = result.cards;
    todos.value = result.todos;
    rankings.value = result.rankings;
  } finally {
    loading.value = false;
  }
}

function handleTodoClick(path: string) {
  router.push(path);
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <el-card shadow="never" class="intro-card">
      <div class="intro-title">{{ boardTitle }}</div>
      <div class="intro-desc">
        {{ authStore.schoolScopeLabel === "全部高校" ? "当前展示平台整体经营数据。" : `当前仅展示 ${authStore.schoolScopeLabel} 的数据范围。` }}
      </div>
    </el-card>

    <el-row :gutter="16">
      <el-col v-for="item in cards" :key="item.key" :span="6">
        <el-card shadow="hover" class="metric-card">
          <div class="label">{{ item.label }}</div>
          <div class="value">{{ item.value }}</div>
          <div class="remark">{{ item.remark }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>待处理事项</template>
          <div class="todo-list">
            <button v-for="item in todos" :key="item.key" class="todo-item" type="button" @click="handleTodoClick(item.path)">
              <span>{{ item.label }}</span>
              <el-tag :type="item.count > 0 ? 'warning' : 'success'">{{ item.count }}</el-tag>
            </button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>{{ rankingTitle }}</template>
          <el-table :data="rankings" stripe>
            <el-table-column prop="school" label="高校" min-width="180" />
            <el-table-column prop="userCount" label="用户数" width="100" />
            <el-table-column prop="postCount" label="帖子数" width="100" />
            <el-table-column prop="storeCount" label="店铺数" width="100" />
            <el-table-column prop="orderCount" label="订单数" width="100" />
            <el-table-column label="交易额" width="120">
              <template #default="{ row }">￥{{ row.gmv.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="verifyPassRate" label="认证通过率" width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}
.intro-card {
  border: none;
  background: linear-gradient(135deg, #f8fbff 0%, #eef5ff 100%);
}
.intro-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
.intro-desc {
  margin-top: 8px;
  color: #667085;
}
.metric-card .label {
  color: #667085;
  font-size: 14px;
}
.metric-card .value {
  margin-top: 14px;
  font-size: 32px;
  font-weight: 700;
  color: #111827;
}
.metric-card .remark {
  margin-top: 12px;
  color: #667085;
  line-height: 1.8;
}
.todo-list {
  display: grid;
  gap: 12px;
}
.todo-item {
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.todo-item:hover {
  border-color: #2f68e3;
  transform: translateY(-1px);
}
</style>
