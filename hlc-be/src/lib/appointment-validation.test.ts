import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HttpError } from "./http.js";
import { parseAppointmentDate, parseAppointmentRequest, positiveInteger } from "./appointment-validation.js";

const validBooking = {
  sessionId: " browser-session ",
  appointmentRequestId: "6c4a27c5-bc4e-4f29-a119-f2da36619366",
  appointmentMasterId: "42",
  firstName: " Jane ",
  lastName: " Doe ",
  email: " JANE@EXAMPLE.COM ",
  phone: "402-555-0100",
  address: "13812 Manderson Circle",
  city: "Omaha",
  state: "NE",
  zip: "68164",
  message: " Laptop will not boot. ",
};

const expectBadRequest = (action: () => unknown, message: RegExp): void => {
  assert.throws(action, (error: unknown) => {
    assert.ok(error instanceof HttpError);
    assert.equal(error.status, 400);
    assert.match(error.message, message);
    return true;
  });
};

describe("appointment request validation", () => {
  it("maps every required appointments-table input and normalizes text", () => {
    assert.deepEqual(parseAppointmentRequest(validBooking), {
      sessionId: "browser-session",
      appointmentRequestId: "6c4a27c5-bc4e-4f29-a119-f2da36619366",
      appointmentMasterId: 42,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "402-555-0100",
      address: "13812 Manderson Circle",
      city: "Omaha",
      state: "NE",
      zip: "68164",
      message: "Laptop will not boot.",
    });
  });

  it("writes an empty string for the non-null message column when omitted", () => {
    const input = { ...validBooking };
    delete (input as Partial<typeof input>).message;
    assert.equal(parseAppointmentRequest(input).message, "");
  });

  for (const field of ["firstName", "lastName", "email", "phone", "address", "city", "state", "zip"] as const) {
    it(`rejects a missing ${field}`, () => {
      expectBadRequest(() => parseAppointmentRequest({ ...validBooking, [field]: "" }), new RegExp(`${field} is required`));
    });
  }

  it("rejects the former request-shaped payload", () => {
    expectBadRequest(
      () =>
        parseAppointmentRequest({
          name: "Jane Doe",
          email: "jane@example.com",
          preferredDate: "2026-08-15",
          preferredTime: "10:30",
        }),
      /appointmentMasterId must be a positive integer/,
    );
  });

  it("accepts only positive integer master IDs", () => {
    assert.equal(positiveInteger("7", "appointmentMasterId"), 7);
    expectBadRequest(() => positiveInteger(0, "appointmentMasterId"), /positive integer/);
    expectBadRequest(() => positiveInteger(1.5, "appointmentMasterId"), /positive integer/);
  });

  it("requires a UUID appointment request ID for idempotent creation", () => {
    expectBadRequest(
      () => parseAppointmentRequest({ ...validBooking, appointmentRequestId: "retry-1" }),
      /appointmentRequestId must be a UUID/,
    );
  });
});

describe("availability date validation", () => {
  it("accepts a real ISO calendar date without imposing hard-coded business days", () => {
    assert.equal(parseAppointmentDate("2026-08-16"), "2026-08-16");
  });

  it("rejects impossible and non-ISO dates", () => {
    expectBadRequest(() => parseAppointmentDate("2026-02-30"), /date is invalid/);
    expectBadRequest(() => parseAppointmentDate("08/15/2026"), /YYYY-MM-DD/);
  });

  it("rejects dates outside the safe range of the original TIMESTAMP column", () => {
    expectBadRequest(() => parseAppointmentDate("9999-12-31"), /TIMESTAMP range/);
    expectBadRequest(() => parseAppointmentDate("2038-01-18"), /TIMESTAMP range/);
  });
});
