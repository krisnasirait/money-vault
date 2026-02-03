"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, Bell, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Don't show navbar on login page
    if (pathname === "/login") return null;

    const displayName = user?.displayName || user?.email?.split('@')[0] || "User";

    const isActive = (path: string) => {
        return pathname === path ? "text-white" : "hover:text-white transition-colors";
    };

    return (
        <nav className="border-b border-border bg-[#0B0D12]/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <span className="text-lg font-bold text-white">Vault</span>
                        </div>
                        {user && (
                            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
                                <Link href="/" className={isActive("/")}>Dashboard</Link>
                                <Link href="/transactions" className={isActive("/transactions")}>Transactions</Link>
                                <Link href="/accounts" className={isActive("/accounts")}>Accounts</Link>
                                {/* Placeholder links */}
                                <Link href="/budgets" className={isActive("/budgets")}>Budgets</Link>
                                <Link href="/settings" className={isActive("/settings")}>Settings</Link>
                            </div>
                        )}
                    </div>

                    {user && (
                        <div className="flex items-center gap-4">
                            <button className="rounded-full p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors hidden sm:block">
                                <Bell className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-4 sm:border-l sm:border-white/10 sm:pl-4">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-white capitalize">{displayName}</p>
                                    <button onClick={() => signOut()} className="text-xs text-red-400 hover:text-red-300">Sign Out</button>
                                </div>
                                <Link href="/settings" className="hidden sm:block h-8 w-8 rounded-full bg-gray-700 overflow-hidden ring-2 ring-white/10 hover:ring-primary transition-all cursor-pointer">
                                    <div className="flex h-full w-full items-center justify-center bg-primary text-xs font-bold text-white">
                                        {user?.email?.[0].toUpperCase()}
                                    </div>
                                </Link>

                                {/* Mobile Menu Toggle */}
                                <button
                                    className="md:hidden p-2 text-gray-400 hover:text-white"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                >
                                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Drawer */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-[#0B0D12] border-b border-white/10 p-4 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-top-2 border-t border-white/5 z-50">
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-lg flex items-center gap-3 ${pathname === "/" ? "bg-white/10 text-white" : "text-gray-400"}`}>Dashboard</Link>
                        <Link href="/transactions" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-lg flex items-center gap-3 ${pathname === "/transactions" ? "bg-white/10 text-white" : "text-gray-400"}`}>Transactions</Link>
                        <Link href="/accounts" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-lg flex items-center gap-3 ${pathname === "/accounts" ? "bg-white/10 text-white" : "text-gray-400"}`}>Accounts</Link>
                        <Link href="/budgets" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-lg flex items-center gap-3 ${pathname === "/budgets" ? "bg-white/10 text-white" : "text-gray-400"}`}>Budgets</Link>
                        <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-lg flex items-center gap-3 ${pathname === "/settings" ? "bg-white/10 text-white" : "text-gray-400"}`}>Settings</Link>

                        <div className="h-px bg-white/10 my-1" />

                        <div className="flex items-center justify-between p-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                                    {user?.email?.[0].toUpperCase()}
                                </div>
                                <span className="text-sm text-gray-300 font-medium">{displayName}</span>
                            </div>
                            <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="text-sm font-medium text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-md">Sign Out</button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
