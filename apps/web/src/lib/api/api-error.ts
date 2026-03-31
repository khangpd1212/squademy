export class ApiError extends Error {
  code?: string;
  status: number;

  constructor(opts: { message: string; code?: string; status: number }) {
    super(opts.message);
    this.name = "ApiError";
    this.code = opts.code;
    this.status = opts.status;
  }
}
