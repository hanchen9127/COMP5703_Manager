import { notFound } from "next/navigation"

import { AdminOrgMembersPage } from "@/components/admin-org-members-page"

type PageProps = {
  params: Promise<{
    organizationId: string
  }>
}

export default async function MembersPage({ params }: PageProps) {
  const { organizationId } = await params

  if (!organizationId) {
    notFound()
  }

  return <AdminOrgMembersPage organizationId={organizationId} />
}
