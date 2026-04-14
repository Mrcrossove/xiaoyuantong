declare namespace Express {
  interface Request {
    traceId: string;
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
  }
}
