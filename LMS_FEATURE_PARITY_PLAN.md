# Legacy LMS Feature-Parity & Secure Migration Plan

## Scope and safety rule

Source system audited: `-Lms_Full_Stack-main` (live legacy LMS).

The new IMS must reach functional parity before redesigning workflows. No live production record is to be overwritten, deleted, or moved directly. Migration must be repeatable, validated, and reversible.

## Roles and access model for the new LMS

| Role | Scope |
| --- | --- |
| Student | Own profile, enrollments, learning, attendance, tests, submissions, own tickets and team activity |
| Team leader | Student scope plus only their team’s calendar, channels, announcements and member-progress updates |
| Educator | Only courses, students, teams and tickets explicitly assigned to them |
| Operations manager | Enrollment/attendance/project-review actions explicitly granted; no unrestricted user or payment administration |
| Admin | Controlled system-wide management; every sensitive action is audited |

Every API must enforce role, ownership, course assignment and team membership on the server. UI visibility is never authorization.

## Feature-parity inventory

| Area | Legacy operations to preserve | New LMS implementation requirement |
| --- | --- | --- |
| Identity | Sign-up, login, user profile sync, student/educator/admin roles | Central identity provider; internal user profile; immutable role-change audit log |
| Public site | Landing page, About, Contact, Connect, testimonials, enquiry, newsletter, support links, WhatsApp/help | Modern responsive public site; rate-limited/validated public forms |
| Course catalog | List/search, published/trending/locked visibility, domain, thumbnail, description, price, discount | Catalog with drafts, publish/unpublish workflow, visibility rules and version history |
| Course content | Chapters, ordered lectures, duration, preview flag, videos, PDFs/resources | Ordered content builder; private resource access; content versioning |
| Student learning | Enrollments, player, lecture completion, course progress, ratings | Enrollment-checked content delivery; progress event log; rating eligibility after enrollment |
| Enrollment/payment | Razorpay order, signature verification, payment record, paid enrollment, manual assignment/removal | Idempotent payment/webhook processing, transaction ledger, payment audit, controlled manual enrollment |
| Certificates | 75% progress and 100% completion PDF certificates, name input, job CTA | Template-based certificates, unique ID/QR verification, issue/revoke log, eligibility rule engine |
| Assessments | AI question generation, difficulty/topic/domain, submission, score/history | Versioned question bank, attempt limits, timer, server-side scoring, attempt audit; AI output moderation |
| Attendance | LOGIN/LOGOUT windows, duplicate prevention, history, full/half-day statistics, Google Sheet sync | Policy-driven attendance windows, approval-based overrides, timezone-safe records, export/sync queue |
| Projects | Project progress, review submission, GitHub/LinkedIn/video links, ZIP upload, Google Sheet sync | Structured submission/review workflow, private files, reviewer remarks/status/history, retryable external sync |
| Teams | Create/update/delete, logo/banner, public/private, join requests, approve/reject/remove member | Team lifecycle with educator ownership, membership audit, controlled leader assignment |
| Team collaboration | Channels, real-time text/rich-text/file/image messages, edit/delete, announcements, email alerts | Socket-based chat with membership checks, upload scanning, retention/moderation and message audit |
| Team calendar | Event view/create/update/delete, meeting/class/deadline/review types, priority/reminders | Team calendar with leader scope, timezone support and notification scheduling |
| Team progress | Per-student progress, project name, submission unlock, LOR unlock | Educator-controlled milestones; student-visible status; every override attributable |
| Personal productivity | To-do add/list/edit/delete, due date, priority, category, favourite, complete | Private per-user task module with standard CRUD and ownership controls |
| Support | Create ticket, educator list, solve/delete, push notification | Ticket states: open/in-progress/resolved/closed; replies, assignee, SLA, attachments, notification history |
| Notifications | Device-token registration, Firebase push | Notification preferences, delivery log, token lifecycle, email/push/in-app channels |
| Educator/admin views | Dashboard, courses, enrolled students, assignments, teams/team leaders, tickets, revenue | Separate dashboards with scoped data and export/reporting permissions |
| Files/media | Course thumbnails/PDFs, team files, project ZIPs via Cloudinary | Private storage abstraction, MIME/size validation, malware scan hook, signed download URLs, retention policy |
| Integrations | MongoDB, Cloudinary, Razorpay, Firebase, Socket.IO, email, Google Sheets, AI | Integration adapters, secrets only in environment, retry queues, failure alerts, no hard-coded endpoints |

## Data to migrate and reconcile

1. Users and role/team-leader status.
2. Courses, chapters, lectures, resources, thumbnails, status, pricing and ratings.
3. Enrollments, manual assignments, purchases and payment references.
4. Course-progress and completed-lecture records.
5. Attendance records and any external-sheet reconciliation key.
6. Teams, leaders, members, requests, channels and chat/files where retention is required.
7. Calendar events, personal to-dos, tickets, project submissions, test results and device tokens.
8. Certificate issuance history. If legacy certificates lack an ID, issue verified replacement records rather than silently fabricating history.

Each migration run must produce: source count, imported count, skipped/invalid count, duplicate report, record checksum/sample validation, and a rollback reference.

## Delivery order

### Phase 0 — foundation and controls

- Finalize roles/permission matrix and field-level access rules.
- Create database schema, audit-log service, file-storage adapter, error monitoring and backup process.
- Build migration staging environment only; never point development code at live production writes.

### Phase 1 — essential continuity

- Identity/profile, course catalog/content, enrollment, learning player/progress.
- Student and educator dashboards, student/course assignment and controlled access removal.
- Import a read-only migration copy and reconcile counts.

### Phase 2 — internship operations

- Attendance, teams, team progress, calendar, project submissions/reviews.
- Support tickets, notifications and educator/admin operational views.

### Phase 3 — commercial and completion workflows

- Razorpay payments/webhooks, payment ledger, certificates and verification page.
- Assessments/question bank/AI generation and reporting.

### Phase 4 — parallel validation and cutover

- Run legacy and new LMS in parallel with selected internal users first.
- Reconcile users, enrollments, attendance and payments daily.
- Move students in controlled batches; retain legacy system read-only until acceptance and backup sign-off.

## Non-negotiable strictness improvements

- No self-service role elevation; only authorized admins can change roles.
- No open debug endpoints in production.
- No public project/file upload endpoint without identity, authorization, validation and rate limits.
- No educator-wide access by default; educators receive explicit course/team scope.
- Payment verification only through signed webhook/order records, with idempotency keys.
- All destructive actions require confirmation, permission check and immutable audit entry.
- Uploads require file-size/type limits, scanning, private storage and signed access URLs.
- Production secrets, Google Sheet URLs and service credentials remain outside source control.

## Acceptance checklist before legacy replacement

- Every row above has a tested replacement workflow.
- Role/ownership tests prove students cannot access other students’ data.
- Migration reconciliation is signed off for all active students and records.
- Payment, attendance and certificate samples are independently verified.
- Backup restore and rollback rehearsal succeeds.
- Operations team accepts the dashboard and daily processes.
