import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { activateAdminApi, getAdminSessionApi, loginApi, type AdminSessionResponse } from "../api/modules/auth";
import {
  clearSession,
  getMenuPaths,
  getPermissions,
  getProfile,
  getToken,
  setMenuPaths,
  setPermissions,
  setProfile,
  setToken,
  type SessionProfile
} from "../utils/storage";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(getToken());
  const profile = ref<SessionProfile | null>(getProfile());
  const permissions = ref<string[]>(getPermissions());
  const menuPaths = ref<string[]>(getMenuPaths());

  const isLogin = computed(() => Boolean(token.value));
  const isSuperAdmin = computed(() => profile.value?.roleCode === "super_admin");
  const mustChangePassword = computed(() => Boolean(profile.value?.mustChangePassword));
  const schoolScopeLabel = computed(() =>
    !profile.value ? "-" : profile.value.scopeType === "all" ? "全部高校" : profile.value.schools.join("、")
  );

  function hasPermission(code: string) {
    return isSuperAdmin.value || permissions.value.includes(code);
  }

  function hasMenuAccess(path: string) {
    return isSuperAdmin.value || menuPaths.value.includes(path);
  }

  function applySession(result: AdminSessionResponse, nextToken?: string) {
    if (nextToken) {
      token.value = nextToken;
      setToken(nextToken);
    }
    profile.value = result.profile;
    permissions.value = result.permissions;
    menuPaths.value = result.menuPaths;
    setProfile(result.profile);
    setPermissions(result.permissions);
    setMenuPaths(result.menuPaths);
  }

  async function login(payload: { account: string; password: string }) {
    const result = await loginApi(payload);
    applySession(result, result.token);
  }

  async function refreshSession() {
    if (!token.value) return;
    const result = await getAdminSessionApi();
    applySession(result);
    return result;
  }

  async function activate(password: string) {
    const result = await activateAdminApi({ password });
    applySession(result);
    return result;
  }

  function logout() {
    token.value = "";
    profile.value = null;
    permissions.value = [];
    menuPaths.value = [];
    clearSession();
  }

  return {
    token,
    profile,
    permissions,
    menuPaths,
    isLogin,
    isSuperAdmin,
    mustChangePassword,
    schoolScopeLabel,
    hasPermission,
    hasMenuAccess,
    login,
    refreshSession,
    activate,
    logout
  };
});
