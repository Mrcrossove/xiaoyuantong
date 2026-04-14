export class ApiError extends Error {
  status: number;
  code: number;

  constructor(message: string, code: number, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
