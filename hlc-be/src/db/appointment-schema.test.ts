import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getTableConfig, type MySqlTable } from "drizzle-orm/mysql-core";
import { appointmentMasters, appointments, appointmentSetups, appointmentTypes } from "./appointment-schema.js";

const columnSignature = (table: MySqlTable): string[] =>
  getTableConfig(table).columns.map(
    (column) =>
      `${column.name}:${column.getSQLType()}:${column.notNull ? "required" : "nullable"}:${column.hasDefault ? "default" : "no-default"}`,
  );

describe("original appointment schema mapping", () => {
  it("maps appointments in original column order and nullability", () => {
    assert.deepEqual(columnSignature(appointments), [
      "id:int unsigned:required:default",
      "user_id:int:required:no-default",
      "appointment_master_id:int:required:no-default",
      "appointment_setup_id:int:required:no-default",
      "appointment_date:timestamp:required:no-default",
      "start_time:time:required:no-default",
      "end_time:time:required:no-default",
      "first_name:varchar(255):required:no-default",
      "last_name:varchar(255):required:no-default",
      "email:varchar(255):required:no-default",
      "phone:varchar(255):required:no-default",
      "city:varchar(255):required:no-default",
      "state:varchar(255):required:no-default",
      "zip:varchar(255):required:no-default",
      "address:varchar(255):required:no-default",
      "message:text:required:no-default",
      "is_active:boolean:required:no-default",
      "assign_to:int:required:no-default",
      "is_confirmed:boolean:required:no-default",
      "is_completed:boolean:required:no-default",
      "unique_id:varchar(255):required:no-default",
      "branch_id:int:required:no-default",
      "is_notified:boolean:required:no-default",
      // The supplied document omits the actual ENUM members, so the runtime mapping is string-compatible.
      "channel:varchar(255):required:no-default",
      "is_canceled:boolean:required:default",
      "cancel_reason:text:nullable:no-default",
      "deleted_at:timestamp:nullable:no-default",
      "created_at:timestamp:nullable:no-default",
      "updated_at:timestamp:nullable:no-default",
    ]);
  });

  it("maps appointment_masters exactly", () => {
    assert.deepEqual(columnSignature(appointmentMasters), [
      "id:int unsigned:required:default",
      "appointment_setup_id:int:required:no-default",
      "appointment_type_id:int:required:no-default",
      "appointment_date:timestamp:required:no-default",
      "start_time:time:required:no-default",
      "end_time:time:required:no-default",
      "available_slot:int:required:no-default",
      "used_slot:int:required:no-default",
      "is_active:boolean:required:no-default",
      "deleted_at:timestamp:nullable:no-default",
      "created_at:timestamp:nullable:no-default",
      "updated_at:timestamp:nullable:no-default",
    ]);
  });

  it("maps appointment_setups exactly", () => {
    assert.deepEqual(columnSignature(appointmentSetups), [
      "id:int unsigned:required:default",
      "appointment_type_id:int:required:no-default",
      "effective_from:timestamp:required:no-default",
      "effective_to:timestamp:required:no-default",
      "start_time:time:required:no-default",
      "end_time:time:required:no-default",
      "time_slot:varchar(255):required:no-default",
      "day:varchar(255):required:no-default",
      "available_slot:int:required:no-default",
      "is_active:boolean:required:no-default",
      "created_by:int:required:no-default",
      "updated_by:int:required:no-default",
      "deleted_at:timestamp:nullable:no-default",
      "created_at:timestamp:nullable:no-default",
      "updated_at:timestamp:nullable:no-default",
    ]);
  });

  it("maps appointment_types exactly", () => {
    assert.deepEqual(columnSignature(appointmentTypes), [
      "id:int unsigned:required:default",
      "name:varchar(255):required:no-default",
      "slug:varchar(255):required:no-default",
      "is_active:boolean:required:no-default",
      "created_by:int:required:no-default",
      "updated_by:int:required:no-default",
      "display_order:int:required:no-default",
      "description:text:required:no-default",
      "icon:varchar(255):required:no-default",
      "deleted_at:timestamp:nullable:no-default",
    ]);
  });
});
