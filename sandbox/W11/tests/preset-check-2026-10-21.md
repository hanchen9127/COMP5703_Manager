# Are the project presets and init_data's projects usable? — 2026-10-21

**On `main` at `f3dfdc1c`, SQLite.** A fresh throwaway database was seeded with `init_data.py`, which
completed with no refusal. Then [`../scripts/preset_smoke.py`](../scripts/preset_smoke.py) created one
project from every preset in `app/core/project_policy_templates.py`, as Kevin (task owner), through the
route functions. That is the same path `seed_test_projects.py` uses: in-process, not HTTP and not the
screens. Each project then went through two paths.

- **Happy path.** Charlie answers. Reviewers accept until the item stops waiting for review. An expert
  (Hannah) confirms if the posture holds the item at the gate.
- **Disagreement path.** Dana answers. On a two-approval preset, Bob accepts and Fiona rejects. On a
  one-approval preset, Bob escalates. The run records what the posture does with the disagreement, and
  then Hannah decides.

The existing seed and preset tests (`test_seed_test_projects.py`, `test_development_seed.py`,
`test_project_policy_configuration.py`): **49 passed**.

## Every selectable preset works

| Preset | Create | Happy path | Disagreement path |
| --- | --- | --- | --- |
| `standard_v1` Standard review | ok | canonicalized (this run's 10% sample drew it, so Fiona gave the second review) | escalate → dispute opens → expert Accept → canonicalized |
| `dual_signoff_v1` Dual sign-off, automatic dispute | ok | two accepts → canonicalized | split → **dispute opens by itself** → canonicalized |
| `dual_signoff_v2` Dual sign-off | ok | two accepts → canonicalized | split → **held** (`manual_review`) → George routes it to a dispute → canonicalized |
| `expert_gate_v2` Expert-gated review | ok | accept → **held for expert confirmation** → Hannah confirms → canonicalized | escalate → dispute → expert Accept → canonicalized (the Accept is the confirmation, D-026) |
| `arbitration_ready_v2` Arbitration-ready review | ok | two accepts → canonicalized | split → dispute opens by itself → canonicalized |
| `expert_gate_v1`, `arbitration_ready_v1` | **refused 422, as designed**: superseded, "select the current version" | — | — |

Each preset behaves as its description says.

## What init_data seeds, preset by preset

| Project | Preset | Stored values agree with the preset |
| --- | --- | --- |
| Image Annotation Project | `standard_v1` | yes |
| Text Classification Project | `dual_signoff_v1` | yes |
| Test: Single review, Task lifecycle, Blind-then-reveal | **custom** (standard, 1 approval, 0%) | — |
| Test: Dual sign-off, manual review | **custom** (dual sign-off, 2, 0%, manual) | — |
| Test: Dual sign-off, automatic dispute | **custom** (dual sign-off, 2, 0%, open dispute) | — |
| Test: Sampled second review | **custom** (standard, 1, 50%) | — |

## Findings

1. **No seeded project uses the Expert Gate or the Arbitration-ready posture.** SCRUM-118 and SCRUM-107 are
   Done, and SCRUM-123's summary is "a test project for every feature". Even so, nobody can try the gate's
   confirmation screen, or the rule that a dispute must reach an adjudicator, without first creating a
   project by hand. That includes the demo (K4) and whoever reviews SCRUM-128.
2. **All six test projects are custom policies, not presets.** The policies screen labels them "Custom
   policy". They were built to isolate one setting each: 0% cross-review, so nothing is drawn at random.
   That choice is deliberate and sound. The consequence is that `dual_signoff_v2` and the two v2 postures
   are reachable only by creating a new project.
3. **The two base projects still use v1 presets.** These are still selectable, not superseded, so this is
   not a defect. Note that "Text Classification Project" is `dual_signoff_v1`, which the picker now titles
   "Dual sign-off, automatic dispute".

## Not covered by this check

- PostgreSQL. The run used SQLite only.
- The screens. This run did not drive the picker or the gate's confirmation screen in a browser.
- Whether an independent reviewer is refused when settling a split under `arbitration_ready_v2`. SCRUM-126's
  tests own that rule.
- More than one item per path.

## Open point for Hanchen

Finding 1 is the one that matters before the demo. The fix would be two more test projects in
`seed_test_projects.py`, "Test: Expert Gate" and "Test: Arbitration-ready", each with items staged at the
gate and in a dispute. SCRUM-123 is Done, so this would need a new ticket, or a home in an open one. That
is your call. Until then, the smoke script shows how to create either project through the routes.
