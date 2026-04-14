<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { adminMenus } from "../config/menu";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const activePath = computed(() => route.path);

const visibleMenus = computed(() =>
  adminMenus
    .map((group) => ({
      ...group,
      children: (group.children ?? []).filter((item) => (item.path ? authStore.hasMenuAccess(item.path) : true))
    }))
    .filter((group) => group.children.length > 0)
);

function handleSelect(path: string) {
  router.push(path);
}

function handleLogout() {
  authStore.logout();
  router.replace("/login");
}
</script>

<template>
  <el-container class="layout-shell">
    <el-aside width="248px" class="aside">
      <div class="logo">校园通后台</div>
      <el-menu :default-active="activePath" class="menu" unique-opened @select="handleSelect">
        <el-sub-menu v-for="group in visibleMenus" :key="group.key" :index="group.key">
          <template #title>{{ group.title }}</template>
          <el-menu-item v-for="item in group.children" :key="item.key" :index="item.path!">
            {{ item.title }}
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="page-name">{{ route.meta.title || "校园通管理后台" }}</div>
        <div class="header-right">
          <el-tag type="success">{{ authStore.profile?.roleName || "未登录" }}</el-tag>
          <el-tag type="info">数据范围：{{ authStore.schoolScopeLabel }}</el-tag>
          <span class="admin-name">{{ authStore.profile?.name || "-" }}</span>
          <el-button link type="danger" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-shell {
  min-height: 100vh;
}

.aside {
  border-right: 1px solid #eaeef5;
  background: #ffffff;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 20px;
  font-weight: 800;
  color: #2f68e3;
  border-bottom: 1px solid #eef2f7;
}

.menu {
  border-right: 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 1px solid #eef2f7;
}

.page-name {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.admin-name {
  color: #667085;
}

.main {
  background: #f5f7fb;
}
</style>
