import { NextResponse } from "next/server";
import { AppError, ValidationError } from "@/lib/errors/app-errors";
import { ZodError } from "zod";

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  fields?: Record<string, string[]>;
}

/**
 * Handle API errors and return standardized responses
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Log error for debugging (in production, use proper logging service)
  console.error("API Error:", error);

  // Handle Zod validation errors (Zod v4 uses .issues)
  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    const issues = (error as ZodError & { issues: Array<{ path: (string | number)[]; message: string }> }).issues ?? [];
    issues.forEach((err) => {
      const path = err.path.join(".");
      if (!fields[path]) {
        fields[path] = [];
      }
      fields[path].push(err.message);
    });

    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        fields,
      },
      { status: 400 }
    );
  }

  // Handle custom app errors
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code,
    };

    if (error instanceof ValidationError && error.fields) {
      response.fields = error.fields;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle unknown errors
  // In production, don't expose internal error details
  const isDevelopment = process.env.NODE_ENV === "development";
  return NextResponse.json(
    {
      error: isDevelopment
        ? error instanceof Error
          ? error.message
          : "Internal server error"
        : "Internal server error",
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}
