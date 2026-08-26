import { notFound } from "next/navigation"

type PageProps = {
  params: Promise<{
    disputeId: string
  }>
}

export default async function DisputePage({ params }: PageProps) {
  await params
  notFound()
}
