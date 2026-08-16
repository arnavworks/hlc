import type { IncomingMessage, ServerResponse } from "node:http";
import type { RepairTrackingResponse } from "../contracts/repair.js";
import { findRepairByTrackingNumber } from "../db/repositories/repairs.js";
import { HttpError, readJson, sendJson } from "../lib/http.js";

const statusLabels: Record<string, string> = {
  received: "Received",
  diagnosing: "Diagnosis in progress",
  awaiting_approval: "Awaiting your approval",
  repairing: "Repair in progress",
  quality_check: "Quality check",
  ready: "Ready for pickup",
  completed: "Completed",
};

export const repairTrackingRoute = async (
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> => {
  const body = await readJson(request);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be an object");
  }

  const rawNumber = (body as Record<string, unknown>).trackingNumber;
  if (typeof rawNumber !== "string" || rawNumber.trim().length === 0) {
    throw new HttpError(400, "trackingNumber is required");
  }

  const trackingNumber = rawNumber.trim().toUpperCase();
  if (trackingNumber.length > 64 || !/^[A-Z0-9-]+$/.test(trackingNumber)) {
    throw new HttpError(400, "trackingNumber has an invalid format");
  }

  const repair = await findRepairByTrackingNumber(trackingNumber);
  if (!repair) {
    throw new HttpError(404, "We could not find a repair with that tracking number");
  }

  const payload: RepairTrackingResponse = {
    repair: {
      trackingNumber: repair.trackingNumber,
      status: repair.status,
      statusLabel: statusLabels[repair.status] ?? repair.status,
      deviceName: repair.deviceName,
      service: repair.service,
      location: repair.location,
      statusMessage: repair.statusMessage,
      receivedAt: repair.receivedAt,
      estimatedCompletion: repair.estimatedCompletion,
      updatedAt: repair.updatedAt,
      updates: repair.updates,
    },
  };

  sendJson(response, 200, payload);
};
