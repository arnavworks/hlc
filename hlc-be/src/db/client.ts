import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { requireDatabaseConfig } from "../config.js";
import * as schema from "./schema.js";

const connection = requireDatabaseConfig();

export const turso = createClient({
  url: connection.url,
  authToken: connection.authToken,
});

export const db = drizzle(turso, { schema });

const toErrorMessage = (value: unknown): string => {
  if (value instanceof Error) return value.message;
  return String(value);
};

export const isDatabaseAuthError = (error: unknown): boolean => {
  const message = toErrorMessage(error).toLowerCase();
  if (message.includes("http status 401") || message.includes("status 401")) {
    return true;
  }

  if (typeof error === "object" && error !== null) {
    const maybeCode = Reflect.get(error, "code");
    if (maybeCode === "SERVER_ERROR") {
      const cause = Reflect.get(error, "cause");
      const causeMessage = toErrorMessage(cause).toLowerCase();
      if (causeMessage.includes("http status 401") || causeMessage.includes("status 401")) {
        return true;
      }
    }
  }

  return false;
};

export const checkDatabase = async (): Promise<void> => {
  try {
    await turso.execute("SELECT 1 AS ok");
  } catch (error) {
    if (isDatabaseAuthError(error)) {
      throw new Error(
        "Turso authentication failed (401). Verify TURSO_DATABASE_URL and TURSO_AUTH_TOKEN belong to the same database and token is still valid.",
      );
    }
    throw error;
  }
};

export const closeDatabase = (): void => {
  turso.close();
};
