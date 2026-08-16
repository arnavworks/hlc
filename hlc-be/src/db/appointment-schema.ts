import { relations } from "drizzle-orm";
import { boolean, int, mysqlTable, text, time, timestamp, varchar } from "drizzle-orm/mysql-core";

export const appointmentTypes = mysqlTable("appointment_types", {
  id: int("id", { unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull(),
  createdBy: int("created_by").notNull(),
  updatedBy: int("updated_by").notNull(),
  displayOrder: int("display_order").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 255 }).notNull(),
  deletedAt: timestamp("deleted_at", { mode: "string" }),
});

export const appointmentSetups = mysqlTable("appointment_setups", {
  id: int("id", { unsigned: true }).autoincrement().primaryKey(),
  appointmentTypeId: int("appointment_type_id").notNull(),
  effectiveFrom: timestamp("effective_from", { mode: "string" }).notNull(),
  effectiveTo: timestamp("effective_to", { mode: "string" }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  timeSlot: varchar("time_slot", { length: 255 }).notNull(),
  day: varchar("day", { length: 255 }).notNull(),
  availableSlot: int("available_slot").notNull(),
  isActive: boolean("is_active").notNull(),
  createdBy: int("created_by").notNull(),
  updatedBy: int("updated_by").notNull(),
  deletedAt: timestamp("deleted_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const appointmentMasters = mysqlTable("appointment_masters", {
  id: int("id", { unsigned: true }).autoincrement().primaryKey(),
  appointmentSetupId: int("appointment_setup_id").notNull(),
  appointmentTypeId: int("appointment_type_id").notNull(),
  appointmentDate: timestamp("appointment_date", { mode: "string" }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  availableSlot: int("available_slot").notNull(),
  usedSlot: int("used_slot").notNull(),
  isActive: boolean("is_active").notNull(),
  deletedAt: timestamp("deleted_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const appointments = mysqlTable("appointments", {
  id: int("id", { unsigned: true }).autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  appointmentMasterId: int("appointment_master_id").notNull(),
  appointmentSetupId: int("appointment_setup_id").notNull(),
  appointmentDate: timestamp("appointment_date", { mode: "string" }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 255 }).notNull(),
  zip: varchar("zip", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isActive: boolean("is_active").notNull(),
  assignTo: int("assign_to").notNull(),
  isConfirmed: boolean("is_confirmed").notNull(),
  isCompleted: boolean("is_completed").notNull(),
  uniqueId: varchar("unique_id", { length: 255 }).notNull(),
  branchId: int("branch_id").notNull(),
  isNotified: boolean("is_notified").notNull(),
  // The source ENUM values were not supplied. varchar is runtime-compatible with
  // MySQL ENUM string values and deliberately avoids inventing an invalid value set.
  channel: varchar("channel", { length: 255 }).notNull(),
  isCanceled: boolean("is_canceled").notNull().default(false),
  cancelReason: text("cancel_reason"),
  deletedAt: timestamp("deleted_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const appointmentTypesRelations = relations(appointmentTypes, ({ many }) => ({
  appointmentSetups: many(appointmentSetups),
  appointmentMasters: many(appointmentMasters),
}));

export const appointmentSetupsRelations = relations(appointmentSetups, ({ one, many }) => ({
  appointmentType: one(appointmentTypes, {
    fields: [appointmentSetups.appointmentTypeId],
    references: [appointmentTypes.id],
  }),
  appointmentMasters: many(appointmentMasters),
  appointments: many(appointments),
}));

export const appointmentMastersRelations = relations(appointmentMasters, ({ one, many }) => ({
  appointmentSetup: one(appointmentSetups, {
    fields: [appointmentMasters.appointmentSetupId],
    references: [appointmentSetups.id],
  }),
  appointmentType: one(appointmentTypes, {
    fields: [appointmentMasters.appointmentTypeId],
    references: [appointmentTypes.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  appointmentMaster: one(appointmentMasters, {
    fields: [appointments.appointmentMasterId],
    references: [appointmentMasters.id],
  }),
  appointmentSetup: one(appointmentSetups, {
    fields: [appointments.appointmentSetupId],
    references: [appointmentSetups.id],
  }),
}));

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type AppointmentMaster = typeof appointmentMasters.$inferSelect;
export type NewAppointmentMaster = typeof appointmentMasters.$inferInsert;
export type AppointmentSetup = typeof appointmentSetups.$inferSelect;
export type NewAppointmentSetup = typeof appointmentSetups.$inferInsert;
export type AppointmentType = typeof appointmentTypes.$inferSelect;
export type NewAppointmentType = typeof appointmentTypes.$inferInsert;
