# Re: SCRUM-118 Expert Gate design and SCRUM-107 questions

For Yi, from Hanchen · 2026-10-15

Thanks. This is clearer than my plan from this morning. Where the two differ, your design stands: use
`trigger_type` rather than `kind`, and keep `reconciliation_choose` rather than a new cause.

## The three decisions

**1. Scope change: approved, with the points moved.** Split by level, two PRs, two branches cut from `main`,
as you proposed. Please make the Jira changes you listed:
- move criterion 3 and the "waiting at the gate" part of criterion 4 from SCRUM-107 to SCRUM-118;
- remove "BACKEND ONLY" from SCRUM-118;
- drop SCRUM-107's dependency on SCRUM-118.

Also move the points with the work: **SCRUM-118 from 2 to 3, SCRUM-107 from 2 to 1.** SCRUM-107 shrinks
further under decision 3.

One correction that does not change the decision. Without the front end, a held item would not be
invisible. The reconciliation desk already lists a one-candidate case and lets an expert decide it, but it
reads "1 approved candidates", and "choose one" is wrong for a confirmation. So the front end belongs in
SCRUM-118 because the gate isn't finished without it, not because the item would disappear.

**2. R2-7: add the check.** Please add the roughly ten-line check in `mark_authoritative`, with its test, in
SCRUM-118. You are right that no path on `main` canonicalises an unreviewed AI answer today, and I checked
both callers. But the criterion is written for the next path:

- **The ticket asks for exactly this.** It says "checked in the backend at the point of canonicalisation,
  not only by the current workflow's shape". The three casebook cases test the workflow's shape, which is
  the part the criterion says is not enough on its own.
- **A test can fail on `main`.** Call `mark_authoritative` directly on an AI-authored annotation that has no
  approval. On `main` it marks the annotation. With the check it refuses with 409. That is your
  "failing on the old behaviour" test.
- **New marking paths land this week.** SCRUM-124 (Dishank) adds the accept-a-correction path, and H4
  (#66) touches the authoritative answer. A check at the one place every path must pass costs less than
  reopening the question for each of them.

The rule: an annotation with `author_role == "ai_model"` may be marked only if its round has at least one
approver (`approvers_of`), or if the cause is a person's decision (`adjudication_accept`,
`reconciliation_choose`) with `actor_id` set. Keep your casebook argument in the PR as the reason it has
never triggered.

**3. SCRUM-107: option (a).** Treat criterion 1 as met. That means:
- pin it with posture-specific guard tests and one casebook case;
- add `adjudication_mandatory_on_dispute` to `ENFORCED_POLICY_VALUES`;
- say plainly in the PR that every posture already requires independent adjudication, so the flag
  guarantees what `main` already does and changes no behaviour today.

There is no need to ask the client. Since 7 Oct Hunter has left these posture questions to the team, so
present (a) as our design. It also matches his own definition: dual sign-off says how agreement is
established, arbitration-ready says what happens when it fails, and on our platform that guarantee holds
everywhere.

## Two small things in the SCRUM-118 design

- **The SQLite migration.** "The reset strategy, with no migration" is right for PostgreSQL, but
  `tech-stack.md` says the new column also goes into the additive `migrate_db_schema()`, which runs only on
  SQLite, so an existing SQLite database keeps working. Existing rows get `multiple_candidates`. SCRUM-124
  does the same for its column.
- **SCRUM-105.** It has no owner yet, so leave a comment on the ticket about the new `reviewed` hold rather
  than waiting to tell its owner.

Everything else, including the derived confirmation, the scope limits, the unchanged names and the
documentation list, is agreed as written.
