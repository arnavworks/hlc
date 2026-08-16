import { asc, eq } from "drizzle-orm";
import { db } from "../client.js";
import { repairs, repairUpdates } from "../schema.js";

export const findRepairByTrackingNumber = async (trackingNumber: string) => {
  const repair = await db.query.repairs.findFirst({
    where: eq(repairs.trackingNumber, trackingNumber),
  });

  if (!repair) return null;

  const updates = await db
    .select({
      status: repairUpdates.status,
      title: repairUpdates.title,
      message: repairUpdates.message,
      createdAt: repairUpdates.createdAt,
    })
    .from(repairUpdates)
    .where(eq(repairUpdates.repairId, repair.id))
    .orderBy(asc(repairUpdates.createdAt));

  return { ...repair, updates };
};
