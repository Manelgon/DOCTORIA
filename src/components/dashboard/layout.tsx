"use client"

import dynamic from "next/dynamic"

// Use dynamic imports with SSR disabled for dashboard components 
// to avoid ChunkLoadError and hydration mismatches in development
const Sidebar = dynamic(() => import("./sidebar").then(mod => mod.Sidebar), { ssr: false })
const Navbar = dynamic(() => import("./navbar").then(mod => mod.Navbar), { ssr: false })

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
