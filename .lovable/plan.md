This is a large cohesive update. I'll ship it in phases, prioritizing the Task Completion/Review loop.

## Phase 1 — Task Completion & Review Loop (priority)

- **TaskDetail.tsx lifecycle**:
  - When task is `assigned` and viewer is the assigned helper → "Submit for Completion" button. Uploads completion photo to private `completion-photos` bucket, sets `tasks.status = 'pending_review'`, stores `completion_photo_url`.
  - When `status = 'pending_review'` and viewer is task owner → "Approve & Review" button + "Request Changes" (reverts to `assigned`).
  - Approval opens `ReviewDialog` → calls existing `submit_review` RPC (already updates rating & completed_tasks atomically, sets status to `completed`).
- **ReviewDialog component** (new): 1–5 star picker + comment textarea, Zod validated (`rating: 1-5`, `comment: max 1000`).
- **Helper reciprocal review** (lightweight): after poster submits review, helper sees a one-shot prompt to review the poster. Requires a second RPC `submit_poster_review` that mirrors `submit_review` but writes from helper→poster.
- Migration: add `'pending_review'` as valid status (text column, no constraint to change). Add new RPC for poster reviews. Add `task_id` unique to reviews per reviewer.

## Phase 2 — Notifications & Realtime

- **NotificationBell** in `Navbar.tsx`: dropdown showing recent unread notifications.
- New `notifications` table: `id, user_id, type, title, body, link, is_read, created_at`. RLS: user sees own only.
- Triggers (SECURITY DEFINER) to insert notifications on:
  - new offer (target = task owner)
  - offer accepted (target = helper)
  - new message (target = receiver) — message unread already exists; notification is supplementary
  - task status change (target = involved parties)
- Realtime: subscribe to `notifications` filtered by `user_id` in Navbar.
- Enable `supabase_realtime` for `notifications`, `offers`, `tasks`.

## Phase 3 — Empty States

- New `EmptyState` component (icon + headline + body + optional CTA).
- Wire into `Tasks.tsx`, `Messages`/`Conversations.tsx`, `MyTasks.tsx`.

## Phase 4 — Map View + Trust

- **MapView** on `Tasks.tsx`: List/Map toggle. Use Leaflet (`react-leaflet`, `leaflet`) with OpenStreetMap tiles — no API key. Pins per task using existing `location` text (geocoding is out of scope; for now render a stylized grid/density map if no coordinates). I'll add optional `lat`/`lng` columns to `tasks` and geocode on post via Nominatim (free, no key) in the post-task flow.
- Small static map preview in `TaskDetail.tsx` when coords exist.
- **FaceVerification**: confirm existing flow sets `verifications.status = 'approved'` via admin RPC and that `profiles.verified` flips. (Already implemented per `admin_approve_verification`.) I'll surface "Verified" badge consistently on `TaskCard` and public profile.
- **Reports**: `task_reports` exists. Add `profile_reports` table (mirror schema) and a Report button on public profile.

## Phase 5 — Profile & Community

- **PublicProfile** route `/u/:userId`: bio, skills, verified badge, recent reviews list. Read-only.
- **Skills tagger** in `Profile.tsx`: add/remove tag chips, persisted to `profiles.skills` (text[]).

## Phase 6 — Technical Rigor

- **Zod** schemas added/tightened: PostTask, EditProfile, Review, Report.
- **Skeletons**: replace spinners in `TaskDetail.tsx` and `Profile.tsx` with shadcn `Skeleton` layouts.
- **SEO**: add `<Helmet>` to every route with dynamic titles + descriptions. (HelmetProvider already mounted in `App.tsx`.)

## Technical details

- New tables: `notifications`, `profile_reports`.
- New columns: `tasks.lat numeric`, `tasks.lng numeric`.
- New RPCs: `submit_poster_review(p_task_id, p_poster_id, p_rating, p_comment)`.
- New triggers on `offers` (INSERT, UPDATE status), `messages` (INSERT), `tasks` (UPDATE status).
- New deps: `leaflet`, `react-leaflet`, `@types/leaflet`.
- All new tables include GRANT statements + RLS policies scoped to `auth.uid()`.
- Status values for `tasks.status`: `open | assigned | pending_review | completed | cancelled`.

## Out of scope (will note for follow-up)

- Real geocoding pipeline beyond best-effort Nominatim on post.
- Push notifications (web-push) — in-app bell only for now.
- Helper-side full reciprocal review UX beyond one-shot prompt.

If approved, I'll execute phases 1→6 sequentially in one session, with the DB migration submitted first for approval.