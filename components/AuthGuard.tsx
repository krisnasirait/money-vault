"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user && pathname !== "/login") {
            router.push("/login");
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-black">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
            </div>
        );
    }

    // If on login page and authenticated, redirect to dashboard
    if (user && pathname === "/login") {
        // We can't redirect during render, but the useEffect in login page or here will handle it.
        // However, it's cleaner to let the login page handle the "already logged in" redirect 
        // or handle it here. 
        // For this simple guard: 
        // If we are authenticated and try to render Login, we should probably redirect to root.
        // But typically AuthGuard wraps PROTECTED routes.
        // Let's assume AuthGuard wraps the main app content.
    }

    return <>{children}</>;
}
