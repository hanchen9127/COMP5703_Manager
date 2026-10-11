# SCRUM-91 absorbs the owning-organisation picker (Create project)

2026-10-12. **Decided by Hanchen:** the Create project form lets an administrator choose only the first organisation;
it goes into SCRUM-91 (B1, Tim, W9, To Do on the board of 2026-10-11), not into a new ticket. No ticket on
`Jira.csv` of 2026-10-11 23:46 mentions it. Found by reading `hej/apps/hej-web/components/project-create-form.tsx`;
**not run in the app**, and not checked what `GET /organizations` returns for alice. The owner confirms both first.

## Board steps

| Field | Change |
| --- | --- |
| SCRUM-91 description | **Replace** with the block below (the original text is kept; the new part is the paragraph on the picker and criterion 4) |
| Story points | 0.5 → **1** |
| Sprint / assignee | Stay W9 / Tim. **Ask Tim first**: it is his ticket, and he also holds SCRUM-89 (J2); his W9 goes from 2u to 2.5u |

W9's load goes from 21u to 21.5u (21u already counted the AI hand-over ticket, `jira-new-ai-rework.md`).

## At the next weekly sync, not now

- `roadmap.md`: SCRUM-91's row (W9) gains the picker, and W9's load becomes 21.5u.
- The progress report (Table 16 / 17) lists SCRUM-91 as 0.5u and Tim's W9 as 2u. If the report is submitted after
  this change, make them 1u and 2.5u.
- B1 is complete in the records; it stays `done` ("never downgraded automatically"). Decide by hand whether it goes
  back to `working` if the gap is real.

## Open points for Hanchen

- **Which organisations does the picker offer?** The ones the caller may create projects in (an administrator of
  that organisation), not every organisation the caller belongs to. The block says so; the API's refusal is the
  guard, the list is only a convenience.
- **Default selection:** the first organisation, as today, so nothing changes for a single-organisation user.
- If the picker turns out to be intended as single-organisation (a product decision), the fix is the seed data, not
  the form. The seed (`init_data.py`) and `mission.md` both describe several.
