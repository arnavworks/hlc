import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { requireAppointmentDatabaseConfig } from "../config.js";
import { parseMysqlEnumValues } from "../lib/mysql-enum.js";
import * as schema from "./appointment-schema.js";

const connection = requireAppointmentDatabaseConfig();

export const appointmentPolicy = Object.freeze({
  guestUserId: connection.guestUserId,
  assigneeId: connection.assigneeId,
  branchId: connection.branchId,
  channel: connection.channel,
  timeZone: connection.timeZone,
});

export const appointmentPool = mysql.createPool({
  uri: connection.url,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60_000,
  queueLimit: 0,
});

export type AppointmentDatabase = MySql2Database<typeof schema>;

export const withAppointmentConnection = async <T>(
  operation: (database: AppointmentDatabase, client: PoolConnection) => Promise<T>,
): Promise<T> => {
  const client = await appointmentPool.getConnection();
  try {
    await client.query("SET SESSION time_zone = ?", [appointmentPolicy.timeZone]);
    const database = drizzle(client, { schema, mode: "default" });
    return await operation(database, client);
  } finally {
    client.release();
  }
};

export const checkAppointmentDatabase = async (): Promise<void> =>
  withAppointmentConnection(async (_database, client) => {
    await client.query("SELECT 1 FROM appointment_types LIMIT 0");
    await client.query("SELECT 1 FROM appointment_setups LIMIT 0");
    await client.query("SELECT 1 FROM appointment_masters LIMIT 0");
    await client.query("SELECT 1 FROM appointments LIMIT 0");

    const [rows] = await client.query<(RowDataPacket & { columnType: string })[]>(
      `SELECT COLUMN_TYPE AS columnType
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'appointments'
        AND COLUMN_NAME = 'channel'
      LIMIT 1`,
    );
    const channelValues = rows[0] ? parseMysqlEnumValues(rows[0].columnType) : null;
    if (!channelValues) {
      throw new Error("appointments.channel is missing or is not the expected MySQL ENUM column");
    }
    if (!channelValues.includes(appointmentPolicy.channel)) {
      throw new Error(
        `APPOINTMENT_CHANNEL must match appointments.channel. Allowed values: ${channelValues.join(", ")}`,
      );
    }

    const [tableRows] = await client.query<
      (RowDataPacket & { tableName: string; engine: string | null })[]
    >(
      `SELECT TABLE_NAME AS tableName, ENGINE AS engine
       FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('appointments', 'appointment_masters')`,
    );
    const engines = new Map(tableRows.map((row) => [row.tableName, row.engine?.toLowerCase()]));
    for (const tableName of ["appointments", "appointment_masters"]) {
      if (engines.get(tableName) !== "innodb") {
        throw new Error(`${tableName} must use InnoDB so slot reservation and appointment creation are atomic`);
      }
    }

    const [userRows] = await client.query<(RowDataPacket & { id: number })[]>(
      "SELECT id FROM users WHERE id IN (?, ?)",
      [appointmentPolicy.guestUserId, appointmentPolicy.assigneeId],
    );
    const userIds = new Set(userRows.map((row) => Number(row.id)));
    if (!userIds.has(appointmentPolicy.guestUserId)) {
      throw new Error("APPOINTMENT_GUEST_USER_ID does not exist in users");
    }
    if (!userIds.has(appointmentPolicy.assigneeId)) {
      throw new Error("APPOINTMENT_ASSIGNEE_ID does not exist in users");
    }

    const [branchRows] = await client.query<(RowDataPacket & { id: number })[]>(
      "SELECT id FROM branches WHERE id = ? LIMIT 1",
      [appointmentPolicy.branchId],
    );
    if (!branchRows[0]) {
      throw new Error("APPOINTMENT_BRANCH_ID does not exist in branches");
    }
  });

export const closeAppointmentDatabase = async (): Promise<void> => {
  await appointmentPool.end();
};
