# WhatsApp Appointment Chatbot - System Design Document

## Table of Contents

1.  Overview
2.  High-Level Architecture
3.  Database Schema
4.  Conversation Flow
5.  State Machine
6.  Backend API Specification
7.  Validation Rules
8.  Logging & Monitoring
9.  Edge Cases
10. Testing Checklist
11. Suggested Folder Structure
12. Future LLM Integration

------------------------------------------------------------------------

# 1. Overview

This document describes the architecture for a WhatsApp appointment
booking chatbot using a single WhatsApp Business number. Users can scan
doctor-specific QR codes or manually choose a clinic, complete a guided
booking flow, and receive confirmation after the backend successfully
books the appointment.

------------------------------------------------------------------------

# 2. High-Level Architecture

``` text
                   One WhatsApp Business Number
                              │
                Multiple QR Codes (Doctor/Clinic)
                              │
                     WhatsApp Business Platform
                              │
                           Webhook
                              │
                      Chatbot Backend API
          ┌───────────────────┼───────────────────┐
          │                   │                   │
 Conversation Engine    Booking Service      Database
```

Modules:

-   Business Module
-   Chat Module
-   AI Module (Optional)

------------------------------------------------------------------------

# 3. Database Schema

## Patients

  Column         Description
  -------------- ------------------------
  id             Primary Key
  phone_number   Unique WhatsApp number
  name           Patient name
  created_at     Timestamp
  updated_at     Timestamp

## Clinics

  Column      Description
  ----------- -------------
  id          Primary Key
  name        Clinic name
  address     Address
  is_active   Boolean

## Doctors

  Column           Description
  ---------------- -------------
  id               Primary Key
  clinic_id        FK
  name             Doctor name
  specialization   Specialty
  is_active        Boolean

## QR Tokens

  Column      Description
  ----------- -----------------
  token       Unique QR token
  doctor_id   FK
  clinic_id   FK
  is_active   Boolean

Example

``` text
BK4H91 -> Doctor 7
PL9D3K -> Doctor 2
```

## Conversation State

  Column
  ----------------
  id
  patient_id
  current_step
  doctor_id
  clinic_id
  preferred_date
  preferred_time
  appointment_id
  status
  updated_at

States

-   START
-   IDENTIFY_DOCTOR
-   CONFIRM_DOCTOR
-   WAITING_FOR_DATE
-   WAITING_FOR_TIME
-   VALIDATING
-   BOOKING
-   CONFIRMED
-   CANCELLED
-   COMPLETED

## Messages

  Column
  --------------
  id
  patient_id
  direction
  message
  message_type
  created_at

Directions

-   INCOMING
-   OUTGOING

## Appointments

  Column
  -------------------
  id
  patient_id
  doctor_id
  clinic_id
  date
  time
  status
  booking_reference
  created_at

Appointment Status

-   PENDING
-   CONFIRMED
-   CANCELLED
-   COMPLETED

## Webhook Logs

  Column
  -------------
  id
  payload
  received_at
  processed

------------------------------------------------------------------------

# 4. Conversation Flow

``` text
START
   │
QR Token?
   ├── Yes → Identify Doctor
   │
   └── No
         │
         ▼
 Ask Clinic/Doctor
         │
         ▼
 Confirm Selection
         │
         ▼
 Ask Preferred Date
         │
         ▼
 Ask Preferred Time
         │
         ▼
 Validate
         │
         ▼
 Booking API
      │
      ├── Success
      │      ▼
      │  Confirmation
      │      ▼
      │ COMPLETED
      │
      └── Failure
             ▼
     Ask Another Time
```

Supported commands

-   cancel
-   restart
-   help
-   change doctor
-   change date
-   change time

------------------------------------------------------------------------

# 5. State Machine

``` text
START
   │
IDENTIFY_DOCTOR
   │
CONFIRM_DOCTOR
   │
WAITING_FOR_DATE
   │
WAITING_FOR_TIME
   │
VALIDATING
   │
BOOKING
   ├── Success → CONFIRMED → COMPLETED
   └── Failure → WAITING_FOR_TIME
```

------------------------------------------------------------------------

# 6. Backend API Specification

## POST /webhooks/whatsapp

Receives WhatsApp webhook.

Example

``` json
{
  "phone":"+919876543210",
  "message":"BOOK_D7",
  "messageId":"wamid.xxx"
}
```

Response

``` json
{
  "status":"received"
}
```

## POST /messages/send

``` json
{
  "phone":"+919876543210",
  "text":"Appointment confirmed."
}
```

## POST /appointments

``` json
{
  "patientId":15,
  "doctorId":7,
  "clinicId":2,
  "date":"2026-07-10",
  "time":"17:00"
}
```

Success

``` json
{
  "success":true,
  "appointmentId":512,
  "bookingReference":"APT-20260710-512"
}
```

Failure

``` json
{
  "success":false,
  "error":"Slot unavailable"
}
```

## GET /qr/{token}

Returns doctor and clinic mapped to the QR token.

------------------------------------------------------------------------

# 7. Validation Rules

-   QR token must exist.
-   Doctor must be active.
-   Clinic must be active.
-   Date cannot be in the past.
-   Time must be valid.
-   Slot must be available.
-   Prevent duplicate bookings.
-   Verify webhook signatures.
-   Make booking API idempotent.

------------------------------------------------------------------------

# 8. Logging & Monitoring

Log:

-   Incoming webhook
-   Conversation state
-   State transition
-   Validation result
-   Booking request
-   Booking response
-   Outgoing WhatsApp message
-   Errors

------------------------------------------------------------------------

# 9. Edge Cases

-   Duplicate webhook deliveries
-   User inactivity
-   Invalid QR token
-   Invalid date/time
-   Doctor unavailable
-   Clinic closed
-   Backend timeout
-   User changes doctor midway
-   User cancels booking
-   Concurrent messages

------------------------------------------------------------------------

# 10. Testing Checklist

-   New patient
-   Returning patient
-   QR flow
-   Manual clinic flow
-   Successful booking
-   Booking failure
-   Cancellation
-   Restart
-   Timeout
-   Duplicate webhook
-   Invalid token
-   Invalid date/time

------------------------------------------------------------------------

# 11. Suggested Folder Structure

``` text
src/
 ├── controllers/
 ├── routes/
 ├── services/
 ├── repositories/
 ├── models/
 ├── chatbot/
 │     ├── state_machine/
 │     ├── transitions/
 │     ├── validators/
 │     └── handlers/
 ├── webhooks/
 └── utils/
```

------------------------------------------------------------------------

# 12. Future LLM Integration (Optional)

Keep the conversation flow deterministic. Introduce an LLM only for:

-   Natural language understanding
-   Date/time extraction
-   Intent detection
-   FAQ responses
-   Human escalation
-   Structured entity extraction

The LLM should **not** control the workflow. The state machine remains
the source of truth, ensuring predictable behavior and easier debugging.
