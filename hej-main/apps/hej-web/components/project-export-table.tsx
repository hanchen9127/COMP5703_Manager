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
import type { MockExportPackage } from "@/lib/mock-data"

type ProjectExportTableProps = {
  exports: MockExportPackage[]
}

export function ProjectExportTable({ exports }: ProjectExportTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-900/10">
          <TableHead>Package</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Count</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exports.map((item) => (
          <TableRow key={item.id} className="border-slate-900/10">
            <TableCell className="min-w-[280px]">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.id}</p>
                <p className="mt-1 text-[13px] leading-5 text-slate-600 break-all">
                  {item.destination}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{item.status}</Badge>
            </TableCell>
            <TableCell className="text-sm text-slate-700">{item.format}</TableCell>
            <TableCell className="text-sm font-medium text-slate-900">
              {item.itemCount}
            </TableCell>
            <TableCell className="text-right">
              <Button asChild size="sm" className="bg-slate-900 text-stone-100">
                <Link href={`/exports/${item.id}`}>
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
