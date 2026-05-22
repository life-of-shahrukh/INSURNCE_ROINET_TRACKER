export class AuthApiError extends Error {
  statusCode: number;
  details?: string[];

  constructor(message: string, statusCode: number, details?: string[]) {
    super(message);
    this.name = "AuthApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface ErrorShape {
  statusCode?: number;
  message?: string | string[];
}

export function toAuthApiError(raw: unknown, fallbackStatus: number): AuthApiError {
  if (raw && typeof raw === "object") {
    const body = raw as ErrorShape;
    const statusCode = body.statusCode ?? fallbackStatus;
    if (Array.isArray(body.message)) {
      return new AuthApiError(
        body.message[0] ?? "Validation error",
        statusCode,
        body.message.filter((item) => typeof item === "string"),
      );
    }
    if (typeof body.message === "string") {
      return new AuthApiError(body.message, statusCode);
    }
  }

  return new AuthApiError("Something went wrong. Please try again.", fallbackStatus);
}

export function getFriendlyAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError) {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid credentials")) {
      return "Email or password is incorrect.";
    }
    if (msg.includes("email is already registered")) {
      return "This email already has an account. Please login instead.";
    }
    if (msg.includes("posp code is already in use")) {
      return "This POSP code is already used. Please choose a different code.";
    }
    if (msg.includes("posp email is already in use")) {
      return "This email is already linked to another POSP profile.";
    }
    if (msg.includes("duplicate email or posp code")) {
      return "Email or POSP code already exists. Please use unique values.";
    }
    if (msg.includes("not active")) {
      return "Your account is inactive. Please contact admin.";
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
