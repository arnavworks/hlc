import { and, asc, eq, gt, gte, isNull, lt, sql } from "drizzle-orm";
import type { RowDataPacket } from "mysql2/promise";
import type {
  AppointmentSlotOption,
  AppointmentStatusFlags,
  AppointmentTypeOption,
  CreateAppointmentInput,
  TrackedAppointment,
} from "../../contracts/booking.js";
import { appointmentPolicy, withAppointmentConnection } from "../appointment-client.js";
import {
  appointmentMasters,
  appointments,
  appointmentSetups,
  appointmentTypes,
} from "../appointment-schema.js";

export class AppointmentAvailabilityError extends Error {
  constructor(message = "The selected appointment slot is no longer available") {
    super(message);
    this.name = "AppointmentAvailabilityError";
  }
}

export class AppointmentIdempotencyError extends Error {
  constructor(message = "appointmentRequestId was already used for another appointment") {
    super(message);
    this.name = "AppointmentIdempotencyError";
  }
}

const dateOnly = (value: string): string => value.slice(0, 10);
const futureAppointmentSlot = sql`
  TIMESTAMP(DATE(${appointmentMasters.appointmentDate}), ${appointmentMasters.startTime}) > CURRENT_TIMESTAMP
`;

export const listAppointmentTypes = async (): Promise<AppointmentTypeOption[]> =>
  withAppointmentConnection((database) =>
    database
      .select({
        id: appointmentTypes.id,
        name: appointmentTypes.name,
        slug: appointmentTypes.slug,
        description: appointmentTypes.description,
        icon: appointmentTypes.icon,
      })
      .from(appointmentTypes)
      .where(and(eq(appointmentTypes.isActive, true), isNull(appointmentTypes.deletedAt)))
      .orderBy(asc(appointmentTypes.displayOrder), asc(appointmentTypes.name)),
  );

export const listAvailableAppointmentSlots = async (
  appointmentTypeId: number,
  date: string,
): Promise<AppointmentSlotOption[]> => {
  const nextDate = new Date(`${date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const dateStart = `${date} 00:00:00`;
  const dateEnd = `${nextDate.toISOString().slice(0, 10)} 00:00:00`;

  return withAppointmentConnection(async (database) => {
    const rows = await database
      .select({
        appointmentMasterId: appointmentMasters.id,
        appointmentSetupId: appointmentMasters.appointmentSetupId,
        appointmentTypeId: appointmentMasters.appointmentTypeId,
        startTime: appointmentMasters.startTime,
        endTime: appointmentMasters.endTime,
        availableSlot: appointmentMasters.availableSlot,
        usedSlot: appointmentMasters.usedSlot,
      })
      .from(appointmentMasters)
      .innerJoin(
        appointmentSetups,
        and(
          eq(appointmentSetups.id, appointmentMasters.appointmentSetupId),
          eq(appointmentSetups.appointmentTypeId, appointmentMasters.appointmentTypeId),
        ),
      )
      .innerJoin(appointmentTypes, eq(appointmentTypes.id, appointmentMasters.appointmentTypeId))
      .where(
        and(
          eq(appointmentMasters.appointmentTypeId, appointmentTypeId),
          gte(appointmentMasters.appointmentDate, dateStart),
          lt(appointmentMasters.appointmentDate, dateEnd),
          eq(appointmentMasters.isActive, true),
          isNull(appointmentMasters.deletedAt),
          gt(appointmentMasters.availableSlot, appointmentMasters.usedSlot),
          eq(appointmentSetups.isActive, true),
          isNull(appointmentSetups.deletedAt),
          sql`${appointmentMasters.appointmentDate} BETWEEN ${appointmentSetups.effectiveFrom} AND ${appointmentSetups.effectiveTo}`,
          futureAppointmentSlot,
          eq(appointmentTypes.isActive, true),
          isNull(appointmentTypes.deletedAt),
        ),
      )
      .orderBy(asc(appointmentMasters.startTime));

    return rows.map((row) => ({
      appointmentMasterId: row.appointmentMasterId,
      appointmentSetupId: row.appointmentSetupId,
      appointmentTypeId: row.appointmentTypeId,
      date,
      startTime: row.startTime,
      endTime: row.endTime,
      remainingSlots: row.availableSlot - row.usedSlot,
    }));
  });
};

export interface CreatedAppointment {
  id: number;
  uniqueId: string;
  appointmentMasterId: number;
  appointmentSetupId: number;
  appointmentTypeId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatusFlags;
}

export const createAppointment = async (
  input: CreateAppointmentInput,
): Promise<CreatedAppointment> =>
  withAppointmentConnection(async (database, client) => {
    const requestLockName = `hlc-appointment:${input.appointmentRequestId}`;
    let requestLockAcquired = false;

    try {
      const [lockRows] = await client.query<(RowDataPacket & { acquired: number | null })[]>(
        "SELECT GET_LOCK(?, 0) AS acquired",
        [requestLockName],
      );
      requestLockAcquired = Number(lockRows[0]?.acquired) === 1;
      if (!requestLockAcquired) {
        throw new AppointmentIdempotencyError("The appointment request is already being processed");
      }

      return await database.transaction(async (transaction) => {
        const existingRows = await transaction
          .select({
            id: appointments.id,
            appointmentMasterId: appointments.appointmentMasterId,
            appointmentSetupId: appointments.appointmentSetupId,
            appointmentDate: appointments.appointmentDate,
            startTime: appointments.startTime,
            endTime: appointments.endTime,
            firstName: appointments.firstName,
            lastName: appointments.lastName,
            email: appointments.email,
            phone: appointments.phone,
            city: appointments.city,
            state: appointments.state,
            zip: appointments.zip,
            address: appointments.address,
            message: appointments.message,
            isActive: appointments.isActive,
            isConfirmed: appointments.isConfirmed,
            isCompleted: appointments.isCompleted,
            isCanceled: appointments.isCanceled,
            cancelReason: appointments.cancelReason,
            deletedAt: appointments.deletedAt,
          })
          .from(appointments)
          .where(eq(appointments.uniqueId, input.appointmentRequestId))
          .limit(2);

        if (existingRows.length > 1) {
          throw new AppointmentIdempotencyError("Multiple appointments use this appointmentRequestId");
        }

        const existing = existingRows[0];
        if (existing) {
          if (existing.deletedAt !== null) {
            throw new AppointmentIdempotencyError("appointmentRequestId belongs to a deleted appointment");
          }
          const payloadMatches =
            existing.appointmentMasterId === input.appointmentMasterId &&
            existing.firstName === input.firstName &&
            existing.lastName === input.lastName &&
            existing.email.toLowerCase() === input.email &&
            existing.phone === input.phone &&
            existing.city === input.city &&
            existing.state === input.state &&
            existing.zip === input.zip &&
            existing.address === input.address &&
            existing.message === input.message;
          if (!payloadMatches) {
            throw new AppointmentIdempotencyError();
          }

          const [existingMaster] = await transaction
            .select({ appointmentTypeId: appointmentMasters.appointmentTypeId })
            .from(appointmentMasters)
            .where(eq(appointmentMasters.id, existing.appointmentMasterId))
            .limit(1);
          if (!existingMaster) {
            throw new AppointmentIdempotencyError("appointmentRequestId belongs to an appointment with no master");
          }
          return {
            id: existing.id,
            uniqueId: input.appointmentRequestId,
            appointmentMasterId: existing.appointmentMasterId,
            appointmentSetupId: existing.appointmentSetupId,
            appointmentTypeId: existingMaster.appointmentTypeId,
            date: dateOnly(existing.appointmentDate),
            startTime: existing.startTime,
            endTime: existing.endTime,
            status: {
              isActive: existing.isActive,
              isConfirmed: existing.isConfirmed,
              isCompleted: existing.isCompleted,
              isCanceled: existing.isCanceled,
              cancelReason: existing.cancelReason,
            },
          };
        }

        const [slot] = await transaction
          .select({
            id: appointmentMasters.id,
            appointmentSetupId: appointmentMasters.appointmentSetupId,
            appointmentTypeId: appointmentMasters.appointmentTypeId,
            appointmentDate: appointmentMasters.appointmentDate,
            startTime: appointmentMasters.startTime,
            endTime: appointmentMasters.endTime,
            availableSlot: appointmentMasters.availableSlot,
            usedSlot: appointmentMasters.usedSlot,
          })
          .from(appointmentMasters)
          .innerJoin(
            appointmentSetups,
            and(
              eq(appointmentSetups.id, appointmentMasters.appointmentSetupId),
              eq(appointmentSetups.appointmentTypeId, appointmentMasters.appointmentTypeId),
            ),
          )
          .innerJoin(appointmentTypes, eq(appointmentTypes.id, appointmentMasters.appointmentTypeId))
          .where(
            and(
              eq(appointmentMasters.id, input.appointmentMasterId),
              eq(appointmentMasters.isActive, true),
              isNull(appointmentMasters.deletedAt),
              eq(appointmentSetups.isActive, true),
              isNull(appointmentSetups.deletedAt),
              sql`${appointmentMasters.appointmentDate} BETWEEN ${appointmentSetups.effectiveFrom} AND ${appointmentSetups.effectiveTo}`,
              futureAppointmentSlot,
              eq(appointmentTypes.isActive, true),
              isNull(appointmentTypes.deletedAt),
            ),
          )
          .limit(1)
          .for("update");

        if (!slot || slot.usedSlot >= slot.availableSlot) {
          throw new AppointmentAvailabilityError();
        }

        await transaction
          .update(appointmentMasters)
          .set({
            usedSlot: sql`${appointmentMasters.usedSlot} + 1`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(appointmentMasters.id, slot.id));

        const uniqueId = input.appointmentRequestId;
        const inserted = await transaction
          .insert(appointments)
          .values({
            userId: appointmentPolicy.guestUserId,
            appointmentMasterId: slot.id,
            appointmentSetupId: slot.appointmentSetupId,
            appointmentDate: slot.appointmentDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            city: input.city,
            state: input.state,
            zip: input.zip,
            address: input.address,
            message: input.message,
            isActive: true,
            assignTo: appointmentPolicy.assigneeId,
            isConfirmed: false,
            isCompleted: false,
            uniqueId,
            branchId: appointmentPolicy.branchId,
            isNotified: false,
            channel: appointmentPolicy.channel,
            isCanceled: false,
            cancelReason: null,
            deletedAt: null,
            createdAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .$returningId();

        const id = inserted[0]?.id;
        if (!id) throw new Error("Unable to create appointment");

        return {
          id,
          uniqueId,
          appointmentMasterId: slot.id,
          appointmentSetupId: slot.appointmentSetupId,
          appointmentTypeId: slot.appointmentTypeId,
          date: dateOnly(slot.appointmentDate),
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: {
            isActive: true,
            isConfirmed: false,
            isCompleted: false,
            isCanceled: false,
            cancelReason: null,
          },
        };
      });
    } finally {
      if (requestLockAcquired) {
        try {
          await client.query("SELECT RELEASE_LOCK(?)", [requestLockName]);
        } catch (error) {
          client.destroy();
          throw error;
        }
      }
    }
  });

export const findAppointmentByUniqueId = async (
  uniqueId: string,
  email: string,
): Promise<TrackedAppointment | null> =>
  withAppointmentConnection(async (database) => {
    const rows = await database
      .select({
        uniqueId: appointments.uniqueId,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        isActive: appointments.isActive,
        isConfirmed: appointments.isConfirmed,
        isCompleted: appointments.isCompleted,
        isCanceled: appointments.isCanceled,
        cancelReason: appointments.cancelReason,
        typeId: appointmentTypes.id,
        typeName: appointmentTypes.name,
        typeSlug: appointmentTypes.slug,
        typeDescription: appointmentTypes.description,
        typeIcon: appointmentTypes.icon,
      })
      .from(appointments)
      .innerJoin(appointmentMasters, eq(appointmentMasters.id, appointments.appointmentMasterId))
      .innerJoin(appointmentTypes, eq(appointmentTypes.id, appointmentMasters.appointmentTypeId))
      .where(
        and(
          eq(appointments.uniqueId, uniqueId),
          sql`LOWER(${appointments.email}) = ${email}`,
          isNull(appointments.deletedAt),
        ),
      )
      .limit(2);

    if (rows.length > 1) {
      throw new AppointmentIdempotencyError("Multiple appointments use this uniqueId");
    }
    const row = rows[0];
    if (!row) return null;

    return {
      uniqueId: row.uniqueId,
      appointmentType: {
        id: row.typeId,
        name: row.typeName,
        slug: row.typeSlug,
        description: row.typeDescription,
        icon: row.typeIcon,
      },
      appointmentDate: dateOnly(row.appointmentDate),
      startTime: row.startTime,
      endTime: row.endTime,
      status: {
        isActive: row.isActive,
        isConfirmed: row.isConfirmed,
        isCompleted: row.isCompleted,
        isCanceled: row.isCanceled,
        cancelReason: row.cancelReason,
      },
    };
  });
