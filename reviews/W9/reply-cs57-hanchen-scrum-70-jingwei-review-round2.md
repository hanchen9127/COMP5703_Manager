Thanks Jingwei. Everything from your review of 5 Oct is in, pushed at `6e563fa`. #48 merged first as agreed, and this PR has `main` merged in and adapted to it.

**Your four points**
1. **EV-013 couldn't reach `disputed` under the default project.** It now uses a dual sign-off project whose policy is `open_dispute`, and it runs. Since #53 a split waits for both verdicts in either order, and since #48 the review that completes it opens the dispute itself. The review's response names that dispute, and `d7260f4` has the driver keep it, so an `adjudicate` step can decide a dispute no `escalate` step opened. The expert Accepts on `epa` and Returns on `whale`, which proves the dispute is real. Under the default `manual_review` policy the case fails at the first adjudication, as it should.
2. **EV-017 couldn't catch a release carrying both rounds.** Its release step now states `expect.items = { bears = { authoritative = "ann", answer = { label = "Business" }, answers = 1 } }` (`97b4a4f`). It stays skipped on H1 alone. With the release swapped for an export it passes today, but only after `c14ba41`: the export still lists the superseded first-round answer of an author who didn't answer again, so `answers` counted 2. That answer is history, not output, so the count leaves it out now, matching the API's read.
3. **A skip read as `passed: false`.** Fixed in `7119bdd`: each case has a `verdict` of `pass`, `fail` or `skip`. I called it `verdict` rather than `result`, since each case is already a `CaseResult` in `results` and `result.result` reads badly. Happy to rename.
4. **Coverage didn't tell skipped from runnable, and nothing checked it.** `7153b23` prints the runnable count per category and how many categories have a case that runs (3 of 7 now); `3bf51ba` runs `list --coverage` in CI's SQLite job.

**Smaller points**
- Gold loader: BOM, blank lines, bad lines, missing text and repeated records are handled in `9154465`.
- `_do_reopen` forgets the item's cached submissions after a successful reopen (`7e931c2`).
- README and ADR 006 no longer say release means the export, nor that cross-validation means dual sign-off until SCRUM-51 (`b3b35de`).

**Comment 1 on #39.** The outcome keys are real since `c51a405`: `[outcome]` reads through the API, and an export step states what it carries with `expect.items`, as you proposed. `answers` counts output only: a correction once it is authoritative (ADR 012), and never an answer a reopen superseded.

**Also new since your review**
- EV-012 runs: the expert's Reject leaves the item `unresolved`, and the export carries it with no authoritative answer.
- EV-000, 001, 003 and 010 assert which answer is authoritative.
- EV-011 waits for #38 alone. A person's answer after a rejected AI pass is still refused with 409.
- `6e563fa` is outside SCRUM-70. It fixes the two doc points Yi's #48 left, in `workflow_states.md` and `api_surfaces.md`, and is its own commit so you can read it apart.

**Checks:** SQLite: 1,486 passed, 14 skipped; casebook 7/7 passed, 5 skipped. CI on `6e563fa` is green on SQLite and PostgreSQL.
