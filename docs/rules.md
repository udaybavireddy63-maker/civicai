# CivicAI — AI Coding Rules

These rules apply to every AI coding agent working in this repository.

## 1. Project identity and stack

- Product name is **CivicAI**.
- Frontend must use **React with Vite**.
- Backend must use **Node.js and Express.js**.
- Database must use **MongoDB Atlas through Mongoose**.
- Do not replace this stack with Next.js, Flask, Firebase, Supabase, or another database.
- Keep separate `frontend/` and `backend/` directories.
- Do not add deployment configuration until explicitly requested.

## 2. Work before coding

1. Read `prd.md`, `architecture.md`, `design.md`, `task.md`, and `memory.md` before making changes.
2. Inspect the existing repository before creating or overwriting files.
3. Preserve working code and existing user changes.
4. Identify the smallest coherent task and implement it fully.
5. If requirements conflict, follow the PRD and architecture; record unresolved decisions in `memory.md`.

## 3. Frontend rules

- Use React components; do not build the UI as standalone HTML pages.
- Use reusable components and feature-based organization.
- Keep API access in `src/services/`, not scattered across components.
- Keep business rules and privileged decisions on the backend.
- Use semantic elements and accessible labels.
- Every async interaction needs loading, success, and error states.
- Every list needs loading, empty, and error states.
- Use responsive layouts from mobile to wide desktop.
- Use the light theme only. Do not add dark mode or a dark-mode toggle.
- Use design tokens from `design.md`; do not introduce random colors, radii, or shadows.
- Do not use emoji as interface icons; use a consistent icon library if installed.
- Do not use placeholder statistics where the UI implies live data.
- Never use a background video behind dense text or critical forms.

## 4. Backend rules

- Use Express routers, controllers, services, models, middleware, and validators with clear responsibilities.
- Keep controllers thin; business logic belongs in services.
- Use Mongoose for MongoDB access.
- Validate all input on the server even if the frontend validates it.
- Use centralized error handling and a consistent API response format.
- Use async error handling consistently.
- Never trust client-supplied role, user ID, priority, status, or ownership.
- Check both authentication and authorization for protected endpoints.
- Enforce report ownership for citizen access.
- Only admins can access all reports or change official status.
- Public registration must not create admins.

## 5. Security and secrets

- Never hardcode secrets, passwords, tokens, or connection strings.
- Never commit `.env` files.
- Maintain `.env.example` with placeholder values only.
- Never expose database or AI provider credentials to the frontend.
- Hash passwords with bcrypt.
- Do not return password hashes in API responses.
- Apply sensible rate limits to authentication and public submission routes.
- Validate upload size and MIME type.
- Do not log passwords, tokens, or secret environment values.

## 6. AI rules

- AI output is a recommendation, not an official decision.
- AI must not change complaint status or assign a worker by itself.
- Use a fixed list of allowed categories, priorities, and departments.
- Validate AI output against a schema before saving or displaying it.
- Handle missing API key, provider errors, invalid JSON, and timeouts.
- Never discard a report because AI analysis failed.
- Label suggestions clearly in the UI.
- Do not fabricate evidence or claim a complaint has been verified.

## 7. Database rules

- Use Mongoose schemas with required fields, enums, timestamps, and useful indexes.
- Normalize email addresses.
- Store image URLs/metadata, not large image binaries, in MongoDB.
- Keep status history for each status transition.
- Do not expose internal admin notes to citizens.
- Use pagination for admin report lists.

## 8. Code quality

- Use clear names and small functions.
- Avoid giant components and giant route files.
- Avoid duplicate API logic.
- Remove unused imports and dead code.
- Do not silence errors with empty `catch` blocks.
- Do not add a dependency without a clear need.
- Do not rewrite unrelated files.
- Add comments for non-obvious decisions, not obvious syntax.
- Keep README setup instructions aligned with actual scripts.

## 9. Testing and completion

After each task:
1. Run the relevant frontend or backend checks.
2. Fix errors introduced by the change.
3. Verify the changed flow manually where possible.
4. List files changed.
5. State commands run and their results.
6. State any remaining issue honestly.

A task is not complete merely because code was generated. It is complete when the implementation is connected, checked, and its limitations are reported.

## 10. Visual quality bar

- Follow `design.md` exactly.
- Prefer spacious layouts, clear hierarchy, restrained color, polished typography, and consistent alignment.
- Use photography and video only where they reinforce the civic/public-service story.
- Use optimized assets, descriptive alt text, and accessible overlays.
- Respect reduced-motion preferences.
- Avoid generic template appearance, excessive gradients, glassmorphism overload, and decorative clutter.
