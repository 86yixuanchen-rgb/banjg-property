# Banjg Property Project Management and Launch Plan

> Document status: Draft 1.0
> Last updated: 2026-10-09 (Australia/Sydney)
> Current phase: functional prototype → launch-ready MVP
> Project goal: give property managers a unified platform for repair requests, communication, scheduling, collaboration and an AI assistant.

## 1. Goals and success criteria

### 1.1 Product goals

- Manage properties, contacts, repair requests, quotes, attachments, schedules and communication history in one place.
- Build a unified inbox from channels such as Gmail/Outlook, WhatsApp Business, Instagram and Teams/Slack.
- Integrate with at least one property management platform commonly used in the target market.
- Use DeepSeek for classification, summaries, reply drafts and next-step suggestions; every outbound message and status change must be confirmed by the user.
- Support organisations, teams and role isolation to meet the security requirements of real customer data.

### 1.2 MVP launch success criteria

- Users can securely register, sign in, sign out and recover their account.
- Users in organisation A cannot access any data from organisation B.
- Requests, properties, contacts, messages, attachments and timelines are all persisted.
- At least one email channel and one property management platform complete real two-way sync.
- DeepSeek answers reliably in the real environment, with timeout, rate-limit, cost and audit controls.
- Key E2E flows, backup and restore, security checks, monitoring and alerting all pass.
- No P0/P1 defects; the launch owner signs off the Go/No-Go decision.

## 2. Current completion

| Module | Status | Notes |
|---|---|---|
| Dashboard | Prototype complete | Kanban, filters, create, status change and search work; data was not persisted at the time of writing |
| Request detail | Prototype complete | Quote approval, reminders, internal notes and timeline are interactive |
| Unified Inbox | Prototype complete | Channel filter, search, reply and AI suggestion approval use demo data |
| Properties / Contacts | Basic UI complete | Real routes and search exist; no database CRUD yet |
| Calendar / Analytics | Basic UI complete | Pages exist; no real calendar source or statistics pipeline |
| Settings / Integrations | Basic UI complete | Connection entry points exist; real OAuth and sync not implemented |
| Sign-in | Front-end flow complete | Email, Instagram and WhatsApp UI with a local session; not production auth |
| DeepSeek | Server proxy complete | Needs a valid key in a secure environment and real-request verification |
| Automated checks | Basics complete | 5 route tests pass, production build passes, lint has 0 errors |

## 3. Scope

### 3.1 MVP scope

1. Production authentication, organisations, roles and permissions.
2. PostgreSQL database, migrations, seed data and object storage.
3. Real CRUD for Properties, Contacts, Requests, Quotes, Messages, Attachments and Calendar.
4. Server-side DeepSeek integration, auditing and human confirmation.
5. Gmail or Outlook (pick one) as the first real messaging channel.
6. One of PropertyMe / Property Tree or AppFolio / Buildium as the first property platform.
7. Webhooks, sync jobs, retries, idempotency and connection status.
8. Monitoring, logging, backups, privacy, security and the release process.

### 3.2 Post-MVP scope

- Support for all property platforms at once.
- Fully automatic execution of AI suggestions.
- Native mobile app.
- Advanced finance, rent, accounting and a full CRM.
- A custom BI report designer.

## 4. Work breakdown structure (WBS)

| ID | Work package | Main deliverables | Depends on | Priority | Status |
|---|---|---|---|---|---|
| W1 | Product and architecture baseline | MVP scope, ADRs, environment split, data classification | None | P0 | Not started |
| W2 | Data platform | Schema, migrations, repositories, backups | W1 | P0 | Not started |
| W3 | Production auth | Email auth, sessions, organisations, RBAC, invitations | W1, W2 | P0 | Prototype complete |
| W4 | Core business | Property/Contact/Request/Quote/Attachment CRUD | W2, W3 | P0 | Prototype complete |
| W5 | DeepSeek | Secure proxy, prompts, rate limits, audit, cost metrics | W2, W3 | P0 | Partially complete |
| W6 | Email channel | Gmail or Outlook OAuth, sync, webhooks, sending | W2, W3 | P0 | Not started |
| W7 | Meta channels | Instagram and WhatsApp Business OAuth and webhooks | W2, W3 | P1 | Not started |
| W8 | Collaboration channels | Teams/Slack connection and notifications | W2, W3 | P1 | Not started |
| W9 | Property platform | First platform adapter, field mapping, two-way sync | W2, W3 | P0 | Not started |
| W10 | Dashboard completion | Drag and drop, bulk actions, SLA, live updates, export | W4 | P1 | Partially complete |
| W11 | QA and security | Unit/integration/E2E, permissions, load, security checks | W3-W10 | P0 | Basics complete |
| W12 | Launch readiness | Monitoring, alerting, runbooks, privacy, release and rollback | W11 | P0 | Not started |

## 5. Milestone roadmap

Because team capacity and the release date are not yet fixed, the milestones below are dependency-driven and do not commit to specific dates.

### M0 — Baseline freeze

- Decide the launch country/region, first property platform and first email channel.
- Decide the identity provider, database and deployment platform.
- Pass the data classification and privacy review.
- Exit criteria: product and engineering leads confirm the architecture decisions and MVP scope.

### M1 — Secure data foundation

- Complete the database, migrations, organisation isolation, RBAC and production auth.
- Migrate the existing local request data to the persistence layer.
- Exit criteria: all cross-organisation access tests fail (that is, access is blocked) and core CRUD integration tests pass.

### M2 — Core workflow usable

- Complete properties, contacts, requests, quotes, attachments, schedules and the audit timeline.
- Support request assignment, SLA, bulk actions and persisted status.
- Exit criteria: the end-to-end flow from reporting a repair to closing it passes.

### M3 — AI and communication loop

- Complete DeepSeek, the first email channel and the human review mechanism.
- AI can classify messages, link them to requests, and produce summaries and reply drafts.
- Exit criteria: AI cannot send anything directly; failures, timeouts and exhausted quotas all degrade safely.

### M4 — Property platform integration

- Complete two-way sync with the first property management platform.
- Implement field mapping, idempotency, conflict handling, retries and sync logs.
- Exit criteria: continuous sandbox sync passes acceptance with no duplicate records or silent data loss.

### M5 — Release candidate

- Complete security, performance, accessibility, cross-browser and disaster-recovery verification.
- Complete monitoring, alerting, support process, privacy documents and a rollback rehearsal.
- Exit criteria: all launch gates pass and there are zero P0/P1 defects.

## 6. Critical path

`Architecture baseline → database → production auth/RBAC → core business persistence → channel and property platform integration → E2E/security → launch`

The DeepSeek UI, static pages and non-critical visual polish can run in parallel but cannot replace critical-path work. Do not connect real customer accounts or store real tenant data until the database and permission model are in place.

## 7. Product backlog

### P0 — launch blockers

- [ ] Choose and implement an authentication service; remove the localStorage session in production.
- [ ] Build the PostgreSQL schema, migrations and tenant isolation policy.
- [ ] Implement server-side authorisation checks; log every write to an audit log.
- [ ] Persist requests, properties, contacts, messages, quotes, attachments and schedules.
- [ ] Configure and verify a new `DEEPSEEK_API_KEY` securely.
- [ ] Implement DeepSeek rate limiting, timeouts, cost tracking and prompt-injection protection.
- [ ] Decide on and complete the first email channel.
- [ ] Decide on and complete the first property management platform.
- [ ] Set up object storage, file scanning and access control.
- [ ] Complete E2E, permission, security, backup-restore and rollback verification.

### P1 — important MVP capabilities

- [ ] Official Instagram and WhatsApp Business integration.
- [ ] Teams/Slack notifications and collaboration.
- [ ] Dashboard drag and drop, bulk actions, SLA and live updates.
- [ ] Two-way calendar sync, reminders and conflict detection.
- [ ] Analytics with real metrics, time ranges and export.
- [ ] Notification preferences, failed-retry status and a sync log UI.

### P2 — post-launch enhancements

- [ ] More property platform adapters.
- [ ] Advanced automation rules and templates.
- [ ] Custom reports, trends and capacity forecasting.
- [ ] Mobile-specific experience and offline support.

## 8. Integration strategy

All third-party platforms use one adapter interface: `connect`, `refreshToken`, `pullChanges`, `pushChange`, `verifyWebhook`, `disconnect`. Store the external source ID, version, sync time and idempotency key; never match records by name alone.

Criteria for choosing the first platform: target customer coverage, API availability, sandbox quality, webhook support, review timeline, rate limits and commercial terms. If an API is not public or the required permissions cannot be obtained, this must be confirmed during M0; a UI mock must not be counted as a completed integration.

## 9. Testing and launch gates

| Gate | Acceptance requirement |
|---|---|
| Functionality | Core repair loop, sign-in, permissions, sync and AI approval E2E tests pass |
| Data | Migrations are repeatable; idempotency holds; backup-restore rehearsal passes |
| Security | No privilege escalation; secrets never reach the front end, repository or logs; webhook signatures verified |
| Performance | Page, API and sync-job SLOs are agreed and met |
| Reliability | Timeouts, rate limits and third-party outages all have fallbacks and retries |
| Privacy | Privacy policy, data deletion, retention periods and user request process are complete |
| Observability | Error rate, latency, sync failures and AI cost have dashboards and alerts |
| Release | CI/CD, database migrations, feature flags and the rollback runbook are verified |

## 10. Risk register

| Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|
| Meta review or permission delays | High | High | Create the app early; keep email sign-in as the main entry; gate channel features behind feature flags | TBD |
| Property platform has no public API | High | Medium | Verify API and commercial access in M0; prepare a CSV or email fallback | TBD |
| Multi-tenant privilege escalation | Critical | Medium | Server-side RBAC/RLS, permission tests, audit logs | TBD |
| AI output is wrong or acts beyond its authority | High | Medium | Suggestions only, human confirmation, minimal context, audit and policy checks | TBD |
| Duplicate or lost third-party messages | High | Medium | Idempotency keys, cursor-based sync, retry queue, dead-letter queue, reconciliation job | TBD |
| Secret leakage | Critical | Medium | Secret management, rotation, log redaction, commit scanning; revoke any key that appears in chat immediately | TBD |
| Scope too large, causing delay | High | High | Launch with one email channel and one property platform; strictly defer P1/P2 | Product owner |

## 11. Decision log (pending)

| Decision | Candidates | Deadline | Status |
|---|---|---|---|
| Launch market | Australia / New Zealand / North America | M0 | Open |
| First property platform | PropertyMe / Property Tree / AppFolio / Buildium | M0 | Open |
| First email channel | Microsoft 365 / Gmail | M0 | Open |
| Auth approach | Managed auth / self-built | M0 | Open |
| Database and deployment | PostgreSQL and the target cloud platform | M0 | Open |

## 12. Project management cadence

- Weekly: backlog grooming, dependency check, risk update and demo.
- Every PR: link a WBS/backlog ID and include test evidence and security impact.
- Every milestone: product acceptance, technical acceptance, risk review and scope confirmation.
- Status values: `Not started`, `In progress`, `Blocked`, `Awaiting acceptance`, `Done`.
- Definition of done: code merged, tests passing, docs updated, monitoring ready, product accepted; finishing only the UI does not count as feature-complete.

## 13. Next actions

1. The product owner confirms the launch market, first email channel and first property platform.
2. The engineering lead decides on auth, database, object storage and deployment.
3. Revoke any DeepSeek key that has appeared in chat and configure a new key in the environment secrets.
4. Create issues for W1-W4 with owners, estimates and target iterations.
5. After M0, add dates, baselines and a formal Gantt chart to the WBS based on real capacity.
