import crypto from "crypto";

const HASH_PREFIX = "scrypt";
const KEY_LENGTH = 64;

function normalizePassword(value: string) {
  return String(value || "").trim();
}

export function isPasswordHashed(value: string | null | undefined) {
  return String(value || "").startsWith(`${HASH_PREFIX}$`);
}

export function hashPassword(rawPassword: string) {
  const password = normalizePassword(rawPassword);
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${HASH_PREFIX}$${salt}$${derived}`;
}

export function verifyPassword(rawPassword: string, storedPassword: string | null | undefined) {
  const password = normalizePassword(rawPassword);
  const normalizedStored = String(storedPassword || "");

  if (!normalizedStored) {
    return false;
  }

  if (!isPasswordHashed(normalizedStored)) {
    const left = Buffer.from(password);
    const right = Buffer.from(normalizedStored);
    if (left.length !== right.length) {
      return false;
    }
    return crypto.timingSafeEqual(left, right);
  }

  const [, salt, expectedHash] = normalizedStored.split("$");
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}
