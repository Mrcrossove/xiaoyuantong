declare namespace Express {
  interface Request {
    traceId: string;
    rawBody?: string;
    adminAuth?: {
      userId: number;
      roleCode: string;
      permissions?: string[];
      menuPaths?: string[];
      isSuperAdmin?: boolean;
    };
    miniAuth?: {
      userId: number;
      deviceId: string;
    };
    merchantAuth?: {
      accountId: number;
      miniUserId: number;
      storeId: number;
      phone: string;
      permissions?: string[];
      menuPaths?: string[];
    };
  }
}
