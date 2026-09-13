# <STORY-ID> Plan — <Story name>

The story-level plan: what has to be true, in what order, and which roadmap task group covers each
part. Owners are agreed at the weekly meeting. How each ticket is implemented commit by commit belongs
in the implementer's own notes — for Hanchen, `docs/sandbox/W<n>/plans/plan-<ticket>.md` — and links
back here.

## Group 1 — <Backend rule or data model> (<SCRUM-…>)

1. <Outcome-level task>
2. <Outcome-level task>

## Group 2 — <API and schemas> (<SCRUM-…>)

3. <…>

## Group 3 — <Web> (<SCRUM-…>)

4. <…>

## Group 4 — Tests

5. <A test per acceptance criterion; for each defect, a test that fails against the old behaviour>

## Group 5 — Docs Sync

6. <Which `hej/docs` files change, per the Docs Sync table in `specs/tech-stack.md`>

## Group 6 — Verify

7. Run `npm run check` — must exit 0
8. Walk through `validation.md` in the running app
