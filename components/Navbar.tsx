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
        return pathname === path
            ? "text-white font-medium bg-white/10"
            : "text-zinc-400 hover:text-white hover:bg-white/5 transition-all";
    };

    const linkBase = "px-4 py-2 rounded-full text-sm transition-all duration-200";

    return (
        <nav className="sticky top-4 z-50 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
            <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md shadow-2xl shadow-black/50">
                <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                <Wallet className="h-4 w-4" />
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight">Vault</span>
                        </Link>

                        {user && (
                            <div className="hidden md:flex items-center gap-2">
                                <Link href="/" className={`${linkBase} ${isActive("/")}`}>Overview</Link>
                                <Link href="/transactions" className={`${linkBase} ${isActive("/transactions")}`}>Transactions</Link>
                                <Link href="/accounts" className={`${linkBase} ${isActive("/accounts")}`}>Accounts</Link>
                                <Link href="/budgets" className={`${linkBase} ${isActive("/budgets")}`}>Budgets</Link>
                            </div>
                        )}
                    </div>

                    {user && (
                        <div className="flex items-center gap-4">
                            <button className="rounded-full p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors hidden sm:block">
                                <Bell className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-3 pl-4 border-l border-white/5">
                                <Link href="/settings" className="group flex items-center gap-3">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-medium text-white group-hover:text-primary transition-colors">{displayName}</p>
                                    </div>
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center text-xs font-bold text-white group-hover:border-primary/50 transition-all shadow-inner">
                                        {user?.email?.[0].toUpperCase()}
                                    </div>
                                </Link>

                                {/* Mobile Menu Toggle */}
                                <button
                                    className="md:hidden p-2 text-zinc-400 hover:text-white"
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
                    <div className="md:hidden p-4 border-t border-white/5 flex flex-col gap-2">
                        <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-lg flex items-center gap-3 ${pathname === "/" ? "bg-primary/20 text-primary" : "text-zinc-400"}`}>Overview</Link>
                        <Link href="/transactions" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-lg flex items-center gap-3 ${pathname === "/transactions" ? "bg-primary/20 text-primary" : "text-zinc-400"}`}>Transactions</Link>
                        <Link href="/accounts" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-lg flex items-center gap-3 ${pathname === "/accounts" ? "bg-primary/20 text-primary" : "text-zinc-400"}`}>Accounts</Link>
                        <Link href="/budgets" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-lg flex items-center gap-3 ${pathname === "/budgets" ? "bg-primary/20 text-primary" : "text-zinc-400"}`}>Budgets</Link>
                        <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)} className={`p-3 rounded-lg flex items-center gap-3 ${pathname === "/settings" ? "bg-primary/20 text-primary" : "text-zinc-400"}`}>Settings</Link>

                        <div className="my-2 border-t border-white/5 pt-2">
                            <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="w-full text-left p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">Sign Out</button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
