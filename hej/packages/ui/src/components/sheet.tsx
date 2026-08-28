import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

function Sheet({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-40 bg-slate-950/18 backdrop-blur-[1px] dark:bg-black/40",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=open]:ease-out",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150 data-[state=closed]:ease-out",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  overlayClassName,
  side = "right",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  overlayClassName?: string
}) {
  return (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex min-h-0 flex-col border border-slate-900/10 bg-white/96 shadow-[0_18px_50px_rgba(15,23,42,0.14)] outline-none dark:border-white/10 dark:bg-slate-900/96 dark:shadow-[0_20px_60px_rgba(2,6,23,0.5)]",
          "data-[state=open]:animate-in data-[state=open]:duration-250 data-[state=open]:ease-out",
          "data-[state=closed]:animate-out data-[state=closed]:duration-150 data-[state=closed]:ease-out",
          side === "right" &&
            "top-4 right-4 bottom-4 w-[min(380px,calc(100vw-2rem))] rounded-[1.1rem] data-[state=open]:slide-in-from-right-8 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-8 data-[state=closed]:fade-out-0",
          side === "left" &&
            "top-4 left-4 bottom-4 w-[min(380px,calc(100vw-2rem))] rounded-[1.1rem] data-[state=open]:slide-in-from-left-8 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-left-8 data-[state=closed]:fade-out-0",
          side === "top" &&
            "top-4 right-4 left-4 rounded-[1.1rem] data-[state=open]:slide-in-from-top-8 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-8 data-[state=closed]:fade-out-0",
          side === "bottom" &&
            "right-4 bottom-4 left-4 rounded-[1.1rem] data-[state=open]:slide-in-from-bottom-8 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-8 data-[state=closed]:fade-out-0",
          className
        )}
        {...props}
      />
    </SheetPortal>
  )
}

function SheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex flex-col gap-1 border-b border-slate-900/10 px-4 py-3 dark:border-white/10",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-sm font-semibold text-slate-900 dark:text-slate-100", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-xs leading-5 text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  )
}

function SheetBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("max-h-[calc(100%-4.5rem)] overflow-y-auto p-4", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
