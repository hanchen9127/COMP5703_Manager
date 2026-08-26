import { notFound } from "next/navigation"

type PageProps = {
  params: Promise<{
    exportId: string
  }>
}

export default async function ExportPage({ params }: PageProps) {
  await params
  notFound()
}
