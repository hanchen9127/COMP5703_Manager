# Final Delivery Checklist

Tracks the team against Arc Intelligence's *Final Engineering Delivery & Acceptance Brief* v1.0
(`../../info/capstone-delivery-brief.md`, 28 Oct 2026). The brief asks for an honest account, not more
features: build work ended on 28 Oct, so every open item below is writing, evidence or disclosure.

**Basis.** Checked on 2026-10-28 against `hej` `main` at `6b6a3fea` (#105) and `../../specs/`. The
specs count 63 of 63 stories complete in the records view; this checklist uses the brief's own test
(complete, partial, unimplemented, each backed by evidence), so some stories complete in the records
appear here as partial.

**Legend:** ✅ done with evidence · 🟡 partial or needs disclosure · ❌ missing · ⬜ not yet checked

---

## 1. The brief's completion checklist (§8)

| # | Item | Status | Evidence on `main` | Gap / next action | Owner |
| --- | --- | --- | --- | --- | --- |
| 1 | System installs and runs from the instructions | 🟡 | `README.md` (setup, database, login, Docker), `apps/hej-api/README.md` | Have someone who did not write the README follow it on a clean clone and record the result | |
| 2 | Source-to-release workflow demonstrated end to end | 🟡 | EV-100, EV-101 (Group A AG News record to export and release); K4 recording | Both cases are human-first. AI first pass → release is not one run (`mission.md`, first unchecked item). Disclose, or show it on real screens in the demonstration | |
| 3 | AI assistance, review, adjudication and provenance behave as documented | ✅ | F1 #70 events; ADR 009, 012, 015; EV-002, 010, 011, 019, 101 | — | |
| 4 | Release gate seen accepting valid and rejecting invalid candidates | ✅ | H3 #83 (409, creates nothing); EV-015, 016, 017 refuse; EV-101, 116 accept | Pair them explicitly in the casebook mapping (section 3) | |
| 5 | Manifests and version information support reproducibility | ✅ | H2 #84, ADR 021, EV-122 (byte-for-byte rebuild) | Releases from before the manifest cannot be rebuilt (findings §4 item 7): disclose | |
| 6 | Casebook and executable harness included | ✅ | `apps/hej-api/evaluation/` (88 cases, 87 run, 1 skipped); `uv run python -m evaluation` | — | |
| 7 | Original evaluation outputs and evidence available | ❌ | Only `baseline.json` is committed; `evaluation/reports/` is ignored by git | Commit one final run on the delivery commit (SQLite and PostgreSQL) as results, with dataset, environment and versions | |
| 8 | Permissions, workflow invariants and failure conditions examined | 🟡 | 19 cases assert a 403; ADR 023; I5 tamper cases; EV-002, EV-107 | No case for interrupted operations or worker recovery; no latency, error-rate or cost figures | |
| 9 | Architecture, decisions, modifications and migrations documented | 🟡 | `docs/design/`, 25 ADRs, `docs/handover/ticket-map.md` | No change record of what was modified in the inherited platform; architecture overview moved to `docs/archive/` with #105 — confirm `system_design.md` covers components, interfaces and data flows | |
| 10 | Failures, limitations and incomplete requirements disclosed | 🟡 | `docs/evaluation-findings.md` §4, §6, §9, §10 | Gather into one `known-issues` / limitations document, adding the D1 partials (section 6) | |
| 11 | Individual engineering decision records included | ❌ | ADRs name only 4 of 8 members | One record per member (section 5) | |
| 12 | Deployment, operation and handover instructions complete | ❌ | READMEs cover setup and tests only | Write operations (failure and recovery) and handover notes | |
| 13 | Every member can defend their work and has signed off | ❌ | — | One sign-off per member (section 5) | |

Any item still unchecked at submission goes into the final report with its status, impact and next
action (brief §8).

## 2. Required artefacts by package

### D1 — Integrated system

| Artefact | Status | Where / gap |
| --- | --- | --- |
| Source, configuration, dependencies, migrations | 🟡 | All in `hej`. No migrations exist by design (`create_all` plus SQLite-only additive migration; PostgreSQL databases are reset). State this as a decision with its consequence |
| Install and run instructions | ✅ | `README.md`, `apps/hej-api/README.md`, `apps/hej-web/README.md` |
| Test accounts, fixtures, demonstration datasets | ✅ | `init_data.py --reset`; seeded test projects A–F and governance projects (API README); `evaluation/gold/` |
| Documented end-to-end workflow | 🟡 | Spread across the API README's seeded projects and `workflow_states.md`; no single walkthrough from source to release |
| Architecture overview | 🟡 | See section 1, item 9 |
| Record of modifications to the pre-existing platform | ❌ | Needs a change record, with the justification for each replacement: legacy review routes now `410` (#6), legacy item escalation flow removed (#102), UI declutter (#97, ADR 024), Gemini call replaced (SCRUM-55) |

**Capability areas (brief D1 table), partial ones only:**
- **AI integration: mock and live modes.** 🟡 The brief asks for a deterministic mock mode. The
  scripted client exists only inside the casebook; the running app has no mock switch (`mission.md`).
  A reviewer needs a provider key or local Ollama to see AI suggestions on screen.
- **Data management: source versions.** 🟡 #63 records each answer's source version, but intake
  always writes v1 and nothing registers a new one; EV-018 is skipped.
- **Evaluation: human–AI collaboration.** 🟡 See section 6.

### D2 — Evaluation and system assurance

| Artefact | Status | Where / gap |
| --- | --- | --- |
| Harness and 40–60 substantive scenarios | ✅ | 88 cases, run through the real API with real logins |
| Each scenario records ID, purpose, requirement, input, procedure, expected | ✅ | TOML fields `id`, `title`, `purpose`, `category`, actors, items, steps with `expect`, `outcome` |
| Each scenario records actual behaviour and evidence | ❌ | Reports carry only `verdict` and `failed_at`; see section 1, item 7 |
| Quality (A) | ✅ | I3 #77: agreement coefficients, two recorded models against gold, calibration (findings §3.2) |
| Human–AI collaboration (B) | 🟡 | I4 #73 measures run on scripted participants only |
| System integrity (C) | ✅ | I5 #79, `evaluation verify` |
| Reliability and failure handling (D) | 🟡 | AI failure recorded, never shown as a suggestion (EV-002, EV-107); no interrupted-operation or recovery case |
| Measured evidence with dataset, environment, sample size, versions | 🟡 | I3 recordings name model and date; casebook reports name only commit and database |

### D3 — Engineering report and decision records

| Artefact | Status | Where / gap |
| --- | --- | --- |
| Final Engineering Report (sections A–E) | ❌ | Planned 29 Oct–1 Nov (K1) |
| Claim–Evidence Matrix | ❌ | Start from `mission.md` → *What Success Looks Like*: each item already names a claim and its PRs and cases |
| Project management records | ✅ | Jira export, contribution tracker, `roadmap.md` weekly sections |
| Significant deviations from the plan | 🟡 | Sources: no assignment (client, 17 Sep), blind-then-reveal as an evaluation protocol (#72, ADR 016), K1–K4 set aside and reopened, W12 removed (1 Oct), team-designed answers to open client questions. Not yet summarised |
| Individual decision records | ❌ | Section 5 |

### D4 — Handover and sign-off

| Artefact | Status | Where / gap |
| --- | --- | --- |
| Installation, configuration, deployment | 🟡 | Local and Docker in READMEs; no deployment beyond local |
| Environment variables and external services, no secrets | ✅ | `.env.example` (AI execution settings added in #105) |
| Database initialisation and migration | ✅ | READMEs: `init_data.py --reset`, disposable development databases |
| Running the application and the harness | ✅ | READMEs and `evaluation/README.md`; findings §11 |
| Test data, fixtures, accounts | ✅ | See D1 |
| Operational guidance for failure and recovery | ❌ | AI provider down, worker lease expiry, a stale PostgreSQL schema after a branch switch |
| Known issues, risks, next steps | 🟡 | Scattered: findings §4 and §6, `mission.md` *Risks*, `W11/release-notes-v0.1.0-draft.md` (local) |
| Identifiable delivered version with its evidence | ❌ | No tag; v0.1.0 waits on the 28 Oct client meeting. Fix the delivery commit and tie every result to it |
| Sign-off records | ❌ | Section 5 |

## 3. Mandatory adversarial scenarios (brief §3.2.3)

The casebook has 9 categories; the brief lists 10 scenarios. Each refusal needs a positive pair.

| # | Brief scenario | Refusal / adversarial cases | Positive pair | Status |
| --- | --- | --- | --- | --- |
| 1 | Confidently incorrect AI suggestion | EV-010, EV-011, EV-110 | EV-002, EV-081 | ✅ |
| 2 | Genuinely ambiguous item | EV-012 | EV-000 | ✅ |
| 3 | Annotator or reviewer disagreement | EV-013, EV-019, EV-064, EV-066, EV-067, EV-125–130 | EV-000, EV-001 | ✅ |
| 4 | Guidelines do not resolve the disagreement | EV-012 and EV-019 come closest | — | 🟡 No case names the guideline as the cause; map it or disclose |
| 5 | Guideline or source version changes after annotation | EV-014 (guideline) | EV-101 | 🟡 Source half: EV-018 skipped |
| 6 | Missing, incomplete or invalid provenance | EV-015, EV-117, EV-118, EV-121, EV-123 | EV-116, EV-101 | ✅ |
| 7 | Unreviewed items in a proposed release | EV-016 | EV-101 | ✅ |
| 8 | Superseded or incompatible items in a release | EV-017 | EV-101 | 🟡 A superseded guideline gives a warning, not a refusal (ADR 020): state it |
| 9 | Unauthorised user attempts a protected operation | EV-021, 022, 023, 027, 044, 063, 115, 119, 120, 131, 132 | EV-024, EV-044's permitted half | ✅ Not its own category; list them |
| 10 | Unavailable or failing AI provider | EV-107 | EV-002 | 🟡 No recovery or retry case |

## 4. Demonstration scenarios (brief §4)

| Scenario | Cases behind it | Status | Before the demonstration |
| --- | --- | --- | --- |
| A — Successful release | EV-100, EV-101; K4 recording | 🟡 | Human-first only; decide whether to show an AI-assisted task reaching a release |
| B — Invalid release | EV-015, EV-016, EV-017 | ✅ | Show the refusal reason on screen |
| C — AI-assisted judgement | EV-010, EV-011, EV-105, EV-111 | 🟡 | Needs a live provider or Ollama in the running app; prepare one |
| D — Authority boundary | Section 3, row 9 | ✅ | Pick one refused and one permitted login |
| E — Failure handling | EV-002, EV-107 | 🟡 | Write the steps to cause a provider failure in the running app (for example, a bad key) and what the screen shows |
| F — Reproduction | EV-122; `evaluation verify` | ✅ | Prepare the rebuild command against a seeded release |

The top-level README must explain how to reproduce these (brief §5, item 5): add a section mapping
each scenario to its commands or cases.

## 5. Per-member records and sign-off

The brief asks each member for a decision record (problem, alternatives, choice, evidence,
limitations, own responsibility) and a sign-off (artefacts owned, claims they can substantiate,
limitations, unresolved risks). ADRs can be cited but do not replace either.

| Member | ADRs authored | Decision record | Sign-off |
| --- | --- | --- | --- |
| Hanchen Wang | 1 | ❌ | ❌ |
| Jingwei Lin | 11 | ❌ | ❌ |
| Yi Geng | 5 | ❌ | ❌ |
| Michael Max | 3 | ❌ | ❌ |
| Kanishka Kathait | 0 | ❌ | ❌ |
| Parth | 0 | ❌ | ❌ |
| Dishank Aswal | 0 | ❌ | ❌ |
| Tim Chung | 0 | ❌ | ❌ |

K2 is complete in `story_src.csv` on the ADRs and the oral defence; against the brief it is not yet
met for the four members with no ADR.

## 6. What the report must disclose as partial or unverified

- **No deterministic mock mode in the running app** (D1, AI integration).
- **No changeable source versions**; EV-018 has never run.
- **No single run from the AI first pass to a release.**
- **No human-participant evidence.** Every agreement, accuracy and anchoring figure comes from
  scripted people (findings §9); there are no annotation-time or review-burden measures and no real
  human-only versus AI-assisted comparison.
- **Model figures are one recorded run per model**; no variance (findings §4 item 3).
- **No browser automation**; the UI rests on component tests and manual walkthroughs.
- **Independent verification is thin after 25 Oct.** GitHub CI was refused for billing; the
  results on `main` after #104 and #105 come from one local run by Hanchen. A non-author should rerun
  them on the delivery commit and record it.
- **`main` is not protected**; review before merge is held by agreement.
- **The Gemini key stays in git history**, refused by the provider since 26 Oct.
- **No database migrations**: an existing database is reset after a schema change.

## 7. Doc drift found while checking

- `../../specs/tech-stack.md` (*Testing*) and `../../specs/mission.md` (*What Success Looks Like*)
  still say the web tests are not in CI; #93 added a web job.
- `../../specs/mission.md` leaves its last success item unchecked while K1–K4 are complete in the
  records; align once the report is written.

## 8. Open items: choose what not to do

Every item still open above, once each. **Tick an item to drop it.** A dropped item is not done; it
goes into the final report as a disclosed gap with its status, impact and next action (brief §8).
Unticked items are the work for 29 Oct–1 Nov.

**Report and records (D3)**
- [assigned to Jingwei] Write the Final Engineering Report, sections A–E (§2 D3)
- [ ] Build the Claim–Evidence Matrix from `mission.md` → *What Success Looks Like* (§2 D3)
- [ ] Summarise the significant deviations from the plan, their causes and consequences (§2 D3)
- [discarded] A decision record for each of the 8 members (§5)
- [discarded] A sign-off for each of the 8 members (§5)

**Evidence (D2)**
- [ ] Fix the delivery commit (tag or pinned hash) and tie every result to it (§2 D4)
- [ ] Commit one final casebook run on that commit, SQLite and PostgreSQL, with dataset, environment and versions (§1 item 7)
- [ ] Record actual observed behaviour per case, beyond `verdict` and `failed_at` (§2 D2)
- [ ] A non-author reruns the backend suite, casebook and web checks on the delivery commit and records it (§6)
- [ ] Measure latency, error rate or model cost for at least one AI run (§1 item 8)
- [ ] Map brief scenario 4, guidelines that do not resolve a disagreement, to a case, or state it as uncovered (§3)
- [ ] Publish the 10-scenario mapping with its positive pairs where a reviewer will find it (§3)
- [ ] Verify the positive pairs for scenario 9 (EV-024, EV-044), inferred from case titles (§3)

**Handover (D1, D4)**
- [ ] Change record of the modifications to the inherited platform, with a justification per replacement (§2 D1)
- [ ] Confirm `system_design.md` serves as the architecture overview, or write one (§1 item 9)
- [ ] One written walkthrough from source to release (§2 D1)
- [ ] Operations guide for failure and recovery: provider down, worker lease expiry, stale PostgreSQL schema (§2 D4)
- [ ] One `known-issues` / limitations document gathering findings §4, §6, *Risks* and §6 here (§1 item 10)
- [ ] A README section mapping demonstration scenarios A–F to commands or cases (§4)
- [ ] A clean-clone install by someone who did not write the README, with the result recorded (§1 item 1)

**Demonstration (§4)**
- [done] Show an AI-assisted task reaching a release in one run (scenario A, C)
- [done] Prepare a live provider or Ollama for the running app (scenario C)
- [done] Write the steps to cause a provider failure on screen and what it shows (scenario E)
- [done] Prepare the manifest rebuild command against a seeded release (scenario F)

**Specs housekeeping (§7)**
- [ ] Correct the "web tests are not in CI" lines in `tech-stack.md` and `mission.md`
- [ ] Align `mission.md`'s last success item with K1–K4 once the report is written
