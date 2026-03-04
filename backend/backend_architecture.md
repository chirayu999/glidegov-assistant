# GovGlide Backend Architecture

Rails API backend for GovGlide: scheme discovery, eligibility reasoning, and visual form navigation. Uses **Rails 7**, **Sidekiq**, and **ActionCable** for live updates. PII is not stored at rest (DPDP-aligned).

## 1. Architecture Overview

- **REST API:** Sessions, scheme discovery, eligibility, form navigation triggers.
- **ActionCable:** Live updates to the frontend (chat messages, form step progress, handoff to user for OTP/review).
- **Sidekiq:** Background jobs for discovery, eligibility, and Playwright-based form navigation.

Frontend connects to the API with a `session_id` and subscribes to the session channel for real-time events.

## 2. Models (no PII at rest)


| Model                | Purpose                                 | Key attributes                                                                                                          |
| -------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Session**          | One conversation/visit; pause & resume  | `uuid`, `locale`, `last_step`, `status` (active/paused/handoff), `expires_at`                                           |
| **Scheme**           | Cached scheme from discovery            | `external_id`, `name`, `source_url`, `domain`, `summary`, `raw_criteria`, `cached_at`                                   |
| **FormProgress**     | Current form state per session + scheme | `session_id`, `scheme_id`, `current_step_index`, `total_steps`, `state` (draft/pending_otp/handoff), `last_activity_at` |
| **ConversationTurn** | Chat history (no PII)                   | `session_id`, `role` (user/assistant), `content_text`, `content_type`, `created_at`                                     |


Session is the main aggregate. Scheme is filled by discovery/eligibility. FormProgress is updated by the form navigation flow and broadcast over ActionCable.

## 3. Services

- **SchemeDiscoveryService:** Google Custom Search restricted to .gov.in/.nic.in; persist Scheme records; can run in Sidekiq.
- **EligibilityService:** Gemini 1.5 Pro: scheme PDF/text + anonymized profile → eligible / action_required / ineligible + reason.
- **FormNavigationService:** Playwright + Gemini Vision: open portal, screenshot, get coordinates, fill fields; PII only in-memory per request; broadcast step and handoff via ActionCable.
- **SessionStoreService:** Create/load/update Session and FormProgress (no PII).
- **ConversationService:** Append ConversationTurn for Chat and for agent flows.

## 4. REST API (summary)

- `POST /api/sessions` – create session; return `session_id`.
- `GET /api/sessions/:id` – get session + last progress + scheme summary (resume).
- `PATCH /api/sessions/:id` – update last_step, status.
- `POST /api/schemes/discover` – discover schemes (query, session_id); sync or 202 + job_id.
- `POST /api/eligibility/check` – check eligibility for session + scheme_ids; sync or 202 + Cable updates.
- `POST /api/form_navigation/start` – start form flow (session_id, scheme_id, start_url); 202 + job_id; progress via Cable.
- `GET /api/form_navigation/status` – current FormProgress for session (optional scheme_id).
- `GET /api/sessions/:id/turns` – conversation turns for Chat.
- `POST /api/sessions/:id/turns` – append turn (no PII in body).

## 5. ActionCable

- **Channel:** e.g. `Govglide::SessionChannel`; subscribe with `session_id`.
- **Broadcasts:** `message` (assistant text), `form_progress` (step_index, total_steps, message, state), `handoff` (reason: otp/captcha/review, optional url). Frontend uses these for Chat, AutoFiller, and FinalReview.

## 6. Sidekiq Jobs

- **SchemeDiscoveryJob** – run SchemeDiscoveryService; optionally broadcast discovery_done.
- **EligibilityCheckJob** – run EligibilityService; broadcast eligibility_done.
- **FormNavigationJob** – run FormNavigationService (Playwright); update FormProgress and broadcast step/handoff.

## 7. Stack

- Rails 7 (API), Sidekiq, Redis (Sidekiq + ActionCable), MySQL.
- External: Google Custom Search, Gemini 1.5 Pro (and Vision), Playwright.

## 8. Docker

Everything runs in Docker via a single `docker compose up` from the repo root.

### Services


| Service      | Image / Build           | Host Port | Container Port | Notes                                                                   |
| ------------ | ----------------------- | --------- | -------------- | ----------------------------------------------------------------------- |
| **mysql**    | mysql:8                 | 3306      | 3306           | Volume `mysql_data`; healthcheck                                        |
| **redis**    | redis:7-alpine          | 6379      | 6379           | Sidekiq + ActionCable; healthcheck                                      |
| **backend**  | `./backend/Dockerfile`  | **3001**  | 3000           | Rails API + ActionCable; entrypoint waits for MySQL, runs migrations    |
| **sidekiq**  | Same image as backend   | —         | —              | `bundle exec sidekiq -C config/sidekiq.yml`; depends on backend + redis |
| **frontend** | `./frontend/Dockerfile` | **8082**  | 8080           | Vite dev server; `VITE_API_URL=http://localhost:3001`                   |


### Key files

- `docker-compose.yml` – repo root, defines all 5 services.
- `backend/Dockerfile` – Ruby 3.2, MySQL client libs, bundle install.
- `backend/docker-entrypoint.sh` – wait for MySQL, db:create, db:migrate, rails server.
- `frontend/Dockerfile` – Node 20, npm ci, vite dev --host 0.0.0.0.

### Running

```bash
cd glidegov-assistant
docker compose up        # builds and starts all services
# Frontend: http://localhost:8082
# Backend API: http://localhost:3001
```

