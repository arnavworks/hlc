import { db, closeDatabase } from "./client.js";
import { repairs, repairUpdates } from "./schema.js";

const repairId = "demo-repair-1001";

const [repair] = await db
  .insert(repairs)
  .values({
    id: repairId,
    trackingNumber: "DEMO-1001",
    deviceName: "Dell Inspiron laptop",
    service: "Laptop repair",
    location: "Omaha",
    status: "repairing",
    statusMessage: "Your technician is completing the repair now.",
    receivedAt: "2026-07-01 10:15:00",
    estimatedCompletion: "2026-07-06",
  })
  .onConflictDoUpdate({
    target: repairs.trackingNumber,
    set: {
      status: "repairing",
      statusMessage: "Your technician is completing the repair now.",
      estimatedCompletion: "2026-07-06",
      updatedAt: new Date().toISOString(),
    },
  })
  .returning({ id: repairs.id });

if (!repair) throw new Error("Unable to create demo repair");

await db
  .insert(repairUpdates)
  .values([
    {
      id: "demo-update-1001-received",
      repairId: repair.id,
      status: "received",
      title: "Device received",
      message: "Checked in at our Omaha location.",
      createdAt: "2026-07-01 10:15:00",
    },
    {
      id: "demo-update-1001-diagnosed",
      repairId: repair.id,
      status: "diagnosing",
      title: "Diagnosis complete",
      message: "The issue was identified and repair work was approved.",
      createdAt: "2026-07-02 14:30:00",
    },
    {
      id: "demo-update-1001-repairing",
      repairId: repair.id,
      status: "repairing",
      title: "Repair in progress",
      message: "Your technician is installing and testing the replacement part.",
      createdAt: "2026-07-03 09:20:00",
    },
  ])
  .onConflictDoNothing();

console.log("Demo repair ready. Tracking number: DEMO-1001");
closeDatabase();
