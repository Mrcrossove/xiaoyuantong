import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { activateApi, codeLoginApi, getSessionApi, passwordLoginApi, type MerchantSessionResponse } from "../api/modules/merchant";
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
  type MerchantProfile
} from "../utils/storage";

export const useMerchantAuthStore = defineStore("merchant-auth", () => {
  const token = ref(getToken());
  const profile = ref<MerchantProfile | null>(getProfile());
  const menuPaths = ref<string[]>(getMenuPaths());
  const permissions = ref<string[]>(getPermissions());

  const isLogin = computed(() => Boolean(token.value));
  const needActivate = computed(() => Boolean(profile.value) && !profile.value!.isActivated);

  function applySession(result: MerchantSessionResponse, nextToken?: string) {
    if (nextToken) {
      token.value = nextToken;
      setToken(nextToken);
    }
    profile.value = result.profile;
    menuPaths.value = result.menuPaths || [];
    permissions.value = result.permissions || [];
    setProfile(result.profile);
    setMenuPaths(result.menuPaths || []);
    setPermissions(result.permissions || []);
  }

  async function loginByCode(payload: { phone: string; code: string }) {
    const result = await codeLoginApi(payload);
    applySession(result, result.token);
    return result;
  }

  async function loginByPassword(payload: { phone: string; password: string }) {
    const result = await passwordLoginApi(payload);
    applySession(result, result.token);
    return result;
  }

  async function refreshSession() {
    if (!token.value) return;
    const result = await getSessionApi();
    applySession(result);
    return result;
  }

  async function activate(password: string) {
    const result = await activateApi({ password });
    applySession(result);
    return result;
  }

  function hasMenuAccess(path: string) {
    return menuPaths.value.includes(path);
  }

  function hasPermission(code: string) {
    return permissions.value.includes("*") || permissions.value.includes(code);
  }

  function logout() {
    token.value = "";
    profile.value = null;
    menuPaths.value = [];
    permissions.value = [];
    clearSession();
  }

  return {
    token,
    profile,
    menuPaths,
    permissions,
    isLogin,
    needActivate,
    loginByCode,
    loginByPassword,
    refreshSession,
    activate,
    hasMenuAccess,
    hasPermission,
    logout
  };
});
