import { notFound } from "next/navigation"

type PageProps = {
  params: Promise<{
    arbitrationId: string
  }>
}

export default async function ArbitrationPage({ params }: PageProps) {
  await params
  notFound()
}
