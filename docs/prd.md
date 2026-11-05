# CivicAI — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** MVP specification  
**Product name:** CivicAI  
**Product type:** AI-assisted civic issue reporting and resolution platform

## 1. Product vision

CivicAI helps residents report public infrastructure and civic-service problems, while giving civic administrators a clear workflow to review, prioritize, assign, and resolve them. AI assists with understanding and routing reports; people remain responsible for official decisions.

## 2. Problem statement

Residents often do not know where or how to report potholes, garbage overflow, broken streetlights, water leaks, drainage problems, and other public issues. Reports can be incomplete, duplicated, misrouted, or difficult to track. Administrators need a centralized view of incoming reports and their status.

## 3. Goals

- Make it easy for a resident to submit a complete civic issue report.
- Give residents transparent status tracking.
- Use AI to suggest a category, concise summary, urgency, and responsible department.
- Give administrators a manageable queue with search, filters, and status updates.
- Store users, reports, AI suggestions, and status history in MongoDB Atlas.
- Deliver a polished, accessible, responsive, light-mode-first web experience.

## 4. Non-goals for the first release

- Native iOS/Android applications.
- Direct integration with government systems or official ticketing systems.
- Automated dispatch of field workers.
- AI making binding legal, safety, or resource-allocation decisions.
- Public social network, comments, or public user-to-user messaging.
- Real-time GIS routing or advanced geospatial analytics.

## 5. User roles

### Citizen
- Register and sign in.
- Submit an issue with description, category (optional), location, and optional image.
- View their own reports and status timeline.
- Edit or withdraw a report only while it is still in an eligible early state, according to product policy.

### Administrator
- View all reports.
- Search and filter by status, category, priority, and date.
- Review AI suggestions and original evidence.
- Correct category/priority/department suggestions.
- Assign reports and update status.
- Add internal notes and resolution notes.
- View basic operational metrics.

### Future field worker role
Reserved for a later release. Do not expose incomplete field-worker functionality in the MVP.

## 6. Core user journeys

### Journey A — Report a civic issue
1. Citizen opens the landing page.
2. Selects **Report an issue**.
3. Signs in or creates an account if required.
4. Enters a title, description, location, and optional photo.
5. Submits the report.
6. Backend saves the report and requests AI analysis.
7. The UI shows the submitted report and AI-suggested category, priority, and department, clearly labelled as suggestions.
8. Citizen can find the report in **My Reports**.

### Journey B — Track a report
1. Citizen opens **My Reports**.
2. Filters or selects a report.
3. Views current status, submitted date, location, and status history.
4. Sees plain-language explanations of each status.

### Journey C — Admin resolves a report
1. Admin signs in.
2. Opens the admin dashboard.
3. Filters the report queue.
4. Opens a report and reviews its evidence and AI suggestions.
5. Confirms or edits category, priority, department, and assignee.
6. Updates status and adds an optional note.
7. Citizen sees the updated status and timeline.

## 7. MVP functional requirements

### Authentication and authorization
- Email/password registration and login.
- Passwords hashed using bcrypt.
- JWT authentication with secure handling; prefer HttpOnly cookies in production.
- Role-based authorization enforced by backend middleware.
- A user must never access another citizen's private reports.
- Admin role must not be self-assigned through public registration.

### Report creation
Required fields:
- Title
- Description
- Location as a human-readable address or locality

Optional fields:
- Category selected by citizen
- Photo attachment
- Latitude/longitude if explicitly captured with permission

Validation:
- Trim text and reject empty values.
- Apply sensible title/description length limits.
- Limit image size and accepted MIME types.
- Show field-level errors and submission progress.

### AI assistance
For each new report, AI may return:
- Suggested category from the application's fixed category list.
- Short summary.
- Suggested priority: Low, Medium, or High.
- Suggested responsible department.
- Confidence score or confidence label, if supported reliably.
- Brief rationale.

AI requirements:
- AI output is advisory, not authoritative.
- Validate the response against a strict schema and allowed enum values.
- Handle malformed output, timeouts, rate limits, and unavailable API keys.
- If AI fails, save the report and mark analysis as pending/failed; do not lose the citizen's report.
- Never invent facts, location, or evidence not present in the report.
- Do not use AI to infer a reporter's identity, protected traits, or personal characteristics.

### Report management
- List reports with pagination.
- Search by title, description, or report reference.
- Filter by status, category, priority, and date range.
- Detail view with evidence, AI suggestions, assignment, and status history.
- Admin can update status and add resolution notes.
- Keep an audit trail of status changes.

### Dashboard
Citizen dashboard:
- Total reports
- In-progress reports
- Resolved reports
- Recent reports

Admin dashboard:
- Total reports
- New/unreviewed reports
- In-progress reports
- Resolved reports
- Reports by category and status
- Recent activity

Use real API data; do not ship fake statistics as if they were live data.

## 8. Status model

Recommended statuses:
- `SUBMITTED`
- `UNDER_REVIEW`
- `ASSIGNED`
- `IN_PROGRESS`
- `RESOLVED`
- `REJECTED`

Every status change should record:
- Previous status
- New status
- Changed by user ID
- Timestamp
- Optional public note

## 9. Suggested civic categories

- Roads and potholes
- Streetlights and electrical
- Waste and sanitation
- Water supply and leakage
- Drainage and sewage
- Public parks and facilities
- Traffic and road signs
- Other

The category list should be centralized so frontend validation and backend validation stay consistent.

## 10. Non-functional requirements

- Responsive layouts for mobile, tablet, and desktop.
- Accessible color contrast, keyboard navigation, visible focus states, and labelled form fields.
- Secure password storage and protected API routes.
- Server-side validation for all writes.
- Environment variables for secrets and connection strings.
- Consistent API error format.
- Loading, empty, success, and error states for every major screen.
- Basic logging without exposing passwords, tokens, or sensitive user data.
- Graceful operation when AI analysis or image hosting is unavailable.

## 11. MVP acceptance criteria

- A citizen can register, log in, submit a report, and see it in their own report list.
- A report persists in MongoDB Atlas after the server restarts.
- AI analysis returns schema-valid suggestions when the AI provider is configured.
- A report is still saved if AI analysis fails.
- A citizen cannot view another citizen's private report by changing an ID.
- A non-admin cannot access admin endpoints.
- An admin can filter reports and update status.
- Status history is persisted and visible.
- The interface works at mobile and desktop widths.
- All pages use the approved light theme; no dark-mode toggle is included in MVP.

## 12. Success measures

For a prototype demonstration:
- End-to-end report submission works.
- AI suggestions are visibly differentiated from confirmed admin decisions.
- Admin can complete a report status workflow.
- Dashboard metrics are calculated from stored data.
- No critical authorization or data-persistence defects remain.

## 13. Assumptions and open decisions

- Initial deployment region and actual civic authority are not yet selected.
- Image storage provider can be chosen later; MongoDB should store image URLs and metadata, not large image binaries.
- Email verification and password reset can be deferred if time is constrained, but should be documented as production follow-ups.
- Maps/geocoding are optional for MVP; a clear text location is sufficient.
