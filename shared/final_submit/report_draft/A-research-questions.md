# Project questions (Section 3.2) — for agent C

Agent A owns Section 3.2. These are the questions as they appear there; Results (7) and Discussion (8) should
answer each one by its number. Keep the numbering; if A changes a question, this file changes with it.

The underlying problem (Section 3.2 framing): the client's symptoms were an immature inherited codebase and a
human-dominated workflow; the problem underneath is that the platform could not *defend* a dataset — it could
not say, for an item it exported, how the label got there, and nothing stopped an indefensible export.

| RQ | Question | Pillars | Evidence C is expected to use |
| --- | --- | --- | --- |
| RQ1 | **Traceability.** Can a released dataset answer, for every item it contains, how its label got there — source and guideline version, AI suggestion, the human response to it, each review, dispute and adjudication, with an actor and a time — from a record captured at each decision rather than reconstructed afterwards? | Record, Adjudicate | F1 provenance events (ADR 015), F2 versions (ADR 018), F3 versions/authority (ADR 009), F5 history graph; EV-101 reading every stage back from a release; `evaluation verify` (I5) |
| RQ2 | **Gated, checkable release.** Can the platform refuse to create a release when that answer cannot be given — unreviewed, disputed, missing provenance, no authoritative answer — using only recorded facts, never an operator's assertion; and can anyone check a release against its manifest without the platform? | Release | H3 gate (ADR 020: five refusal reasons, 409 creating nothing), H1 immutability, H2 manifest + SHA-256 (ADR 021, EV-122), H4 one authoritative answer; casebook cases on unreviewed/superseded items in a release, tamper cases |
| RQ3 | **Governed judgement.** Can the server enforce governance so that no one approves, settles or adjudicates work they took part in, roles carry only the authority they need, and the annotator's label, the reviewer's decision or correction and the adjudicated resolution remain distinct records rather than one "final answer" field? | Govern, Adjudicate | Capability model (ADR 023), independence rules (ADR 010, 011, 022), correction-as-proposal (ADR 012), dispute outcomes Accept/Return/Reject and ambiguous resolution; permission test suites; the six Critical defects closed (2, 4, 5, 6, 7, 8) |
| RQ4 | **Measured AI assistance.** Can AI suggestions be supplied behind a replaceable, typed interface that never disguises a failure as a suggestion, and can both the quality of those suggestions (accuracy, calibration) and their effect on human judgement (keeping or revising one's own answer, anchoring) be measured under repeatable conditions? | Assist, Evaluate | `JsonCompletionClient` (six providers, scripted client), defect 20 / EV-002; I3 recorded runs of llama3 and DeepSeek Flash on 400 records (ADR 019: accuracy, macro-F1, ECE, Brier, Krippendorff's alpha, Fleiss' kappa); I4 blind-then-reveal protocol (ADR 016) and its measures |
| RQ5 | **Proof, not demonstration.** Can these properties be shown by repeatable, adversarial end-to-end evidence that runs through the real API and guards against regression — while the inherited defects are closed inside the features that depend on them, within one semester? | Evaluate (and all) | Casebook (88 cases, adversarial categories, baseline comparison in CI), test suites (backend, web), 30/30 inherited defects closed, 63/63 stories, what was *not* shown (limits: scripted people, one recorded sample, full journey on real screens) |

Notes for C:
- RQ4's people-side figures in the casebook are pipeline demonstrations with scripted people (ADR 019,
  "E-D1"); say so when answering RQ4 — the protocol is built and measured, real annotator effects were not
  studied.
- RQ1's exemption (work before F1 on 16 Oct has no events, ADR 020 decision 3) and RQ2's "superseded is a
  warning" (ADR 020 decision 2) are deliberate design choices — answer them as such, with their cost.
