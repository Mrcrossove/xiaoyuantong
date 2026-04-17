const TOKEN_KEY = "campus_merchant_token";
const PROFILE_KEY = "campus_merchant_profile";
const MENU_PATHS_KEY = "campus_merchant_menu_paths";
const PERMISSIONS_KEY = "campus_merchant_permissions";

export interface MerchantProfile {
  id: number;
  phone: string;
  name: string;
  status: string;
  isActivated: boolean;
  storeId: number;
  storeDetailId: string;
  storeName: string;
  school: string;
  storeStatus: string;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setProfile(profile: MerchantProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? (JSON.parse(raw) as MerchantProfile) : null;
}

export function setMenuPaths(paths: string[]) {
  localStorage.setItem(MENU_PATHS_KEY, JSON.stringify(paths));
}

export function getMenuPaths() {
  const raw = localStorage.getItem(MENU_PATHS_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function setPermissions(list: string[]) {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(list));
}

export function getPermissions() {
  const raw = localStorage.getItem(PERMISSIONS_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(MENU_PATHS_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
}
