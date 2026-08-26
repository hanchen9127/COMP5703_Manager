"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import type { MockExportPackage } from "@/lib/domain/case-types"

type ProjectExportTableProps = {
  exports: MockExportPackage[]
}

function exportScopeLabel(scope: MockExportPackage["exportScope"]) {
  return scope === "full_project" ? "Full project export" : "Draft task export"
}

function exportScopeClass(scope: MockExportPackage["exportScope"]) {
  return scope === "full_project"
    ? "bg-blue-100 text-blue-800"
    : "border border-slate-900/10 bg-white text-slate-700"
}

function statusClass(status: string): string {
  switch (status) {
    case "ready":
      return "bg-emerald-100 text-emerald-800"
    case "delivered":
      return "bg-blue-100 text-blue-800"
    case "building":
    case "assembling":
      return "bg-amber-100 text-amber-800"
    case "failed":
      return "bg-red-100 text-red-900"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "assembling":
      return "building"
    default:
      return status
  }
}

export function ProjectExportTable({ exports }: ProjectExportTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-900/10">
          <TableHead>Scope</TableHead>
          <TableHead>Package</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Format</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exports.map((item) => (
          <TableRow key={item.id} className="border-slate-900/10">
            <TableCell>
              <Badge className={exportScopeClass(item.exportScope)}>
                {exportScopeLabel(item.exportScope)}
              </Badge>
            </TableCell>
            <TableCell className="min-w-[240px]">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.id}</p>
                <p className="mt-1 max-w-[260px] truncate text-[13px] leading-5 text-slate-500">
                  {item.destination}
                </p>
                <p className="mt-1 text-[12px] text-slate-500">Staged task export package</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Badge className={statusClass(item.status)}>
                  {statusLabel(item.status)}
                </Badge>
                {item.isFullProjectReady ? (
                  <span className="text-[12px] text-slate-500">Full project export ready</span>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-sm text-slate-700">{item.format}</TableCell>
            <TableCell className="text-right">
              <Button asChild size="sm" className="bg-slate-900 text-stone-100">
                <Link href={`/tasks/${item.taskId}`}>
                  View task
                  <ArrowRight />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
