<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, type TreeInstance } from "element-plus";
import type { AdminRoleItem, AuthManageMeta, MenuTreeNode } from "../../api/contracts";
import { ApiRequestError } from "../../api/request";
import { getAdminRoleListApi, getAuthManageMetaApi, updateRolePermissionApi } from "../../api/modules/auth-manage";
import { useAuthStore } from "../../stores/auth";

interface MenuTreeOption extends MenuTreeNode {
  nodeId: string;
  children?: MenuTreeOption[];
}

const loading = ref(false);
const submitting = ref(false);
const treeRef = ref<TreeInstance>();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const meta = ref<AuthManageMeta>({
  currentRoleId: 0,
  currentRoleCode: "",
  currentRoleName: "",
  schoolOptions: [],
  roleOptions: [],
  menuTree: [],
  permissionGroups: []
});
const roles = ref<AdminRoleItem[]>([]);
const currentRoleId = ref(0);
const checkedPermissions = ref<string[]>([]);
const menuTree = ref<MenuTreeOption[]>([]);

const currentRole = computed(() => roles.value.find((item) => item.id === currentRoleId.value));
const saveDisabled = computed(() => !currentRole.value || currentRole.value.code === "super_admin");

function showApiError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    ElMessage.error(error.traceId ? `${error.message}（追踪号: ${error.traceId}）` : error.message);
    return;
  }
  if (error instanceof Error) {
    ElMessage.error(error.message);
    return;
  }
  ElMessage.error(fallback);
}

function normalizeTree(nodes: MenuTreeNode[]): MenuTreeOption[] {
  return nodes.map((item) => ({
    ...item,
    nodeId: item.path || `group:${item.key}`,
    children: item.children ? normalizeTree(item.children) : undefined
  }));
}

async function syncRoleSelection() {
  await nextTick();
  treeRef.value?.setCheckedKeys(currentRole.value?.menuPaths || []);
  checkedPermissions.value = [...(currentRole.value?.permissionsList || [])];
}

async function loadData() {
  loading.value = true;
  try {
    const [metaResult, roleResult] = await Promise.all([
      getAuthManageMetaApi(),
      getAdminRoleListApi({ page: 1, pageSize: 500, keyword: "", status: "" })
    ]);
    meta.value = metaResult;
    roles.value = roleResult.list;
    menuTree.value = normalizeTree(metaResult.menuTree);
    currentRoleId.value = roles.value.some((item) => item.id === metaResult.currentRoleId)
      ? metaResult.currentRoleId
      : roles.value[0]?.id || 0;
    await syncRoleSelection();
  } catch (error) {
    showApiError(error, "菜单权限数据加载失败");
  } finally {
    loading.value = false;
  }
}

async function handleRoleChange(roleId: number) {
  currentRoleId.value = roleId;
  await syncRoleSelection();
}

function getCheckedMenuPaths() {
  const nodes = treeRef.value?.getCheckedNodes(false, true) as MenuTreeOption[] | undefined;
  return (nodes || []).map((item) => item.path).filter((item): item is string => Boolean(item));
}

async function refreshCurrentSessionIfNeeded(targetRoleId: number) {
  if (targetRoleId !== authStore.profile?.roleId) return false;
  await authStore.refreshSession();
  const menuPath = String(route.meta.menuPath || route.path);
  if (!authStore.hasMenuAccess(menuPath)) {
    ElMessage.warning("当前账号权限已更新，已返回可访问页面");
    await router.replace("/dashboard/overview");
    return true;
  }
  return false;
}

async function handleSave() {
  if (!currentRole.value) return;
  submitting.value = true;
  try {
    const targetRoleId = currentRole.value.id;
    await updateRolePermissionApi(targetRoleId, {
      menuPaths: getCheckedMenuPaths(),
      permissionsList: checkedPermissions.value
    });
    ElMessage.success("角色菜单权限已保存");
    const redirected = await refreshCurrentSessionIfNeeded(targetRoleId);
    if (redirected) {
      return;
    }
    await loadData();
    currentRoleId.value = targetRoleId;
    await syncRoleSelection();
  } catch (error) {
    showApiError(error, "菜单权限保存失败");
  } finally {
    submitting.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="16">
      <el-col :span="6"><el-card shadow="never"><div class="metric-label">角色数量</div><div class="metric-value">{{ roles.length }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="never"><div class="metric-label">当前角色</div><div class="metric-value small">{{ meta.currentRoleName || "-" }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="never"><div class="metric-label">菜单总数</div><div class="metric-value">{{ menuTree.length }}</div></el-card></el-col>
      <el-col :span="6"><el-card shadow="never"><div class="metric-label">按钮组数</div><div class="metric-value">{{ meta.permissionGroups.length }}</div></el-card></el-col>
    </el-row>

    <div class="content-grid">
      <el-card shadow="never" class="role-panel">
        <template #header>角色选择</template>
        <div class="role-list">
          <div
            v-for="item in roles"
            :key="item.id"
            :class="['role-item', { active: item.id === currentRoleId }]"
            @click="handleRoleChange(item.id)"
          >
            <div class="role-head">
              <span class="role-name">{{ item.name }}</span>
              <el-tag size="small" :type="item.status === '启用' ? 'success' : 'info'">{{ item.status }}</el-tag>
            </div>
            <div class="role-meta">{{ item.code }} · {{ item.scopeType }}</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="permission-panel">
        <template #header>菜单权限</template>
        <div class="role-summary" v-if="currentRole">
          <el-tag>{{ currentRole.name }}</el-tag>
          <el-tag type="info">{{ currentRole.scopeType }}</el-tag>
          <span class="summary-text">已关联管理员 {{ currentRole.userCount }} 人</span>
        </div>

        <el-tree
          ref="treeRef"
          :data="menuTree"
          node-key="nodeId"
          show-checkbox
          default-expand-all
          :props="{ label: 'title', children: 'children' }"
          class="menu-tree"
        />

        <div class="permission-group" v-for="group in meta.permissionGroups" :key="group.key">
          <div class="group-title">{{ group.title }}</div>
          <el-checkbox-group v-model="checkedPermissions" class="group-list">
            <el-checkbox v-for="item in group.permissions" :key="item.code" :label="item.code">{{ item.title }}</el-checkbox>
          </el-checkbox-group>
        </div>

        <div class="footer-actions">
          <el-button v-permission="'auth:menu:edit'" type="primary" :disabled="saveDisabled" :loading="submitting" @click="handleSave">
            保存权限
          </el-button>
          <span class="hint" v-if="currentRole?.code === 'super_admin'">超级管理员角色为系统保留角色，不支持在线修改。</span>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}
.metric-label {
  color: #667085;
  font-size: 14px;
}
.metric-value {
  margin-top: 12px;
  font-size: 30px;
  font-weight: 700;
}
.metric-value.small {
  font-size: 22px;
}
.content-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
}
.role-panel,
.permission-panel {
  min-height: 640px;
}
.role-list {
  display: grid;
  gap: 12px;
}
.role-item {
  padding: 12px;
  border: 1px solid #e4e7ec;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.role-item.active {
  border-color: #2563eb;
  background: #eff6ff;
}
.role-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.role-name {
  font-weight: 600;
  color: #111827;
}
.role-meta {
  margin-top: 8px;
  color: #667085;
  font-size: 13px;
}
.role-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.summary-text {
  color: #667085;
}
.menu-tree {
  padding: 12px 0;
  border-top: 1px solid #f2f4f7;
  border-bottom: 1px solid #f2f4f7;
}
.permission-group {
  margin-top: 20px;
}
.group-title {
  margin-bottom: 12px;
  font-weight: 600;
  color: #111827;
}
.group-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
}
.footer-actions {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.hint {
  color: #98a2b3;
}
</style>
