"use client"

import { usePathname } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { RouteBreadcrumbRegistryProvider } from "@/components/route-breadcrumb-registry"

export function AppShellBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return <>{children}</>
  }

  return (
    <RouteBreadcrumbRegistryProvider>
      <AppShell>{children}</AppShell>
    </RouteBreadcrumbRegistryProvider>
  )
}
