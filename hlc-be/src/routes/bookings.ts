import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { CreateAppointmentResponse } from "../contracts/booking.js";
import {
  AppointmentAvailabilityError,
  AppointmentIdempotencyError,
  createAppointment,
  findAppointmentByUniqueId,
  listAppointmentTypes,
  listAvailableAppointmentSlots,
} from "../db/repositories/bookings.js";
import {
  isRecord,
  parseAppointmentDate,
  parseEmail,
  parseAppointmentRequest,
  positiveInteger,
  requiredText,
} from "../lib/appointment-validation.js";
import { HttpError, readJson, sendJson } from "../lib/http.js";
import { config } from "../config.js";

const APPOINTMENT_RATE_WINDOW_MS = 15 * 60 * 1_000;
const APPOINTMENT_RATE_LIMIT_MAX_KEYS = 10_000;
const appointmentAttempts = new Map<string, { resetAt: number; requestIds: Set<string> }>();

const enforceAppointmentRateLimit = (
  request: IncomingMessage,
  response: ServerResponse,
  appointmentRequestId: string,
): void => {
  const maximumAttempts = config.appointmentRateLimitMax;
  if (!maximumAttempts) return;

  const now = Date.now();
  const address = request.socket.remoteAddress || "unknown";
  let attempt = appointmentAttempts.get(address);
  if (!attempt || attempt.resetAt <= now) {
    if (appointmentAttempts.size >= APPOINTMENT_RATE_LIMIT_MAX_KEYS) {
      for (const [key, value] of appointmentAttempts) {
        if (value.resetAt <= now) appointmentAttempts.delete(key);
      }
      while (appointmentAttempts.size >= APPOINTMENT_RATE_LIMIT_MAX_KEYS) {
        const oldestKey = appointmentAttempts.keys().next().value as string | undefined;
        if (!oldestKey) break;
        appointmentAttempts.delete(oldestKey);
      }
    }
    attempt = { resetAt: now + APPOINTMENT_RATE_WINDOW_MS, requestIds: new Set() };
    appointmentAttempts.set(address, attempt);
  }

  if (attempt.requestIds.has(appointmentRequestId)) return;
  if (attempt.requestIds.size >= maximumAttempts) {
    response.setHeader("Retry-After", String(Math.max(1, Math.ceil((attempt.resetAt - now) / 1_000))));
    throw new HttpError(429, "Too many appointment requests. Please try again later.");
  }
  attempt.requestIds.add(appointmentRequestId);
};

export const bookingRoute = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
  const input = parseAppointmentRequest(await readJson(request));
  enforceAppointmentRateLimit(request, response, input.appointmentRequestId);
  const sessionId = input.sessionId || randomUUID();
  let booking;
  try {
    booking = await createAppointment(input);
  } catch (error) {
    if (error instanceof AppointmentAvailabilityError) {
      throw new HttpError(409, error.message, "APPOINTMENT_UNAVAILABLE");
    }
    if (error instanceof AppointmentIdempotencyError) {
      throw new HttpError(409, error.message, "APPOINTMENT_REQUEST_CONFLICT");
    }
    throw error;
  }

  const payload: CreateAppointmentResponse = {
    reply: "Your appointment is saved. Our team will contact you when it is confirmed.",
    booking: {
      id: booking.id,
      uniqueId: booking.uniqueId,
      appointmentMasterId: booking.appointmentMasterId,
      appointmentSetupId: booking.appointmentSetupId,
      appointmentTypeId: booking.appointmentTypeId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
    },
    sessionId,
  };

  sendJson(response, 201, payload);
};

export const appointmentTypesRoute = async (_request: IncomingMessage, response: ServerResponse): Promise<void> => {
  sendJson(response, 200, { appointmentTypes: await listAppointmentTypes() });
};

export const appointmentAvailabilityRoute = async (
  _request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): Promise<void> => {
  const appointmentTypeId = positiveInteger(url.searchParams.get("appointmentTypeId"), "appointmentTypeId");
  const date = parseAppointmentDate(url.searchParams.get("date"));
  const slots = await listAvailableAppointmentSlots(appointmentTypeId, date);
  sendJson(response, 200, { slots });
};

export const appointmentTrackingRoute = async (
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> => {
  const body = await readJson(request);
  if (!isRecord(body)) throw new HttpError(400, "Request body must be an object");
  const uniqueId = requiredText(body.uniqueId, "uniqueId", 255);
  const email = parseEmail(body.email);
  let appointment;
  try {
    appointment = await findAppointmentByUniqueId(uniqueId, email);
  } catch (error) {
    if (error instanceof AppointmentIdempotencyError) throw new HttpError(409, "Appointment reference is ambiguous");
    throw error;
  }
  if (!appointment) throw new HttpError(404, "Appointment not found");
  sendJson(response, 200, { appointment });
};
