import { z } from "zod";

export const merchantSendCodeSchema = z.object({
  phone: z.string().trim().regex(/^1\d{10}$/, "请输入正确的手机号"),
  scene: z.enum(["login"]).optional().default("login")
});

export const merchantCodeLoginSchema = z.object({
  phone: z.string().trim().regex(/^1\d{10}$/, "请输入正确的手机号"),
  code: z.string().trim().regex(/^\d{6}$/, "请输入 6 位验证码")
});

export const merchantPasswordLoginSchema = z.object({
  phone: z.string().trim().regex(/^1\d{10}$/, "请输入正确的手机号"),
  password: z.string().trim().min(6, "密码至少 6 位").max(30, "密码最多 30 位")
});

export const merchantActivateSchema = z.object({
  password: z.string().trim().min(6, "密码至少 6 位").max(30, "密码最多 30 位")
});

export const merchantProfileUpdateSchema = z.object({
  name: z.string().trim().min(2, "姓名至少 2 个字").max(20, "姓名最多 20 个字")
});

export const merchantPasswordUpdateSchema = z.object({
  oldPassword: z.string().trim().min(6, "原密码至少 6 位").max(30, "原密码最多 30 位"),
  newPassword: z.string().trim().min(6, "新密码至少 6 位").max(30, "新密码最多 30 位")
});

export type MerchantSendCodePayload = z.infer<typeof merchantSendCodeSchema>;
export type MerchantCodeLoginPayload = z.infer<typeof merchantCodeLoginSchema>;
export type MerchantPasswordLoginPayload = z.infer<typeof merchantPasswordLoginSchema>;
export type MerchantActivatePayload = z.infer<typeof merchantActivateSchema>;
export type MerchantProfileUpdatePayload = z.infer<typeof merchantProfileUpdateSchema>;
export type MerchantPasswordUpdatePayload = z.infer<typeof merchantPasswordUpdateSchema>;
