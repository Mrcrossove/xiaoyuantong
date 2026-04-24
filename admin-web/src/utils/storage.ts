const TOKEN_KEY = "campus_admin_token";
const PROFILE_KEY = "campus_admin_profile";
const PERMISSIONS_KEY = "campus_admin_permissions";
const MENU_PATHS_KEY = "campus_admin_menu_paths";

export interface SessionProfile {
  id: number;
  roleId: number;
  name: string;
  account: string;
  roleCode: string;
  roleName: string;
  scopeType: "all" | "assigned";
  schools: string[];
  mustChangePassword?: boolean;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function setProfile(profile: SessionProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getProfile(): SessionProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? (JSON.parse(raw) as SessionProfile) : null;
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

export function setPermissions(list: string[]) {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(list));
}

export function getPermissions() {
  const raw = localStorage.getItem(PERMISSIONS_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function clearPermissions() {
  localStorage.removeItem(PERMISSIONS_KEY);
}

export function setMenuPaths(paths: string[]) {
  localStorage.setItem(MENU_PATHS_KEY, JSON.stringify(paths));
}

export function getMenuPaths() {
  const raw = localStorage.getItem(MENU_PATHS_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function clearMenuPaths() {
  localStorage.removeItem(MENU_PATHS_KEY);
}

export function clearSession() {
  clearToken();
  clearProfile();
  clearPermissions();
  clearMenuPaths();
}
