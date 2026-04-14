import type { Directive } from "vue";
import { useAuthStore } from "../stores/auth";

export const permissionDirective: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const authStore = useAuthStore();
    const required = Array.isArray(binding.value) ? binding.value : [binding.value];
    const allowed = required.some((code) => authStore.hasPermission(code));
    if (!allowed) el.style.display = "none";
  }
};
