import type { Metadata } from "next"
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppShell } from "@/components/app-shell"
import { cn } from "@workspace/ui/lib/utils"

const fontSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
})

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Hej!",
  description: "Human evaluation and judgment infrastructure platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontSans.variable, fontMono.variable)}
    >
      <body className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(251,244,230,0.86),transparent_34%),linear-gradient(180deg,#f3efe5_0%,#f1eadb_52%,#f6f3eb_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,rgba(71,85,105,0.24),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)] dark:text-slate-100">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
