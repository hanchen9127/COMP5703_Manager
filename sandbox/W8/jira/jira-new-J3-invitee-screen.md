# SCRUM-115 — the invitee accepts, and the role is chosen at invitation (split from SCRUM-90)

2026-09-26. **Created on the board as SCRUM-115 (22:56), description as below.** Split from SCRUM-90 by Hanchen at the review of PR #28
(`../../../reviews/W8/review-cs57-tim-scrum-90-member-management.md`), so that PR #28 can merge once
its reissue race is fixed instead of growing further. Why the work exists:
- SCRUM-90's criterion 4 ("As an invitee, I can see my pending invitations and accept one", added
  2026-09-14) is not in PR #28. No web page calls `GET /invitations` or the accept route; the invite
  dialog shows a token that the invitee has nowhere to use.
- The client answered Q5 on 2026-09-14: a role is assigned when inviting, with no default. The answer
  was recorded in `info/client-question.md` but never reached SCRUM-90's description. Today
  `POST /organizations/{id}/members/invite` takes only an email, and accepting grants no role.
- `GET /invitations` returns no token, and the accept route is `POST /organizations/invitations/{token}/accept`.
  So the list cannot be accepted from as it stands. Recommended below: accept by invitation id for
  the signed-in invitee, since there is no email delivery and the token proves nothing the session
  does not. **Check this choice before pasting.**

**Board fields**

| Field | Value |
| --- | --- |
| Summary | `Organisation Management: Invitee accepts a pending invitation; role chosen at invitation` |
| Type | Task |
| Story points | 2 |
| Sprint | W8 Route work, record decision (on the board 2026-09-26; SCRUM-89 moved to the break in its place) |
| Assignee | Tim |
| Links | blocked by SCRUM-90 (PR #28 merges first — same files) |

**Description** — paste inside a noformat block. The first line must stay: `tracking-sync` maps the
ticket to stories by it.

```
Related to user story J3

BACKEND AND FRONTEND

Split from SCRUM-90 on 2026-09-26 at the review of PR #28: SCRUM-90 criterion 4, plus the client's answer to Q5 (2026-09-14), which never reached SCRUM-90's description.

# An administrator chooses one or more roles when inviting. The invite form has no preselected role and cannot be sent without one; the invite API refuses a request without roles (422) and any role the administrator may not assign.
# The chosen roles are stored with the invitation, and accepting grants exactly those roles. A reissued invitation keeps them unless the administrator changes them.
# As an invitee, I see my pending invitations (GET /invitations: organisation, who invited me, when, expiry and the roles offered). Expired ones are not listed.
# I accept one from that list. Accepting is by invitation id for the signed-in invitee, who must be the invited user; the token route stays for links. Expired, removed or someone else's invitation is refused with the API's own message.
# After accepting, the organisation and its projects appear for me without signing out.
# Tests: invite without a role is refused; accept grants the invited roles; accepting someone else's invitation is refused; a web test accepts from the list.
```

**Change to SCRUM-90 — not yet made on the board (checked 22:59)** — delete its criterion 4 and append:

```
Criterion 4 (invitee sees and accepts pending invitations) moved on 2026-09-26 to SCRUM-115, together with choosing a role at invitation (client answer Q5). PR #28 delivers criteria 1–3.
```

Done: `tracking-sync` added SCRUM-115 to J3 in `shared/story_src.csv` on 2026-09-26. J3 keeps status
`working` until SCRUM-90 and SCRUM-115 are Done.
