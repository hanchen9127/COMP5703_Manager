# FE–BE local integration runbook

> **Branching:** Open the documentation PR with **base `feat/b-week9-frontend-hardening`**, not `main`, so it rides the FE–BE integration train without polluting the default branch.

This document explains how to run **hej-api** and **hej-web** together on your machine, obtain a JWT for manual testing, and smoke-test the **read paths** (projects, tasks, task items) against the real backend while keeping **mock fallbacks** when no token is present or the API is unreachable.

Use it when validating frontend–backend wiring before annotate/review write flows and before a proper login UI exists.

---

## 0. Prerequisites

- **Python**: Install [`uv`](https://docs.astral.sh/uv/) and use it from the repo root or `apps/hej-api` as shown below.
- **Node**: Install dependencies for the web app (typically `npm install` from the monorepo root if your team uses workspaces, or follow the root `README` / `apps/hej-web/package.json` scripts).
- **Checkout:** Use the **frontend hardening / integration** branch your team merges from (the one that includes `POST /api/v1/auth/login`, `apps/hej-api/init_data.py`, and `apps/hej-web/lib/api/`). If a command or path is missing locally, update your branch first.

---

## 1. Start backend

From the monorepo root:

```bash
cd apps/hej-api
uv sync
uv run python init_data.py --reset
uv run uvicorn app.main:app --reload --port 8000
```

What this does:

| Step | Purpose |
|------|--------|
| `uv sync` | Installs/resolves the API’s Python dependencies into the project environment. |
| `uv run python init_data.py --reset` | Resets and loads **seed** organizations, projects, tasks, and users so IDs and logins are predictable. `--reset` means you get a clean slate each time (see `python init_data.py --help` on your tree for exact flags). |
| `uv run uvicorn app.main:app --reload --port 8000` | Runs FastAPI with auto-reload on **port 8000**. |

**Alternative (see `apps/hej-api/README.md`):** some setups use `uv run python main.py`, which reads host/port/reload from `app.core.config` (defaults include port `8000`). Prefer the explicit `uvicorn` line above when you need a fixed port for the curl and frontend examples in this runbook.

**Quick sanity check:** open `http://localhost:8000/docs` (Swagger) or call `GET http://localhost:8000/api/v1/health` if your router exposes it.

**Seed login (example used in team curl):** after `init_data.py --reset`, you can log in with:

- **Email:** `alice@example.com`
- **Password:** `SecurePass1Alice`

Exact users and passwords are defined in `init_data.py` (or the seed module it calls); treat the values above as the default smoke account unless your seed script documents otherwise.

---

## 2. Login and get token

Request a JWT from the auth endpoint (adjust host/port if you changed them):

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"SecurePass1Alice"}'
```

Parse the **`access_token`** (or equivalent field) from the JSON response. You will paste it into the browser in the next section.

Implementation reference: `apps/hej-web/lib/api/auth.ts` should wrap this login call and return the token shape the UI layer expects.

---

## 3. Start frontend

From the monorepo root:

```bash
cd apps/hej-web
npm run dev
```

Open the URL printed by Next.js (commonly `http://localhost:3000`).

**API base URL:** the web app resolves the backend base from `apps/hej-web/lib/api-config.ts` (for example `NEXT_PUBLIC_HEJ_API_BASE_URL` defaulting to `http://localhost:8000/api/v1`). Set that env var if your API is not on localhost or uses a different path.

---

## 4. Put token into browser `localStorage`

Because **login UI is out of scope** for this integration phase, set the token manually in DevTools (Console) on your app origin:

```js
localStorage.setItem("hej.auth.access_token", "<paste-token-here>")
```

Then hard-refresh the page if needed so client-side code picks up the token.

**How the client uses it:** `apps/hej-web/lib/api/client.ts` should read this key and attach `Authorization: Bearer <token>` to outgoing requests when present. Do not fork a second client implementation (see rules below).

---

## 5. Test endpoints / pages

### Expectations

| Condition | Expected behavior |
|-----------|-------------------|
| **Token set, API up** | Read-path calls go to the **real backend**; data should match seed / DB. |
| **No token, or API down / errors** | UI should **fall back to mock** (or cached mock shell) and **must not crash**. |

### Project / task read path

Exercise **project detail** and **project tasks** using real IDs from seed data (after `init_data.py --reset`), for example:

- **Project overview:** `/projects/<projectId>` — uses project-level workspace data.
- **Project tasks list:** `/projects/<projectId>/tasks` — primary list from project into tasks.

These flows should use **`apps/hej-web/lib/api/projects.ts`** and **`apps/hej-web/lib/api/tasks.ts`** (for example `getProject(projectId)`, `listTasks(projectId)`) rather than ad-hoc `fetch` in React components.

### Dashboard / project list (entry layer)

**Dashboard** (`/`) and **Projects** (`/projects`) re-fetch on the client so `localStorage` JWT is visible to `apiClient`.

With token + backend up, you should see seeded projects such as:

- `proj_1_1`
- `proj_1_2`

Without token or with the API down, the mock portfolio should still render.

### Task items read path

- **Route:** `/tasks/<taskId>/items`
- **Relevant files (for understanding the flow):**
  - `apps/hej-web/lib/task-workspace-data.ts`
  - `apps/hej-web/components/task-items-board-with-real-data.tsx` (when present on your branch)
  - `apps/hej-web/app/tasks/[taskId]/items/page.tsx`

**Behavior to verify:** the server (or first paint) can show **mock / fallback**; after **client mount**, if a token exists and the backend responds, the board should **hydrate** with real task items from `listTaskItems(taskId)` (or the equivalent API module). Without a token or with the backend offline, the page should keep showing mock data and remain stable.

Task item **status** values from the API should be normalized for the UI via **`apps/hej-web/lib/api/status-mapping.ts`** (for example `mapBackendItemStatusOrDefault()`), not duplicated in random components.

---

## 6. Known limitations

Backend seed IDs and frontend mock IDs are still different, but backend-only project and task IDs are now supported through lightweight bridge shells.

Supported backend smoke paths:

- `/projects/proj_1_1`
- `/projects/proj_1_1/tasks`
- `/tasks/task_proj_1_1_1`
- `/tasks/task_proj_1_1_1/items`

Current remaining limitations:

- Login UI is still out of scope; token is still set manually in `localStorage`.
- Annotate / Review write flows are not fully connected yet.
- Save Draft / Submit / Finalize / Dispute flows should be tested in separate action-flow PRs.
- Without token, backend-only routes should not crash, but may show bridge shells / empty states rather than real backend data.

---

## 7. Rules (this phase)

1. **Do not** add another `api-client.ts` (or duplicate global fetch client). Extend **`apps/hej-web/lib/api/client.ts`** only as needed.
2. **Do not** call `fetch` directly from UI components. Use **`apps/hej-web/lib/api/*`** modules (`organizations.ts`, `projects.ts`, `tasks.ts`, `task-items.ts`, `auth.ts`, etc.).
3. **Preserve mock fallback** paths; avoid unnecessary edits to fixture/data modules that break offline demos.
4. **Read paths only** for these PRs: omit write actions (save draft, submit, approve, …) unless explicitly in scope.
5. **Login UI** is not part of this round; manual token + `localStorage` is intentional.
6. Keep PRs **small**; descriptions should state **What**, **Why**, and **Out of scope** clearly.

---

## Suggested PR title and description

**Title:** `docs: add FE–BE local integration runbook`

**Description:**

**What**  
Adds or updates `docs/fe-be-local-integration-runbook.md` with step-by-step instructions to start `hej-api` (including `uv sync`, seed reset, uvicorn), obtain a JWT via `curl`, start `hej-web`, set `hej.auth.access_token` in `localStorage`, and smoke-test project/task and task-items read paths.

**Why**  
Gives the team a single, repeatable checklist for local FE–BE integration and reduces back-and-forth on ports, token key, and expected fallback behavior before login UI and write flows land.

**Out of scope**  
No application code changes in a docs-only PR; no login page; no annotate/review write-flow changes.
