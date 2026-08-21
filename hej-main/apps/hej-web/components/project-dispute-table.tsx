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
import type { MockDisputeCase } from "@/lib/mock-data"

type ProjectDisputeTableProps = {
  disputes: MockDisputeCase[]
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
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {disputes.map((dispute) => (
          <TableRow key={dispute.id} className="border-slate-900/10">
            <TableCell className="min-w-[280px]">
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
              <Badge className="bg-amber-300 text-slate-950">{dispute.severity}</Badge>
            </TableCell>
            <TableCell className="text-sm text-slate-700">{dispute.assignedTo}</TableCell>
            <TableCell className="text-right">
              <Button asChild size="sm" className="bg-slate-900 text-stone-100">
                <Link href={`/disputes/${dispute.id}`}>
                  Open
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
