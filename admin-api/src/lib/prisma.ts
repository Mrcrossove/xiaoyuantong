import { PrismaClient } from "@prisma/client";

// Prisma 新增模型后，当前本地类型缓存偶发不同步，先放宽实例类型保证开发不中断。
export const prisma: any = new PrismaClient();
