import { notFound } from "next/navigation"

import { OrganizationPageClient } from "./organization-page-client"

type PageProps = {
  params: Promise<{
    organizationId: string
  }>
}

export default async function OrganizationPage({ params }: PageProps) {
  const { organizationId } = await params

  if (!organizationId) {
    notFound()
  }

  return <OrganizationPageClient organizationId={organizationId} initialView={{ organization: null, projects: [] }} />
}
