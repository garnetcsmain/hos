# HOS — External Dependencies, Auth & API Keys

**Everything the system needs from the outside world**, what it's for, the exact
env var(s) to set, where it plugs into the code, and what it costs / what to watch
for. This is your shopping list: hand me the keys (or just the ones you want), and
I wire them.

> The MVP **runs today with none of these set** — local SQLite + the deterministic
> rule engine. Each item below moves it from "runs on a laptop for evaluation"
> toward "deployed and reaching real families." Provision in the priority order in
> the last section.

Legend: ✅ wired (just needs a key) · 🟡 half-wired (adapter to write) · ⬜ not started

---

## Master table

| # | Capability | Status | Provider (recommended) | Env vars | Plugs into |
|---|------------|--------|------------------------|----------|------------|
| 1 | Cloud AI matching boost | ✅ | Anthropic and/or OpenAI | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `HOS_AI_PROVIDERS` | `apps/web/app/lib/ai/` |
| 2 | Coordinator access gate | ✅ | (self — a shared secret) | `HOS_COORDINATOR_TOKEN` | `apps/web/app/lib/http/auth.ts` |
| 3 | Production database | ✅ | Supabase / Postgres (`pgvector`) | `DATABASE_URL` | `apps/web/app/lib/db/`, `repositories/` |
| 4 | Real user auth + roles | ⬜ | Supabase Auth / Clerk / Auth0 (OIDC) | provider-specific (below) | `http/auth.ts` + new middleware |
| 5 | Maps / geocoding | 🟡 | Google Maps Platform *(or Mapbox)* | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` | location factor + map UI |
| 6 | SMS notifications | ⬜ | Twilio *(or AWS SNS)* | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM` | new `notifications/channels/` |
| 7 | WhatsApp notifications | ⬜ | Meta WhatsApp Cloud API *(or Twilio)* | `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN`, `WHATSAPP_VERIFY_TOKEN` | same |
| 8 | Email notifications | ⬜ | Resend *(or SES/Postmark)* | `RESEND_API_KEY`, `HOS_EMAIL_FROM` | same |
| 9 | Telegram notifications | ⬜ | Telegram Bot API | `TELEGRAM_BOT_TOKEN` | same |
| 10 | Photo / file storage | ⬜ | Supabase Storage / S3 / R2 | `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` | new upload route |
| 11 | **Facial recognition** | ⬜ | **self-hosted InsightFace** *(or AWS Rekognition)* — **board + legal first** | `HOS_FACE_PROVIDER`, `AWS_*` / model host | new `matching/face/` |
| 12 | Abuse / spam protection | ⬜ | Cloudflare Turnstile *(or reCAPTCHA)* | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | public intake routes |
| 13 | Error & uptime monitoring | ⬜ | Sentry | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | global |
| 14 | Hosting / deploy | 🟡 | Vercel (web) + Supabase (data) | Vercel project + env sync | CI/CD |

---

## 1. Cloud AI matching boost ✅ *(wired — give me a key)*

**What:** layers an LLM judgment on top of the rule engine (blended 50/50) to catch
nuance the hand-tuned weights miss. Multi-provider; runs several at once; off unless
a key is present. PII is minimized before any external call.

**Give me one or both:**
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
HOS_AI_PROVIDERS=anthropic,openai          # optional; auto-detected from keys if omitted
# HOS_ANTHROPIC_MODEL=claude-opus-4-8      # default. claude-haiku-4-5 for cheap high-volume scoring
# HOS_OPENAI_MODEL=gpt-4o-mini
```
- **Where:** `apps/web/app/lib/ai/` (config, providers, blend). Already complete.
- **Get keys:** console.anthropic.com → API Keys · platform.openai.com → API Keys.
- **Cost:** pay-per-token. Opus 4.8 ≈ $5/$25 per 1M in/out; Haiku 4.5 ≈ $1/$5 — use
  Haiku for pairwise scoring at volume.
- **Privacy:** we strip names→initials/age-bands before sending; confirm your DPA /
  zero-retention posture with the provider for crisis PII.

## 2. Coordinator access gate ✅ *(wired — pick a secret)*

**What:** gates privileged endpoints (match review, verify, notify, timeline).
```
HOS_COORDINATOR_TOKEN=<long-random-string>     # openssl rand -hex 32
```
- **Where:** `apps/web/app/lib/http/auth.ts` (constant-time compare).
- **⚠ Important:** if this is **unset, those endpoints are open** (dev convenience).
  The board flagged this (D3) — **set it before any deploy.** This is a stopgap until
  real auth (#4).

## 3. Production database ✅ *(adapter BUILT — give me `DATABASE_URL` to flip it on)*

**What:** replace local `node:sqlite` with managed Postgres for multi-instance,
backups, HA, and `pgvector` (needed for learned/photo matching later).
```
DATABASE_URL=postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```
- **Status (HOS-2026-001-07):** the adapter is written and merged behind the
  repository layer as an **async dual-adapter** — one async interface, two
  backends (`node:sqlite` for zero-setup local/dev/test, Postgres via `pg` for
  prod), chosen by `DATABASE_URL`. `pgvector` is enabled and a `match_embeddings`
  table is provisioned. The SQLite path is fully verified (typecheck + 85/85
  tests + clean `next build`). All that remains is to point `DATABASE_URL` at the
  hosted DB and run the suite against Postgres, then a preview deploy.
- **Where:** `apps/web/app/lib/db/` (client + `backends/{sqlite,postgres}.ts` +
  `schema.pg.ts`) and the committed migration at `supabase/migrations/`.
- **Get it:** a Supabase project already exists — **"Humanitarian Operating
  System (HOS)"**, ref `obgwvtnzclyaugmrjukk`. I just need its **pooler connection
  string** (Dashboard → Project Settings → Database → Connection string →
  *Transaction pooler*, with the DB password). Drop it into
  `apps/web/.env.local` as `DATABASE_URL=` (gitignored) or hand it over.
- **Cost:** Supabase free tier is fine for a pilot; ~$25/mo Pro for backups + no pausing.

## 4. Real user auth + roles ⬜ *(design + build — this is the big one)*

**What:** replace the single shared token with per-user accounts, roles
(coordinator / agency-admin / responder), and org isolation so multiple responding
agencies can share an instance without seeing each other's PII. Public intake/search
stay account-free for families.

**Pick one** (tell me which and I'll wire it):
- **Supabase Auth** — simplest if we're already on Supabase. `SUPABASE_URL` +
  `SUPABASE_ANON_KEY` + `SUPABASE_JWT_SECRET`. Email/OTP/phone login built in.
- **Clerk** — best DX/UI. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
- **Auth0 / generic OIDC** — if you have an org IdP. `AUTH0_DOMAIN`,
  `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET`.
- **Where:** `http/auth.ts` becomes session/JWT verification + a roles middleware.
- **Decision:** which provider, and the role model. Worth a board proposal — it's a
  "security model change" (Strategic per the governance doc).

## 5. Maps / geocoding 🟡 *(you named this — partly wired)*

**What three things maps buy us:**
1. **Geocoding** last-known locations to lat/lng → makes the matching **location
   factor** real (distance) instead of string-equality on place names.
2. **Place autocomplete** on intake forms → clean, consistent location data.
3. **Map display** of cases/shelters in the console (embed is already supported via
   `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL`).

**Google Maps Platform** (what you asked for):
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...     # browser key — RESTRICT to your domains (HTTP referrer)
GOOGLE_MAPS_API_KEY=...                 # server key — RESTRICT by IP, for server-side Geocoding
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL=...   # already supported
```
- **APIs to enable** in Google Cloud Console: *Maps JavaScript API*, *Geocoding API*,
  *Places API*, *Maps Embed API*. Requires a **billing account** (has a free monthly
  credit; set budget alerts and per-key API restrictions or it can get expensive).
- **Where:** geocoding feeds `apps/web/app/lib/matching/` (location factor); autocomplete
  in `IntakeForms.tsx`; map panel in the match console.
- **Free alternative:** **Mapbox** (`NEXT_PUBLIC_MAPBOX_TOKEN`) or **OpenStreetMap /
  Nominatim** (no key, usage-policy-limited) — better privacy, no Google billing. Tell
  me if you'd rather avoid Google.

## 6–9. Notification channels ⬜ *(deferred D4 — wire any subset)*

On a human-verified match we currently queue an **in-app** message only. To actually
reach families, pick channels. **In Venezuela, WhatsApp + SMS matter most; email least.**

**SMS — Twilio** (or AWS SNS):
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_SMS_FROM=+1...                 # or a Messaging Service SID
```
**WhatsApp — Meta WhatsApp Cloud API** (most reliable in-region; or Twilio WhatsApp):
```
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_TOKEN=...                     # permanent system-user token
WHATSAPP_VERIFY_TOKEN=<self-chosen>   # webhook verification
```
- Requires a **Meta Business account + verified WhatsApp Business number**, and
  **pre-approved message templates** (utility category) for first-contact — plan ~days
  for review.

**Email — Resend** (or SES/Postmark):
```
RESEND_API_KEY=re_...
HOS_EMAIL_FROM="HOS <alerts@yourdomain.org>"
```
- Needs a domain with SPF/DKIM records you control.

**Telegram — Bot API** (cheap, instant, no per-message cost):
```
TELEGRAM_BOT_TOKEN=...                 # from @BotFather
```
- **Where (all of the above):** a new `notifications/channels/` dispatcher behind the
  existing notification repository; the queue + redaction already exist.
- **Compliance:** opt-in/consent capture at intake, STOP/opt-out handling, and quiet
  hours. I'll build these in with the first channel.

## 10. Photo / file storage ⬜ *(prerequisite for photos + facial recognition)*

```
S3_BUCKET=hos-media
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=...                        # set for Cloudflare R2 / Supabase Storage / MinIO
```
- **Recommended:** Supabase Storage (if on Supabase) or **Cloudflare R2** (no egress
  fees). Private bucket + signed URLs only — these are photos of vulnerable people.

## 11. Facial recognition ⬜ — **read this before provisioning anything**

You named this explicitly. It's the highest-value *and* highest-risk addition, and it
was deliberately deferred to v2 in HOS-2026-001. **I recommend it gets its own board
proposal (HOS-2026-006) + a human/legal sign-off before we build it**, because:

- It processes **biometric data of vulnerable people**, often gathered without clean
  consent in a crisis. Many jurisdictions class this as special-category data (GDPR
  Art. 9, BIPA-style laws) with strict rules.
- **Venezuela context specifically:** a searchable face database of missing/displaced
  people is a **surveillance and targeting risk** if it leaks or is subpoenaed by a
  hostile actor. The threat model is not just "false match" — it's "this DB is misused
  against the people it was meant to help."
- **False matches are high-harm** here (wrong family sent to a morgue/shelter), so any
  face match must remain *advisory*, human-verified, never auto-confirmed.

**Technical options (if/when approved):**
- **Self-hosted (recommended for privacy): InsightFace / ArcFace** embeddings computed
  on infra you control; store only **vectors** in `pgvector`, do cosine-similarity
  search, and (ideally) **never persist the raw photo** longer than needed. No biometric
  PII leaves your perimeter.
  ```
  HOS_FACE_PROVIDER=insightface
  HOS_FACE_MODEL_URL=...        # your hosted embedding endpoint (GPU)
  ```
- **AWS Rekognition** (managed, fast to stand up; sends biometrics to AWS):
  ```
  HOS_FACE_PROVIDER=rekognition
  AWS_REGION=...
  AWS_ACCESS_KEY_ID=...
  AWS_SECRET_ACCESS_KEY=...
  HOS_REKOGNITION_COLLECTION_ID=hos-faces
  ```
- **Azure Face** — identification is **access-gated**; requires an approved
  Limited Access application. Slower to start.
- **Google Cloud Vision** — detects faces but **does not do identity matching**;
  insufficient on its own.

- **Where:** a new `apps/web/app/lib/matching/face/` provider feeding candidate scores
  into the same explainable evidence chain (a face hit is one weighted factor, not an
  override). Needs storage (#10) and ideally `pgvector` (#3).
- **What I need from you to proceed:** (a) board + human/legal approval, (b) chosen
  provider, (c) a consent + retention policy, (d) keys/host per the chosen option.

## 12. Abuse / spam protection ⬜

Public intake is intentionally open → it will attract spam/abuse. Add a challenge:
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...     # Cloudflare Turnstile (free, privacy-friendly)
TURNSTILE_SECRET_KEY=...
```
(Or Google reCAPTCHA.) Plugs into the public `missing` / `found` / `search` routes.

## 13. Error & uptime monitoring ⬜

```
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...
```
Cheap insurance for a system people depend on in an emergency.

## 14. Hosting / deploy 🟡

- **Web:** Vercel (your `fsulbaran` account). I can wire a project + sync the env vars
  above into Production/Preview when you say go (no deploy without your per-action OK).
- **Data:** Supabase (per #3).
- **CLI agents:** the `hos` board CLI reads `ANTHROPIC_API_KEY` from a root `.env` to
  run live board reviews (see #1).

---

## Fastest path to a real pilot (recommended order)

1. **`HOS_COORDINATOR_TOKEN`** — 30 seconds, closes the open-endpoint hole. *(#2)*
2. **Supabase project** (`DATABASE_URL` + enable `pgvector`) — durable, multi-user data. *(#3)*
3. **One AI key** (`ANTHROPIC_API_KEY`) — turns on the matching boost. *(#1)*
4. **WhatsApp Cloud API** — the channel that actually reaches Venezuelan families. *(#7)*
5. **Google Maps key** (or Mapbox) — makes location matching real + maps in the UI. *(#5)*
6. **Real auth** (Supabase Auth) + **Turnstile** — before opening to multiple agencies. *(#4, #12)*
7. **Facial recognition** — only after a board pass + legal/consent sign-off. *(#11)*

## Copy-paste checklist — hand me whichever you have

```
# Tier 1 (pilot-critical)
HOS_COORDINATOR_TOKEN=
DATABASE_URL=                       # or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + SUPABASE_ANON_KEY
ANTHROPIC_API_KEY=

# Tier 2 (reach + quality)
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TOKEN=
WHATSAPP_VERIFY_TOKEN=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SMS_FROM=
RESEND_API_KEY=
HOS_EMAIL_FROM=

# Tier 3 (hardening + scale)
# auth provider keys (tell me which: Supabase Auth / Clerk / Auth0)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
SENTRY_DSN=

# Tier 4 (board + legal gate first)
HOS_FACE_PROVIDER=
# + provider keys per the chosen facial-recognition option
```

> **How to hand them over:** put real values in `apps/web/.env.local` (gitignored) or
> the root `.env` for the CLI — never commit them. Or drop them in Vercel project env.
> Tell me which you've set and I'll wire and verify each one.
