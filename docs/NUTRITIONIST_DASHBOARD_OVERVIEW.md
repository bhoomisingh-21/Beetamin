# Nutritionist Dashboard — Overview & Operating Guide

This document explains what a nutritionist sees and does inside The Beetamin portal,
how the post-purchase customer journey works, and which admin controls support it.

---

## 1. Logging in

Nutritionists sign in at **`/nutritionist-login`** with the exact Google email that an
admin registered for them. Two auth paths are supported:

- **Clerk (Google)** — standard sign-in.
- **`nut-session` cookie** — an HMAC-signed session for the portal.

Only emails present in the `nutritionists` table (and listed as nutritionist emails in
config) can reach the portal. Everyone else is rejected.

---

## 2. What the nutritionist sees after login

The portal home (`/nutritionist`) shows a daily working view:

- **Today's sessions** with live slot status (Upcoming / In Progress / Completed).
- **Stats**: active clients, sessions this week, sessions today, pending booking requests.
- **Next 7 days** of upcoming sessions.
- **Pending requests** awaiting confirm/decline.

---

## 3. Accessing assigned customers ("My Clients")

The **My Clients** list (`/nutritionist/clients`) is **scoped per nutritionist**: a
nutritionist only sees clients they have **at least one appointment with**. They do not
see the whole platform's client base.

This is enforced server-side:

- `getNutritionistPortalClients` collects the nutritionist's `appointments`, derives the
  set of `client_id`s, and only loads those clients.
- `getNutritionistClientBundle` calls `nutritionistOwnsClient()` before returning a
  profile — an unrelated nutritionist gets `null` (no access).
- Notes, documents, and diet plans can only be created for owned clients.

---

## 4. Viewing customer details

Opening a client opens their profile with tabs:

- **Overview** — deficiency profile (from the paid report), key progress stats, quick links.
- **Notes** — session notes, pinning, client-visible toggle, tag filters.
- **Diet Plan** — upload and manage the client's personalised diet plan (see §5).
- **Documents** — intake forms, lab reports, and other files.
- **Progress** — weight/BMI/energy/sleep charts from the client's logs.

---

## 5. Creating & delivering diet plans

The flow is intentionally simple: **the nutritionist uploads a PDF and the customer is
notified automatically.**

On the **Diet Plan** tab:

1. Enter a plan title (e.g. "Week 1–4 Iron Recovery Plan").
2. Drop or select a **PDF** (max 10MB).
3. Click **Upload & notify client**.

What happens on upload (`uploadDietPlan`):

- Ownership is re-checked server-side.
- The PDF is stored in the private **`diet-plans`** storage bucket.
- A row is written to the **`diet_plans`** table (with an auto-incrementing `version`).
- The customer is emailed a **"Your diet plan is ready"** message containing a secure,
  7-day signed download link (`sendDietPlanReadyEmail`). `notified_at` is recorded.

The nutritionist can re-download or delete any version from the same tab.

### How the customer receives it

- **Email** — direct secure download link (primary delivery).
- **In-app** — on their **`/sessions`** page under **"Your diet plans"**, each plan has a
  Download button that hits `/api/diet-plan/download?id=…`. That route verifies the signed-in
  user owns the plan and issues a fresh signed URL, so links never go stale.

---

## 6. Tracking progress

The **Progress** tab visualises the client's self-logged metrics (weight, BMI, energy,
sleep). Combined with notes, this gives the nutritionist context before each session.

---

## 7. Managing consultations & follow-ups

- **Pending requests** appear on the home view and can be confirmed or declined.
- Confirmed sessions show date/time and the assigned nutritionist.
- Sessions are unlocked sequentially (Session N requires Session N-1 complete) across the
  6-session plan.
- After a session, mark it complete and capture notes; the next session becomes bookable.

---

## 8. Expected daily actions

1. Review **Today's sessions** and confirm any **pending requests**.
2. Before each call, open the client profile (Overview + Notes + Progress).
3. After each call, **mark complete** and add **session notes**.
4. Upload or update **diet plans** where due; the customer is notified automatically.
5. Clear the pending-requests queue by end of day.

---

## 9. Customer journey after the ₹3,999 plan purchase (as implemented)

1. Customer pays via PayU; the success callback (`/api/payment/success`) runs.
2. Order is persisted: the `purchases` row is activated and the `clients` row is
   updated (including the **phone number** captured from PayU).
3. A **professional confirmation email** is sent once on first activation
   (`sendFullPlanConfirmationEmail`), prompting the customer to book their first session.
4. Customer books a session and **self-picks** a nutritionist at booking time. That
   booking is what links them to a nutritionist (and makes them appear in that
   nutritionist's **My Clients**).
5. Nutritionist reviews the customer (report, notes, progress).
6. Nutritionist uploads the **personalised diet plan (PDF)**.
7. Customer is **notified the plan is ready** (email + in-app download).
8. Follow-up sessions proceed through the 6-session plan; progress is tracked throughout.

> Notes on current choices:
> - **Assignment** is self-pick at booking (no auto-assign / queue yet).
> - **Notifications** are **email-only** for now (SMS/WhatsApp deferred).

---

## 10. Admin controls

Admins manage nutritionists at **`/admin/nutritionists`** (no SQL editing required):

- **Add** a nutritionist (name, Google login email, short bio).
- **Edit** name / email / bio inline.
- **Deactivate / Reactivate** — inactive nutritionists are hidden from **new bookings**
  (`getNutritionists` filters `is_active = true`) but keep all history (appointments FK
  is preserved; we never hard-delete).
- Per nutritionist, view appointment counts (total / completed / upcoming) and jump to
  their appointments.

Backed by `/api/admin/nutritionists` (GET / POST / PATCH), guarded by `requireAdminApi()`,
which accepts both Clerk admin sessions and verified `nut-session` admin cookies.

---

## 11. Database & infrastructure added

Run these migrations (in `supabase/migrations/`):

- `20260609120000_diet_plans.sql` — `diet_plans` table + private `diet-plans` storage bucket.
- `20260609130000_nutritionists_is_active.sql` — `nutritionists.is_active` flag.

Relevant env vars: `RESEND_API_KEY` (emails), `COOKIE_SECRET` (nut-session), Supabase
service-role config (already present).

---

## 12. Still pending (by request)

- **Real nutritionist data** — to be added later via the admin UI above.
- Optional future work: auto-assignment/queue, SMS/WhatsApp notifications, and a
  structured in-app diet-plan builder (current flow is PDF upload).
