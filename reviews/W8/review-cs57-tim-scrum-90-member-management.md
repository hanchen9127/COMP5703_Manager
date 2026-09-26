# Review — PR #28, `CS57-Tim` (SCRUM-90, J3)

2026-09-26. Head `0572ca2`, base `main`; merge-base `1f0d562` (`main` is now at `7c84ce9`, 34 commits
ahead). Eight commits, 22 files, +1029 / −88. It merges cleanly with `main`.

**On GitHub (checked with `gh pr view 28`):** open. Parth requested changes on 2026-09-21 (at
`940836b`) with four reproduced issues and an evidence package. Tim pushed `5a0efb6` and `0572ca2` on
2026-09-26 and commented asking Parth to look again. No other reviews.

**Read before this review:** SCRUM-90 on the board (`Jira.csv`), story J3 (`shared/story_src.csv`),
roadmap W7 group for SCRUM-90 and W8 carry-over, `info/client-question.md` Q5 (role at invitation) and
R1-6 (project isolation, out of scope), and Parth's review with its `evidence.zip`. There is no
earlier message from Hanchen to Tim about this ticket.

**Recommendation: request changes — issue 1 only.** Issues 2, 3 and 4 are fixed. Issue 1 is not: the
race moved earlier in `invite_member` rather than closing. SCRUM-90's criterion 4 (the invitee's
screen) and the client's role-at-invitation answer are missing, and are **split into a new ticket, SCRUM-115**
(Hanchen's decision, 2026-09-26; `../../sandbox/W8/jira/jira-new-J3-invitee-screen.md`) rather than
added to this PR.

## Verified

All runs are on `main` + PR merged locally (`7c84ce9` + `0572ca2`).

- Backend suite: **SQLite 490 passed, 4 skipped; PostgreSQL 18 494 passed** (local Docker, session
  time zone `Australia/Sydney`, as in CI).
- Web: `tsc --noEmit` clean; `vitest run` 229 passed; `eslint` 0 errors. The changed components carry
  4 warnings (`set-state-in-effect` ×2, `exhaustive-deps` on the roles dialog, `purity` in the
  membership table).
- Parth's evidence, re-run:

| # | Parth's issue | Evidence test | Result |
| --- | --- | --- | --- |
| 1 | Renewal undoes a successful acceptance | `test_reissuing_invitation_does_not_undo_successful_acceptance` | ❌ fails — reissue returns **400** where the test allows 201 or 409. The final state is no longer overwritten, but only because the test's barrier now sits after the overwrite (see finding 1) |
| 2 | Reinvite of an admin-created member breaks their list | `test_reinviting_admin_created_user_keeps_recipient_list_available` | ✅ |
| 2 | New inviter and date not persisted | `test_reinvitation_persists_new_inviter_and_invitation_time` | ✅ |
| 3 | Stale organisation responses replace the selected scope | `scope_switch` | ✅ |
| 4 | Background load resets the chosen role | `role_draft` | ✅ |
| — | All-organisations view hides manageable orgs on one 403 | `aggregate_permissions` | ❌ — Parth marked it non-blocking |

- Invitation expiry on PostgreSQL in a non-UTC session: the stored `invitation_expires_at` equals the
  token's `exp` to the second, and `GET /invitations` returns it with `Z`. No drift, despite the column
  being plain `DateTime` rather than `UtcDateTime`.
- The migration step (`ALTER TABLE … ADD COLUMN … DATETIME`, `datetime(invited_at, '+24 hours')`) is
  SQLite-only SQL, but `migrate_db_schema()` on `main` returns early for any other dialect, so it never
  runs on PostgreSQL.
- Project listing now uses `LIVE_ORG_MEMBERSHIP_STATUSES` and `removed_at IS NULL`: an invitee cannot
  see an organisation's projects before accepting.
- Repeated acceptance returns 200 without changing `accepted_at` or writing a second audit row.

## Scope — SCRUM-90 on the board, point by point

| # | Board description | On `0572ca2` |
| --- | --- | --- |
| 1 | I can invite a person, see pending invitations, and remove a member | ✅ Invite dialog, pending/expired invitations table, remove dialog |
| 2 | I can assign and change a member's role | ✅ Roles dialog (at least one role), wired to `PATCH …/roles` |
| 3 | A role change takes effect on what that person can do | ✅ Existing backend permission checks read the updated assignments |
| 4 | As an invitee, I can see my pending invitations and accept one | ❌ **Not built.** No page calls `GET /invitations` or the accept route. The invite dialog tells the admin to share the token, but the invitee has nowhere to use it. **Split to SCRUM-115** |
| — | Client Q5 (2026-09-14): a role is assigned when inviting, no default | ❌ The dialog and `POST …/members/invite` take only an email; accepting grants no role, so a new member can do nothing until an admin edits roles. The answer was never written into SCRUM-90's description, so this is not on Tim. **Split to SCRUM-115** |

## Fix before merge

### 1. Reissue can still undo a successful acceptance

`invite_member` (`admin_service.py`, the `REMOVED`/`INVITED` branch) still calls
`store.organization_users.update(ou)` with the snapshot it read, **before** the new conditional
`renew_pending_invitation`. `OrgUserRepository.update` writes `status`, `accepted_at`, `removed_*` and,
since `5a0efb6`, `invited_at`/`invited_by` too. If the recipient accepts between the read and that
write, the write restores `invited` and clears `accepted_at`, and the conditional renewal then
succeeds because the status is `invited` again.

Reproduced on SQLite and PostgreSQL with a variant of Parth's test that pauses at that `update`
instead of at token creation: accept → 200, reissue → 201, final `status='invited'`,
`accepted_at=None`, one acceptance audit row. Parth's own test no longer catches it because its
barrier (`create_invitation_token`) now runs after the overwrite.

**Suggested fix:** one conditional write for the whole reissue. Compute the token and expiry first,
then `UPDATE organization_users SET status='invited', invited_at, invited_by, invitation_expires_at,
accepted_at=NULL, removed_at=NULL, removed_by=NULL WHERE id=:id AND status=:status_read`. If no row
matches, raise **409** (`HTTPException`, not `ValueError`, which the route maps to 400). Drop the
separate `update(ou)` for this path. Add the variant below and Parth's B1/B2 tests to
`tests/test_invitations.py` so the fix stays fixed.

## Split out (SCRUM-115, not this PR)

- SCRUM-90 criterion 4 — the invitee's pending-invitation screen and accepting from it.
- Role chosen at invitation, required, no default; accepting grants it.

Draft: `../../sandbox/W8/jira/jira-new-J3-invitee-screen.md`. SCRUM-90's description loses criterion 4
at the same time.

## Non-blocking

- The PR description says "Scrum 20"; the ticket is SCRUM-90.
- None of the new tests in `test_invitations.py` covers Parth's issues 1 or 2.
- `admin-org-member-roles-dialog.tsx` keys the reset effect on `member?.user_id` but reads `member`
  inside it (`exhaustive-deps` warning). Harmless today, since roles are re-read on open.
- Parth's two follow-ups stand: the all-organisations view drops successful results on one 403, and
  the admin member list returns `invitation_expires_at` without a UTC offset.

## Comment for GitHub (ready to paste)

````markdown
Thanks @aWalkingAvocado — re-checked on `main` + this PR (`0572ca2`). SQLite 490 / PostgreSQL 494 backend tests pass; web typecheck, lint (0 errors) and 229 vitest tests pass. Parth's evidence now passes for issues 2, 3 and 4. 

**Issue 1 is not closed yet — the race moved earlier.** In `invite_member`, the `REMOVED`/`INVITED` branch still calls `store.organization_users.update(ou)` with the snapshot it read, *before* `renew_pending_invitation`. `update()` writes `status` and `accepted_at`, so an acceptance that lands between the read and that write is overwritten, and the conditional renewal then succeeds because the row is `invited` again. Parth's test no longer catches it only because its barrier (`create_invitation_token`) now runs after the overwrite.

Repro — drop this next to `evidence/test_reinvitation.py` and run it the same way:

```python
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from concurrent.futures import ThreadPoolExecutor
from threading import Event
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from test_reinvitation import context, evidence_engine, checked  # noqa: F401
from app.models.db_models import OrganizationUserDB
import app.repositories.db_store as store_module


def test_reissue_update_window_does_not_undo_acceptance(context, monkeypatch):
    client, engine, org_id, users, emails, headers = context
    invite_url = f"/organizations/{org_id}/members/invite"
    original = checked(client.post(invite_url, json={"email": emails[2]}, headers=headers(0)), 201)
    accept_url = f"/organizations/invitations/{original['invitation_token']}/accept"
    reached, release = Event(), Event()
    real_update = store_module.OrgUserRepository.update

    def paused_update(self, org_user):  # pause the reissue's snapshot write only
        if str(org_user.status).endswith("invited") and not reached.is_set():
            reached.set()
            assert release.wait(10)
        return real_update(self, org_user)

    monkeypatch.setattr(store_module.OrgUserRepository, "update", paused_update)

    def reissue():
        with TestClient(client.app) as other:
            return other.post(invite_url, json={"email": emails[2]}, headers=headers(0))

    with ThreadPoolExecutor(max_workers=2) as ex:
        pending = ex.submit(reissue)
        assert reached.wait(5)
        assert ex.submit(client.post, accept_url, headers=headers(2)).result(timeout=10).status_code == 200
        release.set()
        pending.result(timeout=10)
    with Session(engine) as db:
        assert db.get(OrganizationUserDB, original["member_id"]).status == "active"
```

Observed on SQLite and PostgreSQL 18: accept 200, reissue 201, final `status='invited'`, `accepted_at=None`, one acceptance audit row.

Suggested fix: make the reissue a single conditional write — compute the token and expiry first, then `UPDATE … SET status='invited', invited_at, invited_by, invitation_expires_at, accepted_at=NULL, removed_at=NULL, removed_by=NULL WHERE id=:id AND status=:status_you_read`, and return **409** when no row matches (today `ValueError` surfaces as 400, which is also why Parth's B1 test still fails). Please add this test and Parth's B1/B2 tests to `tests/test_invitations.py`.

Scope note: the invitee's acceptance screen (SCRUM-90 criterion 4) and choosing a role at invitation (the client's answer, no default role) are moving to a new ticket, SCRUM-115, so they don't block this PR. Small one: the description says "Scrum 20" — it's SCRUM-90.

With issue 1 fixed this is ready to approve from my side; Parth has the final say on his review.
````
