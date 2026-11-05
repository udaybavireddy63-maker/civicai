# CivicAI — Build Tasks and Vibe-Coding Plan

Use this file as the implementation checklist. Complete tasks in order and verify each phase before moving forward.

## Phase 0 — Repository inspection and setup

- [x] Inspect the current repository; preserve existing working files.
- [x] Create `frontend/` and `backend/` if they do not exist.
- [x] Create `docs/` and place all six project documents inside it.
- [x] Initialize frontend with React + Vite.
- [x] Initialize backend with Node.js + Express.
- [x] Add root `.gitignore`.
- [x] Add `frontend/.env.example` and `backend/.env.example`.
- [x] Confirm frontend and backend can run independently.

**Done when:** Both development servers start without errors and the folder structure matches `architecture.md`.

## Phase 1 — Visual foundation

- [x] Add typography and design tokens from `design.md`.
- [x] Create shared Button, Input, Card, Badge, Modal, Loader, and EmptyState components.
- [x] Create responsive public header and footer.
- [x] Build landing page with hero image/video, fallback poster, feature section, and how-it-works section.
- [x] Build login and registration pages.
- [x] Build responsive dashboard shell/sidebar.
- [x] Verify light mode only.

**Done when:** Public and authentication screens look polished at mobile and desktop sizes, even before backend integration.

## Phase 2 — Backend foundation and database

- [x] Configure Express app and server entry point.
- [x] Add environment configuration and MongoDB Atlas connection.
- [x] Add centralized error handler and 404 handler.
- [x] Add request logging that excludes secrets and credentials.
- [x] Add health endpoint.
- [x] Create User Mongoose model.
- [x] Create Complaint Mongoose model.
- [x] Add indexes and schema validation.
- [x] Add a safe admin-seeding procedure; never allow public admin registration.

**Done when:** Backend connects to Atlas and a test record can be written and read.

## Phase 3 — Authentication and access control

- [x] Implement registration with bcrypt hashing.
- [x] Implement login.
- [x] Implement logout/session clearing.
- [x] Implement JWT verification middleware.
- [x] Implement role authorization middleware.
- [x] Implement `/auth/me`.
- [x] Connect frontend auth forms to real API.
- [x] Add protected routes for citizen and admin areas.
- [x] Test that citizens cannot access admin endpoints or other citizens' reports.

**Done when:** Registration/login works and authorization is enforced by the backend.

## Phase 4 — Complaint workflow

- [x] Add shared category, priority, and status constants.
- [x] Implement complaint creation.
- [x] Implement citizen's own complaint list.
- [x] Implement complaint detail with ownership checks.
- [x] Implement pagination, search, and filters.
- [x] Add optional image upload integration.
- [x] Add status history creation.
- [x] Implement admin status update endpoint.
- [x] Implement admin triage endpoint.
- [x] Connect report form, list, detail, and admin table to real APIs.

**Done when:** A citizen can submit and track a report, and an admin can review and update it.

## Phase 5 — AI assistance

- [x] Create provider-neutral AI service interface.
- [x] Configure provider key only in backend environment.
- [x] Create strict prompt and output schema.
- [x] Restrict AI values to supported categories, priorities, and departments.
- [x] Add timeout and retry policy where appropriate.
- [x] Save report even when AI analysis fails.
- [x] Store AI analysis status and output.
- [x] Show AI suggestions with clear advisory labels.
- [x] Allow admin to confirm or correct suggestions.

**Done when:** A real report receives validated AI suggestions when configured, and report submission still succeeds if AI is unavailable.

## Phase 6 — Dashboards and polish

- [x] Implement citizen dashboard metrics from API.
- [x] Implement admin dashboard metrics from API.
- [x] Add category/status visualizations only when backed by real data.
- [x] Add filters and useful empty states.
- [x] Add toast/inline feedback.
- [x] Add responsive checks at 360px, 768px, 1024px, and 1440px.
- [x] Check accessibility, focus states, contrast, and reduced motion.
- [x] Remove placeholder data and unused code.

**Done when:** Dashboard metrics match database records and all major flows are usable.

## Phase 7 — Verification

- [x] Test registration and login.
- [x] Test citizen report submission.
- [x] Test image upload validation.
- [x] Test AI success and AI failure paths.
- [x] Test citizen ownership restrictions.
- [x] Test admin-only operations.
- [x] Test status history.
- [x] Test empty, loading, and error states.
- [x] Test refresh persistence.
- [x] Implement Render-compatible Cloudinary image storage adapter with backward compatibility.
- [x] Update README with exact setup commands and environment variables.

**Done when:** No critical bugs remain in the MVP flows and setup can be repeated from a clean checkout.

## Suggested build order for a coding agent

1. Inspect repo and report current state.
2. Set up folders and scripts.
3. Build visual shell and landing page.
4. Build backend and Atlas connection.
5. Add authentication.
6. Add complaint CRUD and role checks.
7. Add AI analysis.
8. Connect dashboards.
9. Test and document.

## Vibe-coding prompt pattern

For each task, tell the coding agent:

> Read `prd.md`, `architecture.md`, `rules.md`, `design.md`, `task.md`, and `memory.md` first. Inspect the existing code before editing. Implement only the next unchecked task in `task.md`. Preserve working code. Follow the selected stack and light-mode design. Run relevant checks, fix errors, update the checklist, and report changed files, commands run, results, and remaining issues. Do not start deployment.

## Definition of done for every task

- Implementation is connected to the actual app, not an isolated mockup.
- Relevant checks pass.
- Loading, empty, and error states are handled where applicable.
- No secrets or credentials are exposed.
- Documentation and task checklist are updated.
