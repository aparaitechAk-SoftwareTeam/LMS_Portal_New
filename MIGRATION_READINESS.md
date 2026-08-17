# Live LMS migration readiness

## Safety boundary

The legacy LMS remains the source of truth until a staged migration is reconciled and signed off. Do not point this new IMS at legacy production data for writes.

## Required source export

Create a read-only JSON export with these top-level arrays:

`users`, `interns`, `courses`, `enrollments`, `projects`, `tasks`, `submissions`, `attendance`, `teams`, `certificates`, `payments`.

Never include passwords, refresh tokens, API keys, Clerk secrets, payment secrets or Firebase device tokens in the migration export.

## Migration sequence

1. Backup legacy database and record timestamp/checksum.
2. Export a read-only snapshot.
3. Run `node backend/scripts/validate-legacy-export.js <export-file>`.
4. Fix every reported error in a staging copy; never edit the production source to satisfy import requirements.
5. Import into a separate staging database with a migration-run ID.
6. Reconcile counts, user emails, enrollments, project assignments, attendance, certificates and payments.
7. Run admin and intern acceptance tests on staging.
8. Schedule final freeze window, take final export, repeat validation/import/reconciliation.
9. Keep legacy LMS read-only after cutover until records and operations are formally accepted.

## Field mapping

| Legacy data | New IMS destination |
| --- | --- |
| User | `User` + `Intern` profile where applicable |
| Course/enrollment/progress | `LearningCourse` + `LearningEnrollment` |
| Project/task/submission | Existing `Project`, `Task`, `Submission`, `ProjectReviewSubmission` |
| Team/chat/calendar | `Team`, `TeamMessage`, `TeamCalendarEvent` |
| Attendance | `Attendance` |
| Certificate | `Certificate`, preserving original ID and validity where available |
| Payment | `Payment`; do not recreate charges |

## Mandatory reconciliation checks

- Active student count and duplicate-email count.
- Every active student’s project/team/course assignments.
- Attendance days and total hours sample.
- Certificate IDs, validity and download references.
- Payment references/amounts/status; no new payment is ever created during import.
- File URLs remain accessible only to the authorized user after migration.
