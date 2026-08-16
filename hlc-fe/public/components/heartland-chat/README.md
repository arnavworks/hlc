# Heartland Chat component

A dependency-free Web Component that can be reused on any website. It communicates directly with a separately hosted chat API and never uses the landing page's backend.

## Add it to a site

```html
<script type="module" src="/components/heartland-chat/heartland-chat.js"></script>

<heartland-chat
  api-endpoint="https://chat-api.example.com/v1/chat"
  booking-endpoint="https://chat-api.example.com/v1/appointments"
  tracking-endpoint="https://chat-api.example.com/v1/repairs/track"
  assistant-name="Nova"
  business-name="Heartland Computer"
  accent-color="#a6d832"
  booking-url="https://example.com/book"
  phone="402-502-7040 "
></heartland-chat>
```

All attributes are optional. Without `api-endpoint`, the component runs in demo mode with local FAQ responses.

Calendar actions open the appointment form directly inside the chat. Appointment types and available slots come from the appointment API; the component does not keep its own service list or business-hour rules. If `booking-endpoint` is omitted, the component derives the compatible `/v1/bookings` alias from `api-endpoint`. The two appointment lookup endpoints are derived from the same origin.

Tracking actions open a repair-number form directly inside the chat and render the device, current status, estimated completion, and repair-update timeline. If `tracking-endpoint` is omitted, the component derives `/v1/repairs/track` from `api-endpoint`.

## Chat API contract

The component sends a cross-origin `POST` request:

```json
{
  "message": "Can I book an appointment?",
  "sessionId": "c9f7...",
  "history": [
    { "role": "user", "content": "Can I book an appointment?" }
  ],
  "context": {
    "businessName": "Heartland Computer",
    "pageUrl": "https://example.com/",
    "pageTitle": "Example page"
  }
}
```

Return JSON containing `reply` (also accepts `message` or `answer`) and optional action links:

```json
{
  "reply": "Of course. Pick a time from our calendar.",
  "actions": [
    {
      "label": "Book a demo",
      "url": "https://calendar.example.com/demo",
      "type": "calendar"
    }
  ]
}
```

The external server must allow CORS requests from every website where the component is embedded. The component sends no cookies or credentials by default.

## Appointment API contract

The component first requests the appointment types from the origin of `booking-endpoint`:

```http
GET /v1/appointments/types
```

```json
{
  "appointmentTypes": [
    {
      "id": 4,
      "name": "In-store system drop-off",
      "slug": "in-store-drop-off",
      "description": "Bring a system to the store for service.",
      "icon": "computer"
    }
  ]
}
```

After the visitor selects a type and date, the component requests the backend-calculated slots:

```http
GET /v1/appointments/availability?appointmentTypeId=4&date=2026-08-18
```

```json
{
  "slots": [
    {
      "appointmentMasterId": 125,
      "appointmentSetupId": 8,
      "appointmentTypeId": 4,
      "date": "2026-08-18",
      "startTime": "10:00:00",
      "endTime": "10:30:00",
      "remainingSlots": 2
    }
  ]
}
```

The chosen slot is booked through the configured `booking-endpoint` (`POST /v1/appointments`; `/v1/bookings` is also accepted):

```json
{
  "sessionId": "c9f7...",
  "appointmentRequestId": "6c4a27c5-bc4e-4f29-a119-f2da36619366",
  "appointmentMasterId": 125,
  "firstName": "Alex",
  "lastName": "Morgan",
  "email": "alex@example.com",
  "phone": "402-555-0199",
  "address": "100 Main Street",
  "city": "Omaha",
  "state": "NE",
  "zip": "68102",
  "message": ""
}
```

All named contact fields are required. `message` may be blank and is still sent as an empty string. The pending payload is kept in tab-scoped session storage for at most 30 minutes so a lost network response can be replayed without consuming another slot. After that, the PII is removed but the non-PII `appointmentRequestId` remains as a duplicate-prevention reference until success or an explicit start-over. The confirmed date/time and tracking reference are rendered from the canonical booking response. Slot, setup, type, date, and capacity details remain backend-owned; the booking request sends the exact `appointmentMasterId` returned by availability and does not invent user, assignee, branch, or channel identifiers.

## Events

The element emits `chat-open`, `chat-close`, `chat-error`, `booking-created`, `booking-error`, `repair-tracked`, and `tracking-error` DOM events for optional analytics or monitoring.
