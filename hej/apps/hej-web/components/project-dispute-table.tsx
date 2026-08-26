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
import type { MockDisputeCase } from "@/lib/domain/case-types"

type ProjectDisputeTableProps = {
  disputes: MockDisputeCase[]
}

function severityClass(severity: string): string {
  switch (severity) {
    case "high":
      return "bg-red-200 text-red-900"
    case "medium":
      return "bg-amber-200 text-amber-900"
    default:
      return "bg-slate-200 text-slate-800"
  }
}

export function ProjectDisputeTable({ disputes }: ProjectDisputeTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-900/10">
          <TableHead>Case</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Assigned</TableHead>
          <TableHead>Source task</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {disputes.map((dispute) => (
          <TableRow key={dispute.id} className="border-slate-900/10">
            <TableCell className="min-w-[260px]">
              <div>
                <p className="text-sm font-semibold text-slate-900">{dispute.id}</p>
                <p className="mt-1 text-[13px] leading-5 text-slate-600">
                  {dispute.disagreementSummary}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{dispute.status}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={severityClass(dispute.severity)}>{dispute.severity}</Badge>
            </TableCell>
            <TableCell className="text-sm text-slate-700">{dispute.assignedTo}</TableCell>
            <TableCell>
              <Link
                href={`/tasks/${dispute.taskId}`}
                className="text-[13px] font-medium text-slate-700 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                {dispute.taskId}
              </Link>
            </TableCell>
            <TableCell className="text-right">
              <Button asChild size="sm" className="bg-slate-900 text-stone-100">
                <Link href={`/tasks/${dispute.taskId}`}>
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
