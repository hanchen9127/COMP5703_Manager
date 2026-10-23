# New W11 ticket — four governance projects on real data replace the seed's base projects (2026-10-21)

**Decided by Hanchen (2026-10-21):**
- init_data's two base projects are replaced by **four projects, one per governance model**, each on real
  data.
- **The six test projects A–F stay as they are.**
- The data is **AG News and Civil Comments**, the records already in `evaluation/gold/`.
- The ticket goes in **W11**, with the **assignee left open**.

**Why, checked 2026-10-21 on `main` `f3dfdc1c`** ([`../tests/preset-check-2026-10-21.md`](../tests/preset-check-2026-10-21.md),
[`../tests/label-check-2026-10-21.md`](../tests/label-check-2026-10-21.md)):
- **The base projects hold no usable data.** "Image Annotation Project" and "Text Classification Project"
  point their items at `s3://data-bucket/...` and `postgres://feedback_db/...`. The Bridge Demo images do not
  exist, and item previews are metadata, not content. The tasks define no labels, so the work panel offers
  its generic `supports / contradicts / …`.
- **No seeded project uses the Expert Gate or the Arbitration-ready posture**, although SCRUM-118 and
  SCRUM-107 are Done. A–F are all custom policies, so `dual_signoff_v2`, `expert_gate_v2` and
  `arbitration_ready_v2` are reachable only through a hand-made project.
- All five selectable presets work end to end through the routes (the same check), so this is seed work
  only.

**Not in progress elsewhere:** SCRUM-123 (A3, the seed) is Done, and no open PR touches `init_data.py`.

---

## Board steps

| Field | Value |
| --- | --- |
| Type | Task |
| Sprint | **W11** |
| Assignee | **Open.** Jingwei wrote SCRUM-123's seed but already holds 2.5u in W11 (SCRUM-128, 129) |
| Story points | **2** suggested |
| Linked | "relates to" SCRUM-123 |

W11's board load goes from 9.5u to 11.5u.

## Summary

```
Seed: One project per governance model, on real AG News and Civil Comments records
```

## Description

```
{noformat}Related to user story A3

BACKEND (seed). W11. Added 2026-10-21 (Hanchen).

init_data.py's two base projects ("Image Annotation Project", "Text Classification Project", steps 3–6) hold no usable data: their items point at s3://data-bucket/... and postgres://feedback_db/..., the Bridge Demo images do not exist, and their tasks define no labels. And no seeded project uses the Expert Gate or the Arbitration-ready posture, though SCRUM-118 and SCRUM-107 are Done. Replace the base projects with four projects, one per governance model, each on real records. The test projects A–F (step 7–8) stay exactly as they are.

# Four projects in Acme, each created from the current preset, through the routes as step 7 does: Standard (project_policy_standard_v1), Dual sign-off (project_policy_dual_signoff_v2), Expert-gated (project_policy_expert_gate_v2), Arbitration-ready (project_policy_arbitration_ready_v2). Each shows as its preset, not "Custom policy".
# Real data only: the records in evaluation/gold/ag_news.jsonl and civil_comments.jsonl (28 each, Group A's delivery, unchanged). Each project has a classification task on AG News; the Dual sign-off and Arbitration-ready projects also have a judgement task on Civil Comments. At least 8 items per task. Keep each record's external_item_ref (ag_news:train:NNNN), so an item can be traced to its gold record.
# Labels match the data and are defined: AG News World / Sports / Business / Sci/Tech; Civil Comments abusive / not_abusive, as the evaluation scores it. The work panel offers exactly these.
# Every item opens in the work panel with its full text from the repository (a fixture file, as the A–F items do); nothing points at an external store.
# Everything starts untouched, except: one item in the Expert-gated project waits at the gate for an expert's confirmation, and one item in the Arbitration-ready project is in an open dispute. Stage both through the routes, as step 8 does.
# Remove the base projects and steps 4–6's annotations, drafts and predictions made on them. Anything those steps showed that the new projects do not (a prediction, a saved draft) moves to the new projects or is dropped, with a line in the PR saying which.
# Tests: test_project_policy_configuration's seed test asserts the four presets instead of proj_1_1/proj_1_2; test_development_seed's two tests that read steps 4–6 follow the move; a new test proves every seeded item opens with its text and every task's labels are defined. The 49 seed and preset tests otherwise pass unchanged.
# Docs in the same change: hej/README's seed paragraph names the four projects beside the test projects (it also says "five Test: projects"; there are six), apps/hej-api/README.md "Seeded test projects" says what to try in each, and docs/fe-be-local-integration-runbook.md drops its proj_1_1 / task_proj_1_1_1 examples.

Done when init_data.py --reset on a fresh SQLite and a fresh PostgreSQL database creates the four projects; the run's summary lists them by governance model; and in each one a person can annotate, review and (where the posture asks) confirm or adjudicate an item through to canonical in the running app.

Collaboration:
- SCRUM-123 (A3, Jingwei, Done): step 7–8's route helpers (caller, _Stager) are the way to create and stage through the routes.
- SCRUM-71 (I2): the casebook reads evaluation/gold too; the seed copies records, never edits the gold files.
- SCRUM-128 (UI declutter): its Dashboard change (C4) shows these projects; no ordering needed.{noformat}
```

---

## Open points for Hanchen

- **Owner.** It is open. The seed's route helpers are Jingwei's (SCRUM-123), but Jingwei already has 2.5u in
  W11.
- **The two staged items** (one at the gate, one in dispute) are the only staged work in the new projects.
  They are there so the demo can show both postures without setting anything up. Strike that line if you
  want everything untouched.
- **IDs change** from `proj_1_1` / `proj_1_2` to route-generated ones. The web only uses `proj_N_N` as a
  fallback, and A–F already run on generated IDs, so nothing breaks. Anyone with a bookmark to
  `/projects/proj_1_1` loses it, though.
