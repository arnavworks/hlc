# Appointment Schema and Relationships

This document describes the current Heartland Computer project appointment schema, including table definitions, relationships, and how appointment status is represented.

## 1. Overview

The project uses the following appointment-related tables:

- `appointments`
- `appointment_masters`
- `appointment_setups`
- `appointment_types`

The appointment implementation uses boolean status fields instead of a separate appointment status lookup table.

## 2. Table definitions

### `appointments`

This is the main booking table.

```sql
CREATE TABLE appointments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    appointment_master_id INT NOT NULL,
    appointment_setup_id INT NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    zip VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN NOT NULL,
    assign_to INT NOT NULL,
    is_confirmed BOOLEAN NOT NULL,
    is_completed BOOLEAN NOT NULL,
    unique_id VARCHAR(255) NOT NULL,
    branch_id INT NOT NULL,
    is_notified BOOLEAN NOT NULL,
    channel ENUM(...) NOT NULL,
    is_canceled BOOLEAN NOT NULL DEFAULT 0,
    cancel_reason TEXT NULL,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

#### Notes

- `user_id` is the customer who created/booked the appointment.
- `assign_to` is a staff user assigned to handle the appointment.
- `branch_id` links the appointment to a branch.
- `channel` is the booking channel (web, phone, etc.).

### `appointment_masters`

Used for slot tracking and master availability.

```sql
CREATE TABLE appointment_masters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    appointment_setup_id INT NOT NULL,
    appointment_type_id INT NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    available_slot INT NOT NULL,
    used_slot INT NOT NULL,
    is_active BOOLEAN NOT NULL,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

### `appointment_setups`

Defines reusable availability settings and time slot configuration.

```sql
CREATE TABLE appointment_setups (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    appointment_type_id INT NOT NULL,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    time_slot VARCHAR(255) NOT NULL,
    day VARCHAR(255) NOT NULL,
    available_slot INT NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

### `appointment_types`

Stores appointment categories and metadata.

```sql
CREATE TABLE appointment_types (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,
    display_order INT NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMP NULL
);
```

## 3. Status fields in `appointments`

The project uses the following appointment status flags:

- `is_confirmed` — appointment has been confirmed
- `is_completed` — appointment has been completed
- `is_canceled` — appointment has been canceled
- `cancel_reason` — explanation for cancellation

## 4. Model relations

### `App\Models\Appointment`

Relationships:

- `appointmentMaster()` → `belongsTo(App\Models\AppointmentMaster, 'appointment_master_id')`
- `appointmentSetup()` → `belongsTo(App\Models\AppointmentSetup, 'appointment_setup_id')`
- `assignTo()` → `belongsTo(App\Models\User, 'assign_to')`
- `branch()` → `belongsTo(App\Models\Branch, 'branch_id')`
- `smsable()` → `morphMany(App\Models\SmsLog, 'smsable')`
- `agentable()` → `morphOne(App\Models\Agent, 'agentable')`
- `zipCode()` → `belongsTo(App\Models\ZipCode, 'zip')`

### `App\Models\AppointmentMaster`

Relationships:

- `setup()` → `belongsTo(App\Models\AppointmentSetup, 'appointment_setup_id')`
- `type()` → `belongsTo(App\Models\AppointmentType, 'appointment_type_id')`

### `App\Models\AppointmentSetup`

Relationships:

- `appointmentType()` → `belongsTo(App\Models\AppointmentType, 'appointment_type_id')`

### `App\Models\User`

Relationships:

- `appointments()` → `hasMany(App\Models\Appointment, 'user_id')`

## 5. Relationship diagram

```text
users
  └── hasMany appointments (appointments.user_id)

appointments
  ├── belongsTo users (user_id)           // customer
  ├── belongsTo users (assign_to)         // assigned staff
  ├── belongsTo appointment_masters
  ├── belongsTo appointment_setups
  ├── belongsTo branches
  ├── morphMany sms_logs
  ├── morphOne agents
  └── belongsTo zip_codes (zip)

appointment_masters
  ├── belongsTo appointment_setups
  └── belongsTo appointment_types

appointment_setups
  └── belongsTo appointment_types
```

## 6. Important project notes

- The current implementation does not use a separate status lookup table.
- The appointment lifecycle is expressed through boolean flags on `appointments`.
- `appointment_setup_id` defines a reusable schedule configuration.
- `appointment_master_id` points to a specific slot/master availability record.
- `assign_to` is a staff user ID and is distinct from `user_id`.

## 7. Developer usage examples

### Load appointment with customer and assigned staff

```php
$appointment = App\Models\Appointment::with(['appointmentMaster', 'appointmentSetup', 'assignTo', 'branch'])->find($id);
```

### Query active upcoming appointments

```php
$appointments = App\Models\Appointment::where('is_active', true)
    ->where('is_completed', false)
    ->where('is_canceled', false)
    ->where('appointment_date', '>=', now())
    ->get();
```

### Query canceled appointments with reason

```php
$appointments = App\Models\Appointment::where('is_canceled', true)
    ->whereNotNull('cancel_reason')
    ->get();
```

## 8. Recommended docs file location

This file is stored in `docs/appointment-schema.md` and is meant for developers onboarding on appointment flow and database relations.