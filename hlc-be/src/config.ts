import "dotenv/config";

const parsePort = (value: string | undefined): number => {
  const parsed = Number(value ?? 4100);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }
  return parsed;
};

const splitOrigins = (value: string | undefined): string[] =>
  (value ?? "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

const optionalTrim = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const optionalPositiveInteger = (value: string | undefined, name: string): number | undefined => {
  const trimmed = optionalTrim(value);
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
};

export const config = Object.freeze({
  port: parsePort(process.env.PORT),
  host: process.env.HOST ?? "127.0.0.1",
  nodeEnv: process.env.NODE_ENV ?? "development",
  allowedOrigins: splitOrigins(process.env.ALLOWED_ORIGINS),
  chatProvider: process.env.CHAT_PROVIDER ?? "demo",
  tursoDatabaseUrl: optionalTrim(process.env.TURSO_DATABASE_URL),
  tursoAuthToken: optionalTrim(process.env.TURSO_AUTH_TOKEN),
  appointmentDatabaseUrl: optionalTrim(process.env.APPOINTMENT_DATABASE_URL),
  appointmentGuestUserId: optionalPositiveInteger(
    process.env.APPOINTMENT_GUEST_USER_ID,
    "APPOINTMENT_GUEST_USER_ID",
  ),
  appointmentAssigneeId: optionalPositiveInteger(
    process.env.APPOINTMENT_ASSIGNEE_ID,
    "APPOINTMENT_ASSIGNEE_ID",
  ),
  appointmentBranchId: optionalPositiveInteger(
    process.env.APPOINTMENT_BRANCH_ID,
    "APPOINTMENT_BRANCH_ID",
  ),
  appointmentChannel: optionalTrim(process.env.APPOINTMENT_CHANNEL),
  appointmentTimeZone: optionalTrim(process.env.APPOINTMENT_TIME_ZONE),
  appointmentRateLimitMax: optionalPositiveInteger(
    process.env.APPOINTMENT_RATE_LIMIT_MAX,
    "APPOINTMENT_RATE_LIMIT_MAX",
  ),
});

export const requireDatabaseConfig = (): { url: string; authToken: string } => {
  if (!config.tursoDatabaseUrl || !config.tursoAuthToken) {
    throw new Error(
      "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required. Export them or add them to hlc-be/.env.",
    );
  }

  return { url: config.tursoDatabaseUrl, authToken: config.tursoAuthToken };
};

export interface AppointmentDatabaseConfig {
  url: string;
  guestUserId: number;
  assigneeId: number;
  branchId: number;
  channel: string;
  timeZone: string;
}

export const requireAppointmentDatabaseConfig = (): AppointmentDatabaseConfig => {
  const missing: string[] = [];
  if (!config.appointmentDatabaseUrl) missing.push("APPOINTMENT_DATABASE_URL");
  if (!config.appointmentGuestUserId) missing.push("APPOINTMENT_GUEST_USER_ID");
  if (!config.appointmentAssigneeId) missing.push("APPOINTMENT_ASSIGNEE_ID");
  if (!config.appointmentBranchId) missing.push("APPOINTMENT_BRANCH_ID");
  if (!config.appointmentChannel) missing.push("APPOINTMENT_CHANNEL");
  if (!config.appointmentTimeZone) missing.push("APPOINTMENT_TIME_ZONE");

  if (missing.length > 0) {
    throw new Error(`Appointment database configuration is incomplete. Set: ${missing.join(", ")}.`);
  }

  return {
    url: config.appointmentDatabaseUrl!,
    guestUserId: config.appointmentGuestUserId!,
    assigneeId: config.appointmentAssigneeId!,
    branchId: config.appointmentBranchId!,
    channel: config.appointmentChannel!,
    timeZone: config.appointmentTimeZone!,
  };
};
