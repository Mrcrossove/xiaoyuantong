export function normalizeAdminPermissions(codes: string[]) {
  const normalized = Array.from(new Set(codes.map((item) => String(item).trim()).filter(Boolean)));

  if (normalized.includes("*")) {
    return ["*"];
  }

  const expanded = new Set<string>();

  normalized.forEach((code) => {
    if (code === "verify:review") {
      expanded.add("verify:approve");
      expanded.add("verify:reject");
      return;
    }

    if (code === "store:apply:review") {
      expanded.add("store:apply:approve");
      expanded.add("store:apply:reject");
      return;
    }

    if (code === "store:apply") {
      expanded.add("store:apply:view");
      expanded.add("store:apply:approve");
      expanded.add("store:apply:reject");
      return;
    }

    expanded.add(code);
  });

  return Array.from(expanded);
}
