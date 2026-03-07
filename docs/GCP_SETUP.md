# GCP and API Keys Setup

This guide explains how to obtain the three credentials used by GovGlide (see `backend/.env`): **GEMINI_API_KEY**, **GOOGLE_SEARCH_API_KEY**, and **GOOGLE_SEARCH_CX**. These are required for Gemini (eligibility, form navigation, live voice) and for scheme discovery via Google Custom Search.

## Prerequisites

- A Google account.
- (Optional) A GCP project for billing and API enablement. For Gemini you can instead use a key from Google AI Studio with no GCP project.

---

## 1. GEMINI_API_KEY

This key is used for:

- REST `generateContent` (eligibility checks, form navigation with vision).
- Gemini Live API (WebSocket) for the live voice agent.

One key is used for both in this app.

### Option A – Google AI Studio (simplest)

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in and open **Get API key** (or **API keys** in the menu).
3. Create an API key and copy it. No GCP project is required for basic use.

### Option B – GCP

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Enable **Generative Language API**: go to **APIs & Services** → **Library** → search for “Generative Language API” → **Enable**.
3. Create an API key: **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
4. (Recommended) Restrict the key: edit the key → under **API restrictions** choose “Restrict key” → select **Generative Language API**.

Set this value as `GEMINI_API_KEY` in `backend/.env`.

---

## 2. GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX

These are used for scheme discovery via the Custom Search JSON API, restricted in code to `*.gov.in` and `*.nic.in`.

### GOOGLE_SEARCH_API_KEY (GCP)

1. In [Google Cloud Console](https://console.cloud.google.com/), use the same or a new project.
2. Enable **Custom Search API**: **APIs & Services** → **Library** → search “Custom Search API” → **Enable**.
3. Create an API key: **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
4. (Recommended) Restrict the key to **Custom Search API** only.

Set this value as `GOOGLE_SEARCH_API_KEY` in `backend/.env`.

**Note:** Custom Search has a [free tier](https://developers.google.com/custom-search/v1/overview) (e.g. 100 queries/day). Beyond that, billing must be enabled on the GCP project.

### GOOGLE_SEARCH_CX (Programmable Search Engine)

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/).
2. Click **Add** to create a new search engine.
3. Choose “Search the entire web” or add specific sites. The app restricts results in code to `*.gov.in` and `*.nic.in`, so the CSE can search the whole web or be limited to those domains.
4. After creating the engine, open it and copy the **Search engine ID** (a short string like `0123456789abcdef0`).

Set this value as `GOOGLE_SEARCH_CX` in `backend/.env`.

---

## Summary


| Env variable            | Where to get it                               | GCP / product                       |
| ----------------------- | --------------------------------------------- | ----------------------------------- |
| `GEMINI_API_KEY`        | Google AI Studio or GCP API key               | Generative Language API / AI Studio |
| `GOOGLE_SEARCH_API_KEY` | GCP → Credentials → API key                   | Custom Search API                   |
| `GOOGLE_SEARCH_CX`      | Programmable Search Engine → Search engine ID | programmablesearchengine.google.com |


---

## After you have the values

1. Open `backend/.env` and set each variable (uncomment the lines if they are commented).
2. Restart the backend (e.g. `docker compose up` or restart the backend container).
3. Do **not** commit `.env` to version control.

---

## Official documentation

- [Gemini API](https://ai.google.dev/docs)
- [Custom Search JSON API](https://developers.google.com/custom-search/v1/overview)
- [Programmable Search Engine](https://programmablesearchengine.google.com/)

---

## Troubleshooting

- **“GEMINI_API_KEY not configured”** – Ensure `GEMINI_API_KEY` is set in `backend/.env` and the backend was restarted after changing it.
- **403 from Gemini or Custom Search** – Check that the API key is correct, the right APIs are enabled (Generative Language API and/or Custom Search API), and that the key is not over-restricted. For Custom Search, also check quota and that billing is enabled if you exceed the free tier.

