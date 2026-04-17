<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { merchantMenus } from "../config/menu";
import { useMerchantAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useMerchantAuthStore();

const activePath = computed(() => String(route.meta.menuPath || route.path));
const visibleMenus = computed(() => merchantMenus.filter((item) => authStore.hasMenuAccess(item.path)));

function handleLogout() {
  authStore.logout();
  router.replace("/login");
}
</script>

<template>
  <el-container class="layout-shell">
    <el-aside width="240px" class="aside">
      <div class="logo">校园通商家后台</div>
      <div class="store-card">
        <div class="store-name">{{ authStore.profile?.storeName || "-" }}</div>
        <div class="store-meta">{{ authStore.profile?.school || "-" }}</div>
      </div>
      <el-menu :default-active="activePath" class="menu" @select="router.push">
        <el-menu-item v-for="item in visibleMenus" :key="item.key" :index="item.path">
          {{ item.title }}
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div>
          <div class="page-title">{{ route.meta.title || "商家后台" }}</div>
          <div class="page-sub">手机号：{{ authStore.profile?.phone || "-" }}</div>
        </div>
        <div class="header-right">
          <el-tag :type="authStore.profile?.isActivated ? 'success' : 'warning'">
            {{ authStore.profile?.isActivated ? "已激活" : "待激活" }}
          </el-tag>
          <el-tag type="info">{{ authStore.profile?.storeStatus || "未知" }}</el-tag>
          <span>{{ authStore.profile?.name || "-" }}</span>
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
  background: #fff;
  border-right: 1px solid #e7edf6;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 20px;
  font-weight: 800;
  color: #1d4ed8;
  border-bottom: 1px solid #eef2f7;
}

.store-card {
  margin: 16px;
  padding: 14px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eff6ff, #f8fbff);
  border: 1px solid #dbeafe;
}

.store-name {
  font-weight: 700;
  color: #111827;
}

.store-meta {
  margin-top: 6px;
  font-size: 13px;
  color: #667085;
}

.menu {
  border-right: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #eef2f7;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.page-sub {
  margin-top: 4px;
  color: #667085;
  font-size: 13px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main {
  background: #f4f7fb;
}
</style>
