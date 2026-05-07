<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { merchantMenus } from "../config/menu";
import { useMerchantAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useMerchantAuthStore();
const menuOpen = ref(false);

const activePath = computed(() => String(route.meta.menuPath || route.path));
const visibleMenus = computed(() => merchantMenus.filter((item) => authStore.hasMenuAccess(item.path)));

function go(path: string) {
  router.push(path);
  menuOpen.value = false;
}

function handleLogout() {
  authStore.logout();
  router.replace("/login");
}
</script>

<template>
  <el-container class="layout-shell">
    <el-aside :class="['aside', { 'aside-open': menuOpen }]" width="248px">
      <div class="logo">校院通商家后台</div>
      <div class="store-card">
        <div class="store-name">{{ authStore.profile?.storeName || "-" }}</div>
        <div class="store-meta">{{ authStore.profile?.school || "-" }}</div>
      </div>
      <el-menu :default-active="activePath" class="menu" @select="go">
        <el-menu-item v-for="item in visibleMenus" :key="item.key" :index="item.path">
          {{ item.title }}
        </el-menu-item>
      </el-menu>
    </el-aside>

    <div v-if="menuOpen" class="mobile-mask" @click="menuOpen = false" />

    <el-container class="content-shell">
      <el-header class="header">
        <div class="header-main">
          <el-button class="menu-toggle" text @click="menuOpen = true">菜单</el-button>
          <div>
            <div class="page-title">{{ route.meta.title || "商家后台" }}</div>
            <div class="page-sub">手机号：{{ authStore.profile?.phone || "-" }}</div>
          </div>
        </div>
        <div class="header-right">
          <el-tag type="success">验证码登录</el-tag>
          <el-tag type="info">{{ authStore.profile?.storeStatus || "未知" }}</el-tag>
          <span class="account-name">{{ authStore.profile?.name || "-" }}</span>
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
  background: #f4f7fb;
}

.aside {
  background: #fff;
  border-right: 1px solid #e7edf6;
  transition: transform 0.2s ease;
  z-index: 20;
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
  word-break: break-word;
}

.store-meta {
  margin-top: 6px;
  font-size: 13px;
  color: #667085;
}

.menu {
  border-right: 0;
}

.content-shell {
  min-width: 0;
}

.header {
  min-height: 68px;
  height: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #eef2f7;
}

.header-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-toggle {
  display: none;
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
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.account-name {
  color: #334155;
}

.main {
  background: #f4f7fb;
  padding: 18px;
  overflow-x: hidden;
}

.mobile-mask {
  display: none;
}

@media (max-width: 900px) {
  .aside {
    position: fixed;
    inset: 0 auto 0 0;
    width: 248px;
    transform: translateX(-105%);
    box-shadow: 18px 0 40px rgba(15, 23, 42, 0.14);
  }

  .aside-open {
    transform: translateX(0);
  }

  .mobile-mask {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.32);
    z-index: 10;
  }

  .menu-toggle {
    display: inline-flex;
    padding-left: 0;
  }

  .layout-shell {
    display: block;
  }

  .header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-right {
    justify-content: flex-start;
  }

  .main {
    padding: 12px;
  }
}
</style>
