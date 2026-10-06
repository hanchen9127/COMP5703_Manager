Hi Kanishka, #54 (SCRUM-119) merged into `main` today (`2343a19`), and #49 now conflicts with it in two files. Both are small. I tried the resolution below on a local merge: typecheck is clean and the web suite passes (42 files, 367 tests).

**1. `components/task-annotation-workspace-with-real-data.tsx`: take `main`'s version.**
Your only change to this file was removing two blank lines between the imports. On `main`, #54 replaced the component's per-item drafts effect (`useEffect` + `listDraftsForTaskItem`) with one batched read through `useTaskDraftsRefresh`, so the old imports would bring back one request per item. Keep `main`'s file as it is.

**2. `lib/api/task-items.test.ts`: keep both changes in the import.**
`main` added `type ApiTaskDraftsResponse`; you moved `ApiWorkQueueItem` to `./work-queues`. The import should read:

```ts
import {
  getAwaitingReviewAnnotationIds,
  listDraftsForTask,
  saveDraft,
  submitTaskItem,
  type ApiDraft,
  type ApiDraftListResponse,
  type ApiTaskDraftsResponse,
} from "./task-items"
import type { ApiWorkQueueItem } from "./work-queues"
```

Everything else merges cleanly. After merging `main`, please run `npx tsc --noEmit` and `npx vitest run` in `apps/hej-web`, then push, so Jingwei can re-review your fixes for his review of 4 Oct together with the merge.
