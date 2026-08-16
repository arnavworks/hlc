# HLC backend

Independent TypeScript API for the reusable Heartland chat component. It has no runtime framework dependencies and runs separately from `hlc-fe`.

## Start locally

```bash
cp .env.example .env
npm install
npm run dev
```

The service starts at `http://127.0.0.1:4100` by default.

## Databases

The API keeps chat and repair data in Turso, but appointment reads and writes go directly to the existing Heartland MySQL database. Appointment data is not copied into a local `booking_requests` table.

Add both database connections to `.env`:

```bash
export TURSO_DATABASE_URL="libsql://your-db-url.turso.io"
export TURSO_AUTH_TOKEN="your-secret-token"

export APPOINTMENT_DATABASE_URL="mysql://user:password@host:3306/heartland"
export APPOINTMENT_GUEST_USER_ID="1"
export APPOINTMENT_ASSIGNEE_ID="1"
export APPOINTMENT_BRANCH_ID="1"
export APPOINTMENT_CHANNEL="web"
export APPOINTMENT_TIME_ZONE="SYSTEM"
```

The three IDs must already exist in the original `users`/`branches` data. `APPOINTMENT_GUEST_USER_ID` is the customer record used for unauthenticated widget bookings, `APPOINTMENT_ASSIGNEE_ID` is the staff record used by `assign_to`, and `APPOINTMENT_BRANCH_ID` is the branch for this deployment. `APPOINTMENT_CHANNEL` must exactly match one of the production `appointments.channel` ENUM values. `APPOINTMENT_TIME_ZONE` must match the MySQL session timezone used by the original application; use `America/Chicago` only if that named zone was used there and MySQL's timezone tables are installed.

Public appointment creation should be rate-limited at the trusted reverse proxy/WAF. For a single process exposed directly to clients, optional `APPOINTMENT_RATE_LIMIT_MAX` limits distinct creation IDs per TCP peer in a 15-minute window; retries of the same ID do not count again. Leave it unset behind a proxy because every visitor may otherwise share the proxy's socket address.

The MySQL mapping in `src/db/appointment-schema.ts` mirrors every supplied column, type, signedness, default, and nullability rule for:

- `appointments`
- `appointment_masters`
- `appointment_setups`
- `appointment_types`

Those tables are pre-existing and are not created or migrated by this service. The supplied schema document does not include the concrete `channel` ENUM members, so the ORM maps that column as a string. At startup the service reads the real ENUM members from `INFORMATION_SCHEMA`, validates the configured user/assignee/branch records, and requires InnoDB for the two transaction participants. It refuses to start when these compatibility checks fail.

The supplied schema also declares no index or uniqueness constraint on `appointments.unique_id`. This service remains compatible with that schema, but idempotency and tracking lookups can become table scans as the appointment table grows. If changes to the original database are allowed, deduplicate existing values first and add a `UNIQUE` index (or at least a non-unique index when legacy duplicates must remain). This service intentionally does not alter the original schema.

Relations among the four supplied appointment tables are modeled directly. The document references `users`, `branches`, `zip_codes`, `sms_logs`, and `agents` without supplying their table definitions, so this service does not invent ORM schemas for them; it writes the documented `user_id`, `assign_to`, `branch_id`, and `zip` values and leaves those existing models intact.

The Drizzle database commands below apply only to the Turso chat/repair schema:

```bash
npm run db:generate
npm run db:migrate
```

Useful commands:

- `npm run db:push` — push schema changes directly during development
- `npm run db:studio` — inspect Turso data in Drizzle Studio

The Turso schema contains conversations, messages, repairs, and repair-update history. Existing `booking_requests` rows are retained only as legacy history so migrations do not destroy them; current appointment code never reads or writes that table. Chat exchanges are saved automatically.

## Endpoints

- `GET /` — service information
- `GET /health` — health check
- `POST /v1/chat` — chatbot request
- `GET /v1/appointments/types` — list active, non-deleted appointment types
- `GET /v1/appointments/availability?appointmentTypeId=4&date=2026-08-18` — list real master slots with remaining capacity
- `POST /v1/appointments` — create an appointment in the original schema
- `POST /v1/bookings` — compatibility alias for `POST /v1/appointments`
- `POST /v1/appointments/track` — retrieve an appointment by `unique_id` and return its lifecycle flags
- `POST /v1/repairs/track` — retrieve repair status and update history

Example:

```bash
curl http://127.0.0.1:4100/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"Can I book an appointment?","sessionId":"demo-123"}'
```

Appointment request (use a master ID returned by the availability endpoint):

```json
{
  "sessionId": "browser-session-id",
  "appointmentRequestId": "6c4a27c5-bc4e-4f29-a119-f2da36619366",
  "appointmentMasterId": 125,
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "402-555-0100",
  "address": "100 Main Street",
  "city": "Omaha",
  "state": "NE",
  "zip": "68102",
  "message": "Laptop will not boot"
}
```

The selected `appointment_master` is authoritative for setup, type, date, start time, and end time. Creation serializes each UUID request, locks the master row, rejects inactive/deleted/full, elapsed, or inconsistent records, increments `used_slot`, and inserts the appointment in one transaction. The UUID request ID becomes `unique_id`; retrying the same UUID with the identical payload returns the existing appointment without consuming another slot, while reuse with changed data is rejected. Status is stored only in `is_confirmed`, `is_completed`, `is_canceled`, and `cancel_reason`; no status lookup/string is persisted.

Appointment tracking request:

```json
{
  "uniqueId": "the-unique-id-returned-at-creation",
  "email": "jane@example.com"
}
```

Tracking request:

```json
{
  "trackingNumber": "REPAIR-12345",
  "sessionId": "browser-session-id"
}
```

The existing Heartland tracker is an HTML form, not an API. Existing repair records must be imported or synchronized into the Turso `repairs` and `repair_updates` tables for them to appear in the chatbot.

For local UI testing, add the optional `DEMO-1001` repair after migrating:

```bash
npm run db:seed-demo
```

## Connect the frontend

Set the endpoint on the reusable component in `hlc-fe/public/index.html`:

```html
<heartland-chat
  api-endpoint="http://127.0.0.1:4100/v1/chat"
  booking-endpoint="http://127.0.0.1:4100/v1/appointments"
  tracking-endpoint="http://127.0.0.1:4100/v1/repairs/track"
></heartland-chat>
```

The widget derives the appointment-type and availability URLs from the booking endpoint's origin. For production, use the backend's HTTPS URL and set `ALLOWED_ORIGINS` to the frontend's exact production origin.

## Next provider

The temporary intent-based responses live in `src/services/chat-service.ts`. Replace `answerChat` with the chosen AI provider and booking/CRM integrations; the HTTP contract and frontend component can remain unchanged.
