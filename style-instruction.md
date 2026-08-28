# HEJ Style Fixes — Design Rationale

Reasoning behind every style/interaction change made to `hej` while applying the `emil-design-eng` skill (Emil Kowalski's design-engineering philosophy — animation as a deliberate decision, not decoration; unseen details compound; buttons must feel responsive).

**Trigger:** the team reported the UI is "really hard to use." The audit below is scoped to what that skill actually covers — interaction feedback, transitions, and motion — not a full UX review. Findings are ordered by how directly they bear on that complaint, highest first.

---

## 1. `Sheet` primitive had no open/close transition at all

**File:** `packages/ui/src/components/sheet.tsx` (`SheetOverlay`, `SheetContent`)

**Before:** no `data-[state=…]` classes on either element — the overlay and panel simply appeared/disappeared with the DOM node.

**After:**
```
// overlay
"data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=open]:ease-out"
"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150 data-[state=closed]:ease-out"

// content (per `side`, e.g. right)
"data-[state=open]:animate-in data-[state=open]:duration-250 data-[state=open]:ease-out
 data-[state=open]:slide-in-from-right-8 data-[state=open]:fade-in-0
 data-[state=closed]:animate-out data-[state=closed]:duration-150 data-[state=closed]:ease-out
 data-[state=closed]:slide-out-to-right-8 data-[state=closed]:fade-out-0"
```

**Why:** the skill's core rule is *"elements appearing or disappearing without transition feel broken."* This primitive is what `TaskItemWorkspaceSheet` is built on — the near-fullscreen panel opened every time someone annotates or reviews an item, i.e. the highest-frequency surface in the whole app. An instant snap on that surface is the single most likely cause of "hard to use": every open/close reads as a jump-cut rather than a continuous, controllable action.

**Duration/easing choices**, per the skill's tables:
- 250ms open / 150ms close — within the "Modals, drawers: 200–500ms" band, and deliberately **asymmetric**: entry is where the user is orienting to new content (slightly slower, more legible), exit is the system confirming a dismissal the user already decided on (faster, matches "release should always be snappy").
- `ease-out` on both — the decision framework's answer to "is the element entering or exiting? → ease-out." `ease-in` was deliberately avoided (it delays the initial movement, i.e. it's slowest exactly when the user is watching most closely).
- Slide distance uses Tailwind's spacing scale (`-8` = 2rem) combined with fade, not a bare instant appearance — consistent with "nothing in the real world appears from nothing."

**Blast radius:** every `Sheet` usage in the app — the annotation/review workspace, the History drawer's mobile sheet, the Model-run drawer's mobile sheet, and any admin dialog built on `Sheet` — inherited this fix from one place, per the skill's Sonner principle *"good defaults matter more than options."*

---

## 2. Shared `Button`: `transition-all` + a barely-visible press state

**File:** `packages/ui/src/components/button.tsx`

**Before:** `transition-all` … `active:translate-y-px`

**After:** `transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out` … `active:scale-[0.97] disabled:active:scale-100`

**Why:**
- `transition-all` is explicitly flagged in the skill's review checklist — it transitions every animatable property that happens to change, including ones you didn't intend to animate, and is more expensive to compute than a named list.
- A 1px vertical nudge is close to imperceptible at normal viewing distance. `scale(0.97)` is the skill's standard prescription for "buttons must feel responsive" — it's a small enough scale to stay subtle (the recommended 0.95–0.98 range) but large enough to actually register as a press.
- `disabled:active:scale-100` prevents a disabled button from visually "pressing" if a stray click event ever reaches it (defensive, since `disabled:pointer-events-none` already blocks the interaction in practice).

**Blast radius:** every button in the app, including "Collapse drawer," all form submits, and every icon button — this is the highest-leverage single change in the pass.

---

## 3. Review-decision pills and chip/toggle controls had zero press feedback

**Files:**
- `apps/hej-web/components/task-item-workspace-sheet.tsx` — the accept/revise/reject/escalate review-action pills, and the text-span verdict-label picker
- `apps/hej-web/components/task-create-form.tsx` — the task-class, task-type, and execution-mode selector cards, and the step-progress pills
- `apps/hej-web/components/task-dataset-registration-panel.tsx` — the CSV/S3 batch-mode toggle

**Before:** `transition-colors` (or nothing) only — hover changed color, `:active` did nothing.

**After:** explicit transition list including `transform`, plus `active:scale-[0.97]` (small pills) or `active:scale-[0.98]` (larger cards — a smaller scale delta reads better on bigger surfaces so the whole card doesn't visibly "jump").

**Why:** these are not decorative — they are the actual decision controls: which task class, which task type, which execution mode, and critically, **accept/revise/reject/escalate is the literal review verdict**, the single most important click in the entire workflow. Per the skill, *"buttons must feel responsive… this applies to any pressable element."* Before this fix, clicking any of them gave no confirmation the click registered — on a trackpad or a slightly-off tap, a user has no way to tell whether their decision was captured, which reads directly as "the UI doesn't respond" / "hard to use."

**Technical note:** these were changed from `transition-colors` to an explicit bracketed property list (`transition-[color,background-color,border-color,transform]`) rather than simply adding a second `transition-transform` class alongside — Tailwind utilities for `transition-*` all set the same underlying `transition-property` declaration, so two such classes on one element would silently collide (only one wins in the cascade, not both). One explicit list avoids that trap entirely.

---

## 4. Popover entrance was a flat fade with no origin awareness

**File:** `packages/ui/src/components/select.tsx` (`SelectContent`)

**Before:** `data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0` only — no scale, no `transform-origin`.

**After:** added `zoom-in-95` / `zoom-out-95`, `duration-150` open / `duration-100` close, and `origin-[var(--radix-select-content-transform-origin)]`.

**Why:** the skill's rule is *"popovers should scale in from their trigger, not from center."* Radix already computes and exposes the correct anchor point as a CSS variable — the fix was essentially free (no positioning logic to write), and a plain fade with no scale reads as flatter/duller than intended in a design system that clearly reaches for polish elsewhere (see the card shadows and gradients across the app). This is the one change in this pass that's about upgrading acceptable-but-plain to actually intentional, rather than fixing something broken.

---

## 5. Six copies of a card hover-lift effect used `transition-all`

**Files:** `projects-overview-panel.tsx`, `project-workspace-overview.tsx` (×4), `task-overview-panel.tsx`

**Before:** `transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[…]`

**After:** `transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 …`

**Why:** identical reasoning to the Button fix (checklist item: avoid `transition: all`), just at a different call site, copy-pasted six times. Naming the exact properties that change (`transform`, `box-shadow`, `border-color`, and — where the card also darkens on hover — `background-color`) means the browser never has to guess which of an element's animatable properties actually need interpolating.

**Note on what I did *not* find here:** I initially suspected these `hover:` lift effects could get "stuck" on touch devices (tap-and-hold triggering a hover state with no way to release it) — a real, common bug in older codebases. I checked and ruled it out: this project runs Tailwind CSS v4.2.2, where the `hover:` variant compiles to `@media (hover: hover) { &:hover {…} }` by default (a change Tailwind made in v3.4 specifically to fix this class of bug), so touch devices never trigger these states at all. Flagging this here so it's clear it was checked, not missed.

---

## 6. Docked drawer toggle buttons had no feedback and no accessible name

**Files:** `history-drawer.tsx`, `model-run-drawer.tsx` (the chevron `<button>` that expands/collapses the History and Model-run side panels on large screens)

**Before:**
```tsx
<button
  type="button"
  onClick={() => setOpen((v) => !v)}
  className="… bg-white text-slate-700 …"
>
  <ChevronRight className={cn("size-4 transition-transform", open && "rotate-180")} />
</button>
```
No hover state, no active state, no `aria-label` — a bare chevron icon with no text.

**After:** added `hover:bg-stone-50 active:scale-[0.94]` with an explicit transition, `aria-label={open ? "Collapse … panel" : "Expand … panel"}`, and `aria-expanded={open}`; the chevron's own rotate transition was given an explicit `duration-200 ease-out` instead of relying on Tailwind's unstated default. The wrapping drawer's slide transition was likewise given an explicit `duration-200 ease-out` instead of an unstated default.

**Why:** this small tab is the *only* way to reach the History and Model-run panels on desktop — before this fix it looked static even while hovered, gave no press confirmation, and (since it carries no visible text) had no accessible name for a screen reader. This sits slightly outside the skill's animation-specific checklist but falls squarely under its broader framing — *"the unseen details that make software feel great"* — and directly serves the same "hard to use" complaint: a control that gives no feedback is functionally indistinguishable, to the user, from a broken one.

---

## 7. No `prefers-reduced-motion` support anywhere in the app

**File:** `packages/ui/src/styles/globals.css`

**Before:** nothing — zero media queries for reduced motion in the whole stylesheet.

**After:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Why:** the skill's accessibility section is explicit that motion-sensitive users need an opt-out, and this codebase had none — every animation added in this pass (and every one already present) would otherwise be forced on everyone unconditionally.

**Deliberate simplification, flagged rather than hidden:** the skill's fuller guidance is *"reduced motion means fewer and gentler animations, not zero — keep opacity and color transitions that aid comprehension, remove movement."* The blanket rule above collapses transitions and animations uniformly rather than only stripping `transform`-based movement, because doing the more nuanced version correctly would mean auditing and re-declaring a reduced-motion variant of every transition list touched in this pass individually. This is the standard, widely-used baseline (it satisfies WCAG 2.3.3 in practice — state changes still happen, just without the animated journey between them) and a strict improvement over having nothing; a follow-up pass could selectively re-enable opacity/color fades under this media query if finer-grained treatment is wanted later.

---

## What this pass did not touch

- The ~40 other components in `apps/hej-web` (admin dialogs, dataset tables, dispute board, export panels, etc.) — this pass targeted the shared primitives (which propagate everywhere) plus the screens most directly tied to the "hard to use" complaint: the review/annotate workspace and the task-creation wizard.
- The two pre-existing TypeScript errors surfaced by `typecheck`/`build` (`TaskItemTable` signal-prop typing, missing `judgementSignal`) — these are unrelated, already-documented defects (see `fix-plan.md` items 12a/12b), not something this styling pass introduced or was scoped to fix.
- Actual in-browser verification — compilation and the existing test suite were checked (no new failures), but nobody has watched these transitions play in a real browser yet. Recommend clicking through the review workspace and task-creation wizard before considering this done.
