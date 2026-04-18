# TheBeetamin — Learning Guide (From the Real Codebase)

**Audience:** Someone learning to code.  
**Rule:** Every example below comes from **this repository** (file names and patterns are real).  
**Note:** This project’s **middleware file is named `proxy.ts`** (not `middleware.ts`) — your Next.js setup uses that name.

---

## Section 1 — How the Internet Works (Using This Project)

### From typing the URL to seeing the landing page

1. You type something like `https://your-site.com/` in the **browser** (the **client**).
2. The browser sends an **HTTP request** to a **server** (often **Vercel** when deployed) running your **Next.js** app.
3. The server runs your **`app/page.tsx`** for the `/` route and sends back **HTML** (and JavaScript bundles).
4. Your browser downloads and runs React code. Many sections use **`'use client'`** (for example `components/sections/Hero.tsx`), so interactivity runs in the **browser**.

### **Server** vs **client** in this project

| **Server** | Runs on the hosting machine. Builds pages, runs **Route Handlers** under `app/api/*/route.ts`, runs **Server Actions** in `lib/booking-actions.ts` (files start with `'use server'`). |
| **Client** | The user’s browser. Runs anything marked **`'use client'`**, for example `app/booking/page.tsx`, `components/sections/Navbar.tsx`. |

### Why **Next.js** and not plain HTML

Plain HTML is static. **Next.js** gives you:

- **File-based routing** (`app/page.tsx` → `/`).
- **API routes** in one codebase (`app/api/assessment/route.ts` → `/api/assessment`).
- **React** for reusable UI (**components**).
- **Middleware** (`proxy.ts`) that runs before pages load to protect routes.

### What **rendering** means — **SSR** vs **CSR**

- **CSR (Client-Side Rendering):** The browser downloads JS and React **paints** the UI. Almost every page in this app is a **Client Component** (`'use client'` at the top), so the **interactive UI** is CSR-driven after hydration.
- **SSR (Server-Side Rendering):** The server can still send an initial HTML shell; Next.js hydrates it. **`app/layout.tsx`** has **no** `'use client'` — it wraps the app with **`ClerkProvider`** and is a **Server Component** by default.

**Why `app/booking/page.tsx` uses `'use client'`:** It needs **`useUser()`** and **`useRouter()`** from React — those only work in client components.

---

## Section 2 — How APIs Work in This Project

### What an **API** is (simple)

An **API** is a program on the server that answers HTTP requests. In this app, **booking-related browser calls** often go to **`/api/...`** routes or to **Server Actions** (not always visible as a URL in the Network tab the same way).

### **REST** and **endpoints**

**REST** is a style where URLs (**endpoints**) represent resources, and **methods** like **POST** mean “create or submit.”

This project’s **HTTP Route Handlers** live under `app/api/`:

| Endpoint | Method | File |
|----------|--------|------|
| `/api/assessment` | **POST** | `app/api/assessment/route.ts` |
| `/api/save-lead` | **POST** | `app/api/save-lead/route.ts` |
| `/api/reminders/cron` | **GET** | `app/api/reminders/cron/route.ts` |

**There is no `PUT` or `DELETE` route file** in `app/api` in this repo. Updates to appointments happen through **Server Actions** calling Supabase (see Section 2b below).

### Every **fetch()**-style call from the browser (real list)

#### 1) Submit assessment answers → AI report

- **File:** `app/assessment/page.tsx`  
- **URL:** `POST /api/assessment`  
- **Request:** JSON with `name`, `age`, `diet`, `goal`, and nested `answers` (energy, sleep, etc.).  
- **Response:** JSON result object (the AI “report”). The page does `await res.json()` then saves to **`localStorage`** as `assessmentResult` and `assessmentMeta`.  
- **UI after:** `router.push('/assessment/results')`.

#### 2) Save lead (fire-and-forget from assessment)

- **File:** `app/assessment/page.tsx` (after main assessment POST)  
- **URL:** `POST /api/save-lead`  
- **Request:** `{ name, email, phone, source: 'assessment' }`  
- **Response:** `{ ok: true }` on success. The code uses `.catch(() => {})` so failure does not block the user.  
- **UI after:** No change (user already navigating to results).

#### 3) Save lead from ₹29 purchase flow

- **File:** `app/assessment/purchase/page.tsx`  
- **URL:** `POST /api/save-lead`  
- **Request:** JSON including `plan` text and `source: 'assessment-purchase'`.  
- **Response:** Same as above.  
- **UI after:** Sets local “submitted” state to show confirmation UI.

#### 4) Cron reminders (not called by the user’s browser)

- **File:** `app/api/reminders/cron/route.ts`  
- **URL:** `GET /api/reminders/cron`  
- **Request headers:** Must include `Authorization: Bearer <CRON_SECRET>` or the handler returns **401**.  
- **Response:** JSON summary of reminders sent.  
- **Triggered by:** **Vercel Cron** (`vercel.json` schedules it), not the React app.

### What **`fetch()`** is here

**`fetch()`** is the browser’s built-in function to call URLs. Example from **`app/assessment/page.tsx`**:

```typescript
const res = await fetch('/api/assessment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* answers */ }),
})
```

Plain English: “Browser, please **POST** JSON to our own website’s `/api/assessment` route.”

### HTTP methods in **this** codebase

| Method | Real example |
|--------|----------------|
| **GET** | `export async function GET` in `app/api/reminders/cron/route.ts` — cron job **gets** pending reminders. |
| **POST** | `export async function POST` in `app/api/assessment/route.ts` and `app/api/save-lead/route.ts`. |
| **PUT** | *Not used* in any `app/api/*/route.ts` file. |
| **DELETE** | *Not used* in any `app/api/*/route.ts` file. |

**Related (not REST routes):** Supabase **`.update()`**, **`.delete()`**, **`.insert()`** inside **`lib/booking-actions.ts`** and **`lib/nutritionist-actions.ts`** — those run on the **server** via Server Actions / server code, not as `fetch('/api/...', { method: 'DELETE' })` from the browser.

### **Headers** and why they matter

Headers carry metadata. This project’s public `fetch` calls often set:

```typescript
headers: { 'Content-Type': 'application/json' }
```

So the server knows the body is JSON.

The **cron** route expects an **Authorization** header:

```typescript
const authHeader = req.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Clerk** does **not** send a manual `Authorization: Bearer` header in these `fetch` calls — Clerk uses **cookies** for session; **`auth()`** in **`proxy.ts`** reads that.

### **Status codes** this project returns (from `app/api` code)

| Code | Where | Meaning |
|------|--------|---------|
| **200** | Implicit on success | OK (JSON body returned). |
| **400** | `save-lead` | Missing `name` or `email`. |
| **401** | `reminders/cron` | Wrong or missing cron secret. |
| **500** | `assessment`, `save-lead` | Server or AI pipeline failed. |

---

## Section 3 — How Supabase Works in This Project

### What **Supabase** is

**Supabase** is **PostgreSQL** (a relational database) plus **Auth** and other tools, hosted for you. In this app it stores **clients**, **appointments**, **nutritionists**, **availability**, and **leads**.

### Database as real-world objects (from `SUPABASE_SETUP.sql` + code)

| Table | Like… |
|-------|--------|
| **`clients`** | A **folder for each patient** who bought the plan — holds Clerk id, email, phone, session counts, plan dates. |
| **`nutritionists`** | A **staff directory** — one row per nutritionist (name, email). |
| **`availability`** | **Office hours** — which day/time blocks a nutritionist offers. |
| **`appointments`** | **Calendar bookings** — links a **client** to a **nutritionist** with date, time, status. |
| **`leads`** | A **list of marketing contacts** from forms (name, email, phone, source). |

### Example **query** (plain English)

From **`lib/booking-actions.ts`** (pattern):

```typescript
const { data } = await supabaseAdmin
  .from('clients')
  .select('*')
  .eq('clerk_user_id', clerkUserId)
  .single()
```

Plain English: “Open the **`clients`** table. Find the **one** row where **`clerk_user_id`** equals this Clerk user’s id. Give me **all columns**.”

**`supabaseAdmin`** uses the **service role key** (server only) — it can bypass **RLS** if RLS were enabled.

### **RLS (Row Level Security)**

**RLS** lets the database enforce “users can only see their own rows.” In **`SUPABASE_SETUP.sql`**, RLS lines are **commented out** — so in a fresh setup, **RLS may be off** unless you turned it on in the Supabase dashboard.

Why it matters for this app: if RLS were on **without policies**, reads could fail; the app often uses the **service role** on the server instead of the user’s anon key for server actions.

### **Foreign keys**

- **`appointments.client_id`** → **`clients.id`** (each appointment belongs to one client).
- **`appointments.nutritionist_id`** → **`nutritionists.id`**.
- **`availability.nutritionist_id`** → **`nutritionists.id`**.
- **`appointments`** uses **`ON DELETE CASCADE`** from clients in the SQL file for client side — check your live DB for exact constraints.

### **Supabase Auth** (nutritionist)

When a nutritionist uses **`supabase.auth.signUp`** or **`signInWithPassword`** in **`app/sign-in/[[...sign-in]]/page.tsx`**, Supabase stores users in **`auth.users`** (managed by Supabase). Your public tables (`nutritionists`, etc.) are separate — you still need a row in **`nutritionists`** for dashboard lookups by email.

---

## Section 4 — How Authentication Works

### **Authentication** vs **authorization**

- **Authentication:** “Who are you?” — **Clerk** proves a **patient**; **Supabase Auth** proves a **nutritionist**.
- **Authorization:** “What are you allowed to do?” — **`proxy.ts`** only allows nutritionist cookie users on certain paths; **Clerk `auth.protect()`** blocks unauthenticated access to `/booking/*` routes.

### **JWT**, **session**, **cookies** (this project)

- **Clerk** uses its own **session** mechanism (cookies). You never manually parse JWTs in page code — you call **`useUser()`** or **`auth()`**.
- **Supabase** stores session tokens in the browser (typically **localStorage**). That is why the app sets a **`nut-email` cookie** — so **`proxy.ts`** can see something without reading localStorage.

### Walkthrough — **nutritionist** sign-in (real code path)

**File:** `app/sign-in/[[...sign-in]]/page.tsx` — function **`handleSignIn`**.

1. User enters password and submits the form.
2. Code runs **`supabase.auth.signInWithPassword({ email, password })`**.
3. If error → show message (including email-not-confirmed hint).
4. If success → **`document.cookie = ... nut-email=...`** then **`router.push('/nutritionist-dashboard')`**.

**Logout:** **`supabase.auth.signOut()`** and clear **`nut-email`** cookie (see nutritionist dashboard).

### **Nutritionist whitelist** — exact logic

**File:** `lib/nutritionist-config.ts`:

```typescript
export const ALLOWED_NUTRITIONIST_EMAILS: string[] = [
  'bhoomisingh2109@gmail.com',
  'sbhoomi23bca@student.mes.ac.in',
]

export function isNutritionistEmail(email: string): boolean {
  return ALLOWED_NUTRITIONIST_EMAILS.includes(email.toLowerCase().trim())
}
```

Line by line:

- **`ALLOWED_NUTRITIONIST_EMAILS`** — hardcoded list of emails allowed to use the nutritionist portal.
- **`isNutritionistEmail`** — normalizes email (lowercase, trim) and checks membership.

**Also** in the same sign-in file, **`handleEmailContinue`** checks **`ALLOWED_NUTRITIONIST_EMAILS.includes(trimmed)`** before showing the password field.

### **Patient** sign-up / sign-in

Patients use **Clerk’s `<SignIn />`** component — the exact network traffic is handled by **Clerk**, not custom Supabase auth. After sign-in, **`useUser()`** becomes active and **`proxy.ts`** can **`auth.protect()`** booking routes.

---

## Section 5 — How Middleware Works

### Simple analogy

**Middleware** is like a **security guard at the lobby** before you enter rooms (pages). It can **redirect** you if you do not have permission.

### The real file: **`proxy.ts`**

This project’s middleware is implemented in **`proxy.ts`** (not `middleware.ts`).

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { ALLOWED_NUTRITIONIST_EMAILS } from '@/lib/nutritionist-config'
```

- **`clerkMiddleware`** — Clerk’s wrapper so you can call **`auth()`** on each request.
- **`NextRequest` / `NextResponse`** — Next.js types for request/response, including **redirects**.

```typescript
function getNutEmailFromCookies(req: NextRequest): string | null {
  const cookie = req.cookies.get('nut-email')
  ...
}
```

- Reads the **`nut-email`** cookie set after nutritionist login.

```typescript
const isProtectedRoute = createRouteMatcher([
  '/booking/dashboard(.*)',
  ...
])
```

- **`createRouteMatcher`** — returns true if the current path matches these patterns — **patient-only** areas.

```typescript
export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname
  const { userId } = await auth()
  const nutEmail = getNutEmailFromCookies(req)
```

- **`userId`** — if Clerk has a logged-in **patient**, this is set.

```typescript
  if (!userId && nutEmail && ALLOWED_NUTRITIONIST_EMAILS.includes(nutEmail.toLowerCase().trim())) {
    const allowed =
      path.startsWith('/nutritionist-dashboard') ||
      path.startsWith('/sign-in') ||
      ...
    if (!allowed) {
      return NextResponse.redirect(new URL('/nutritionist-dashboard', req.url))
    }
    return
  }
```

- If **no Clerk user** but cookie says **whitelisted nutritionist**, only allow nutritionist URLs; otherwise **redirect** to dashboard.

```typescript
  if (isProtectedRoute(req)) await auth.protect()
})
```

- For patient routes, **require Clerk login**.

### **`config.matcher`**

```typescript
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|...)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

Runs middleware on **almost all routes** except static assets like `/_next/...`.

### If **`proxy.ts` was deleted**

- **Clerk `auth.protect()`** would not run → **booking pages might be exposed** depending on other checks.
- **Nutritionist route isolation** would break → they could hit `/` or `/booking` without the cookie gate.

---

## Section 6 — How Routing Works in Next.js (This App)

### **File-based routing**

| File path | URL |
|-----------|-----|
| `app/page.tsx` | `/` |
| `app/assessment/page.tsx` | `/assessment` |
| `app/assessment/results/page.tsx` | `/assessment/results` |
| `app/assessment/purchase/page.tsx` | `/assessment/purchase` |
| `app/booking/page.tsx` | `/booking` |
| `app/booking/onboard/page.tsx` | `/booking/onboard` |
| `app/booking/dashboard/page.tsx` | `/booking/dashboard` |
| `app/booking/new/page.tsx` | `/booking/new` |
| `app/booking/profile/page.tsx` | `/booking/profile` |
| `app/booking/success/page.tsx` | `/booking/success` |
| `app/sign-in/[[...sign-in]]/page.tsx` | `/sign-in`, `/sign-in/*` (Clerk catch-all) |
| `app/nutritionist-dashboard/page.tsx` | `/nutritionist-dashboard` |
| `app/nutritionist-dashboard/availability/page.tsx` | `/nutritionist-dashboard/availability` |
| `app/nutritionist-update-password/page.tsx` | `/nutritionist-update-password` |

### **Dynamic routes**

- **`[[...sign-in]]`** — **optional catch-all** for Clerk’s sign-in steps (factor two, etc.). Same file serves **`/sign-in`** and deeper paths.

### **`router.push` vs `router.replace`**

| API | Example in repo | Why |
|-----|-----------------|-----|
| **`router.push`** | `app/booking/page.tsx` — navigates to `/booking/onboard` | Adds history entry — user can go “back.” |
| **`router.replace`** | `app/nutritionist-dashboard/availability/page.tsx` — `router.replace('/sign-in')` | Replaces history — avoids back button returning to a broken state. |

### **`NextResponse.redirect` vs `router.push`**

- **`NextResponse.redirect`** — used in **`proxy.ts`** on the **server** before the page finishes loading.
- **`router.push`** — used in **React client components** after something happens (login, button click).

### Three journeys (files that run)

**A) New user → assessment → ₹3999 → signup → onboard → book → success**

1. `app/page.tsx` → `app/assessment/page.tsx` → `app/api/assessment/route.ts` → `app/assessment/results/page.tsx`  
2. User goes to `app/booking/page.tsx` → Clerk `app/sign-in/[[...sign-in]]/page.tsx`  
3. Back to `app/booking/page.tsx` → `app/booking/onboard/page.tsx` → `lib/booking-actions.ts` **`createClientProfile`**  
4. `app/booking/dashboard/page.tsx` or user opens `app/booking/new/page.tsx` → `app/booking/success/page.tsx`

**B) Returning user → login → profile**

1. `app/sign-in/[[...sign-in]]/page.tsx` → `app/booking/page.tsx` detects existing client → `app/booking/dashboard/page.tsx`  
2. User clicks Navbar → `app/booking/profile/page.tsx`

**C) Nutritionist → dashboard**

1. `app/sign-in/[[...sign-in]]/page.tsx` (nutritionist tab) → **`proxy.ts`** + cookie → `app/nutritionist-dashboard/page.tsx`

---

## Section 7 — How React Works in This Project

### What a **component** is

A **component** is a reusable function that returns UI. Examples:

1. **`components/sections/Navbar.tsx`** — the site navigation.
2. **`app/booking/onboard/page.tsx`** — default export **OnboardPage** (large form wizard).
3. **`components/ui/button.tsx`** — shared button styles.

### **State** (`useState`) — examples

This app has many state hooks. Examples:

| Location | State | Tracks |
|----------|-------|--------|
| `app/assessment/page.tsx` | `currentStep`, `answers`, `isLoading` | Wizard step and form data. |
| `components/sections/Navbar.tsx` | `menuOpen`, `scrolled` | Mobile menu and scroll style. |
| `app/nutritionist-dashboard/page.tsx` | `isLoading`, `dashboard`, `loadError` | Loading and fetched data. |

### **`useEffect`** — examples

| Location | What it does |
|----------|----------------|
| `app/booking/page.tsx` | When Clerk user is ready, runs routing logic (onboard vs dashboard vs ₹29 purchase). |
| `components/sections/AssessmentHero.tsx` | On mount, reads **`localStorage`** for `assessmentResult` to toggle “See My Test Results.” |
| `app/booking/dashboard/page.tsx` | Loads client dashboard data when `user` is ready. |

### **Props** — real example

In **`app/sign-in/[[...sign-in]]/page.tsx`**, **`NutritionistLogin`** is called as:

```tsx
<NutritionistLogin onSwitchToUser={() => setIsNutritionist(false)} />
```

**`onSwitchToUser`** is a **prop** — a function passed from parent to child so the child can switch the tab back to “Patient.”

### **Conditional rendering** — examples

- **`components/sections/Navbar.tsx`:** `{!isSignedIn ? ( ... Log In ... ) : ( ... My Profile ... )}`  
- **`app/assessment/purchase/page.tsx`:** If not signed in, show auth gate UI; if signed in, show purchase UI.  
- **`app/sign-in/[[...sign-in]]/page.tsx`:** If **`clerkUserBlockedOnNutTab`**, show “Access Denied” block.

---

## Section 8 — Environment Variables

### What they are

**Environment variables** are named settings (API keys, URLs) stored **outside** source code so secrets are not committed to Git.

### Names referenced in code (do not paste real values)

| Variable | Used for |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (browser + server). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — server-only admin DB access. |
| `GROQ_API_KEY` | Groq AI for `/api/assessment`. |
| `RESEND_API_KEY` | Email sending. |
| `RESEND_FROM_EMAIL` | From address for emails. |
| `CRON_SECRET` | Protects `/api/reminders/cron`. |
| Clerk keys | Typically `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and URL vars — see your **`.env.local`**. |

### If one is wrong

- Missing **Groq** key → assessment API returns **500**.
- Missing **Resend** → lead emails fail.
- Missing **Clerk** keys → sign-in breaks.
- Missing **`SUPABASE_SERVICE_ROLE_KEY` on server** → server actions error.

### Why not in code

If secrets are in GitHub, anyone with repo access can steal your database and send email as you.

### Local vs **Vercel**

- **Local:** `.env.local` (gitignored).  
- **Production:** Set the same names in **Vercel → Project → Settings → Environment Variables**.

---

## Section 9 — Payments

**This codebase does not include Razorpay or Stripe in `package.json`.**

### “Buy ₹29 Plan” today

In **`app/assessment/purchase/page.tsx`**, **Confirm** runs **`fetch('/api/save-lead', ...)`** — it **saves a lead** and shows a success screen. It is **not** a real card charge in code — it is a **simulated / marketing flow** unless you add a payment provider.

### **Webhook**

No Stripe/Razorpay webhook route appears in `app/api`. The **cron** route is a different idea — Vercel calls it on a schedule.

### Going live

You would add a payment SDK, create a **server-side** order or session, use **webhooks** to confirm payment, and only then mark the user as paid in **`clients`** or a new **`payments`** table.

---

## Section 10 — Deployment

1. **`git push`** to GitHub (typical).  
2. **Vercel** connects to the repo and runs **`npm run build`** (`next build`).  
3. **Build** compiles TypeScript, bundles React, prepares serverless functions for API routes.  
4. **Environment variables** must be copied from `.env.local` to Vercel’s dashboard.  
5. **Domain:** In Vercel, attach a domain; DNS points to Vercel.  
6. **Auto deploy:** Usually **yes** on push to main — depends on your Vercel project settings.

---

## Section 11 — Things That Can Go Wrong

| Symptom | Meaning | Where to look |
|---------|---------|----------------|
| **Supabase connection / “Invalid API key”** | Wrong URL or key | `.env.local`, Vercel env, `lib/supabase.ts` |
| **Auth session not found** | Clerk or Supabase session missing | Cookies blocked, expired session, wrong domain |
| **Redirect loops** | Middleware + client redirects fighting | **`proxy.ts`**, `app/booking/page.tsx` |
| **401 on `/api/reminders/cron`** | `Authorization` header does not match **`CRON_SECRET`** | Vercel cron config |
| **400/500 on APIs** | Validation or AI/email failure | `app/api/*/route.ts` logs |
| **Missing env** | Build/runtime error naming variable | Vercel env |
| **404 on existing route** | Wrong deployment or typo in URL | Check `app/` folder structure |

---

## Section 12 — Glossary (One Line Each + Example)

| Term | Definition | Example here |
|------|--------------|--------------|
| **API** | Server code that answers HTTP requests. | `app/api/assessment/route.ts` |
| **Endpoint** | URL path for an API. | `/api/save-lead` |
| **Request** | What the browser sends (method, body, headers). | `POST` with JSON body |
| **Response** | What the server sends back (status + JSON). | `{ ok: true }` |
| **JWT** | Signed token format (often used inside sessions). | Clerk / Supabase handle details for you. |
| **Session** | “Logged in” state tracked over multiple pages. | Clerk cookies; Supabase session object |
| **Cookie** | Small string stored by the browser per site. | `nut-email` for middleware |
| **Middleware** | Code running before routes resolve. | `proxy.ts` |
| **Route guard** | Block or redirect if not allowed. | `auth.protect()` |
| **Component** | Reusable UI function. | `Navbar.tsx` |
| **State** | Data that can change and re-render UI. | `useState` in `assessment/page.tsx` |
| **Props** | Inputs passed into a component. | `onSwitchToUser` |
| **Hook** | Functions like `useState`, `useEffect`. | `useUser()` from Clerk |
| **SSR** | HTML generated on server. | Default server components + layout |
| **CSR** | UI driven by JavaScript in browser. | `'use client'` pages |
| **Hydration** | React attaching to server HTML. | Next.js + React 19 |
| **RLS** | Row Level Security in Postgres. | Optional in `SUPABASE_SETUP.sql` |
| **Foreign key** | Column pointing to another table’s id. | `appointments.client_id` |
| **Query** | Asking the database for rows. | `.from('clients').select(...)` |
| **Environment variable** | Config outside code. | `GROQ_API_KEY` |
| **Webhook** | HTTP callback from a service. | Not implemented for payments; cron is scheduled GET |
| **Build** | `next build` compiling the app. | CI / Vercel |
| **Deploy** | Uploading build to servers. | Vercel |

---

## Appendix A — Every `useState` in this project (inventory)

| File | State variables (names) |
|------|-------------------------|
| `app/assessment/page.tsx` | `currentStep`, `direction`, `isLoading`, `answers` |
| `app/assessment/results/page.tsx` | `result`, `meta`, `scoreAnimated` |
| `app/assessment/purchase/page.tsx` | `meta`, `submitted`, `isLoading` |
| `app/booking/page.tsx` | (none — only `useEffect` + `useUser`) |
| `app/booking/onboard/page.tsx` | `step`, `isSubmitting`, `error`, `form` (object in useState) |
| `app/booking/dashboard/page.tsx` | `data`, `isLoading` |
| `app/booking/new/page.tsx` | `isVerifying`, `nutritionistOpen`, `calOpen`, `isLoadingSlots`, `reason`, `notes`, `isSubmitting`, `error`, + slot-related state |
| `app/booking/profile/page.tsx` | `data`, `isLoadingData`, `activeTab`, `editMode`, `editPhone`, `editGoal`, `isSaving`, `saveSuccess`, `cancellingId` |
| `app/booking/purchase/page.tsx` | `form`, `isSubmitting`, `submitted` |
| `app/booking/success/page.tsx` | *(no `useState` — uses `useSearchParams` / display only)* |
| `app/sign-in/[[...sign-in]]/page.tsx` | `isNutritionist`; `NutritionistLogin` has `step`, `mode`, `email`, `password`, `confirmPassword`, `showPass`, `showConfirmPass`, `error`, `info`, `loading` |
| `app/nutritionist-dashboard/page.tsx` | modal fields `notes`, `rejectReason`; `nutEmail`, `dashboard`, `isLoading`, `loadError`, `activeTab`, `selectedAppt` |
| `app/nutritionist-dashboard/availability/page.tsx` | `isLoading`, `isSaving`, `saved`, slots state |
| `app/nutritionist-update-password/page.tsx` | `password`, `confirmPassword`, `showPass`, `showConfirm`, `loading`, `error`, `done`, `sessionReady` |
| `app/nutritionist/page.tsx` | (legacy dashboard — similar modal state) |
| `app/nutritionist/availability/page.tsx` | same pattern as dashboard availability |
| `app/nutritionist-login/page.tsx` | `email`, `emailChecked`, `emailError` |
| `components/sections/Navbar.tsx` | `scrolled`, `menuOpen` |
| `components/sections/AssessmentHero.tsx` | `hasResults` |
| `components/sections/PricingSection.tsx` | (booking status fetch — see file) |
| `components/PageLoader.tsx` | `visible` |
| `components/ui/CalendarPicker.tsx` | `viewMonth` |
| `components/sections/PricingSection.tsx` | uses `useState` for booking info when needed |

*Exact counts can drift as the repo changes — search the codebase for `useState` to verify.*

---

*End of TheBeetamin Learning Guide.*
