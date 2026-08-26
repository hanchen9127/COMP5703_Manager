/**
 * 任务工作区 — 子页面统一外壳（B1）
 *
 * 为什么需要它：
 * - `layout.tsx` 已经负责 PageHeader + ScopedNav；各子 route 的 `page.tsx` 只渲染「主内容」。
 * - 若每个子页各自写 `space-y-4` / 外层 div，容易出现有的页多一层、有的页少一层，视觉节奏不一致。
 * - 本组件只做一件事：给 children 包一层统一的垂直栈间距（Tailwind `space-y-4`）。
 *
 * 不包含什么（刻意保持薄）：
 * - 不负责取数、不负责导航；避免和 layout 职责重叠。
 *
 * 使用位置：Overview / Setup / Items / History / Annotate / Review 的 page.tsx 最外层。
 */
export function TaskWorkspacePage({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>
}
