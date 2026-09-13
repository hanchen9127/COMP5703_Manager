---
name: feature-spec
description: Write the big-picture feature spec for one backlog story, following the JetBrains spec-driven workflow — docs/specs/YYYY-MM-DD-<story-id>-<slug>/ with requirements.md, plan.md and validation.md, written only after a three-question interview. Also closes a spec out when its story is done.
when_to_use: Use when the user wants a spec for a story or the next roadmap item, or wants to start, plan or scope a story ("write the spec for D5", "next roadmap feature", "为 D5 写 spec", "开始做下一个 story"), or says a spec'd story is finished ("D5 做完了", "spec 收尾").
argument-hint: "[story-id]"
---

# feature-spec

**Two levels, never mixed:**
- **The feature spec (`docs/specs/`) is the big picture**, one per story: outcome, scope, decisions,
  task groups by ticket and layer, dependencies, and the Definition of Done. Write it for any
  story, including teammates' stories.
- **The sandbox (`docs/sandbox/W<n>/plans/plan-<ticket>.md`) is how Hanchen implements a ticket that
  week**, commit by commit. Link between the two levels; never copy one into the other.

**Constitution:** `docs/specs/mission.md`, `docs/specs/tech-stack.md`, `docs/specs/roadmap.md`.
Specs are written in English; talk to the user in Chinese.

## Create a spec

1. **Pick the story.** Use the story the user named. Otherwise take the first story in the current
   week of `roadmap.md` that is not ✅, and say which one in a sentence. From W7 the roadmap lists
   task groups without owners, so ask which group's story is meant when that is unclear.
   If `docs/specs/` already has a folder for it, update that folder instead of creating another.

2. **Gather context before asking anything.**
   ```bash
   PYTHONIOENCODING=utf-8 D:/COMP5703_Capstone/hej/apps/hej-api/.venv/Scripts/python "${CLAUDE_SKILL_DIR}/scripts/story_context.py" <STORY-ID>
   ```
   Then:
   - Read `mission.md` and `tech-stack.md`, and the story's rows in `roadmap.md`.
   - Check the code locations the subtasks cite against `origin/main` in `hej` (read-only `git grep`
     or `git show`) — backlog line numbers go stale.
   - Read any sandbox plan or review the script lists, to take over decisions already made.

3. **Interview: exactly three questions, in one AskUserQuestion call**, before writing any file.
   - **Scope** — what is in and out, and the behaviour or data involved.
   - **Decisions** — implementation choices and any pending client decision.
   - **Context** — constraints, ordering against other stories, the roadmap groups that
     must collaborate on it, and risks.

   Build concrete options from what step 2 found, with the recommended option first.

4. **Write the three files** from `${CLAUDE_SKILL_DIR}/templates/` into
   `docs/specs/YYYY-MM-DD-<story-id>-<slug>/`. Use today's date, the story id in capitals, and a
   kebab-case slug of at most five words.
   - `requirements.md` — Scope, Out of Scope, Decisions, Context, Stakeholder Notes.
   - `plan.md` — numbered task groups numbered continuously; group by ticket and layer, and note which
     roadmap group covers each; end with Tests, Docs Sync and Verify.
   - `validation.md` — the Definition of Done as numbered checks with commands, then Not Required.

   Keep it big-picture: outcomes, not commit steps or file-and-line instructions, unless a location
   is what a decision is about.

5. **Link the levels.** For tickets Hanchen owns, point `plan.md` at
   `docs/sandbox/W<n>/plans/plan-<ticket>.md`. If that file exists, add a link back to the spec. If it
   does not, offer to create it — do not create it unasked.

6. **Branch.** Do not create or switch branches. `requirements.md` names the working branch
   (`CS57-<Name>` or `CS57-<Name>-<topic>`). Give the user the command to run.

7. **Report back** with the folder path, one line per file, and the decisions still open.

## Close out a spec

When the user says the story is done:
1. Go through `validation.md` check by check. Run the automated ones yourself; ask the user to confirm
   the manual ones.
2. If everything passes:
   - mark the story's row ✅ in `roadmap.md` and add the spec folder link;
   - remind the user to log the PR in the tracker and move tickets to Done;
   - offer to run `tracking-sync`.
3. If a check fails, list what is missing and leave the roadmap unchanged.

## Never

- Write product code while creating a spec.
- Create, switch or push git branches.
- Write to `docs/shared/`, except through `tracking-sync`.
- Widen the story. Extra work goes under Out of Scope, naming the story that owns it.
- Write a spec for A1, A5 or K1–K4. They are set aside (`mission.md` → Stories Set Aside) until the
  user reopens them.
