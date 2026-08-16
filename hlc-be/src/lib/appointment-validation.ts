import type { CreateAppointmentInput } from "../contracts/booking.js";
import { HttpError } from "./http.js";

// The schema uses MySQL TIMESTAMP, whose UTC range ends in January 2038.
// Keeping one full day inside each edge also makes the availability query's
// [date, next-date) bounds valid in every MySQL session timezone.
const MIN_APPOINTMENT_DATE = "1970-01-02";
const MAX_APPOINTMENT_DATE = "2038-01-17";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const optionalText = (value: unknown, field: string, maxLength: number): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new HttpError(400, `${field} must be a string`);
  const cleaned = value.trim();
  if (cleaned.length > maxLength) throw new HttpError(400, `${field} is too long`);
  return cleaned || undefined;
};

export const requiredText = (value: unknown, field: string, maxLength: number): string => {
  const cleaned = optionalText(value, field, maxLength);
  if (!cleaned) throw new HttpError(400, `${field} is required`);
  return cleaned;
};

export const positiveInteger = (value: unknown, field: string): number => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new HttpError(400, `${field} must be a positive integer`);
  }
  return parsed;
};

export const parseAppointmentDate = (value: unknown): string => {
  const date = requiredText(value, "date", 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new HttpError(400, "date must use YYYY-MM-DD");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new HttpError(400, "date is invalid");
  }
  if (date < MIN_APPOINTMENT_DATE || date > MAX_APPOINTMENT_DATE) {
    throw new HttpError(400, "date is outside the supported appointment TIMESTAMP range");
  }
  return date;
};

export const parseAppointmentRequest = (body: unknown): CreateAppointmentInput => {
  if (!isRecord(body)) throw new HttpError(400, "Request body must be an object");

  const email = parseEmail(body.email);

  return {
    sessionId: optionalText(body.sessionId, "sessionId", 200),
    appointmentMasterId: positiveInteger(body.appointmentMasterId, "appointmentMasterId"),
    appointmentRequestId: parseAppointmentRequestId(body.appointmentRequestId),
    firstName: requiredText(body.firstName, "firstName", 255),
    lastName: requiredText(body.lastName, "lastName", 255),
    email,
    phone: requiredText(body.phone, "phone", 255),
    city: requiredText(body.city, "city", 255),
    state: requiredText(body.state, "state", 255),
    zip: requiredText(body.zip, "zip", 255),
    address: requiredText(body.address, "address", 255),
    message: optionalText(body.message, "message", 10_000) ?? "",
  };
};

export const parseAppointmentRequestId = (value: unknown): string => {
  const requestId = requiredText(value, "appointmentRequestId", 36).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(requestId)) {
    throw new HttpError(400, "appointmentRequestId must be a UUID");
  }
  return requestId;
};

export const parseEmail = (value: unknown): string => {
  const email = requiredText(value, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "email is invalid");
  return email;
};
