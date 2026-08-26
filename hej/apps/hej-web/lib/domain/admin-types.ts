export type ActivityEvent = {
  time: string
  actor: string
  action: string
  detail: string
}

export type MockUserProfile = {
  id: string
  displayName: string
  email: string
  status: string
  twoFactorEnabled: boolean
  memberships: string[]
  roles: string[]
}

export type MockAdminMember = {
  id: string
  displayName: string
  email: string
  organizationId: string
  organizationName: string
  roles: string[]
  status: string
  twoFactorEnabled: boolean
  lastSeen: string
}
