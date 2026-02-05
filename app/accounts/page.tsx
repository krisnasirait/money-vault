"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccounts, addAccount, updateAccount, deleteAccount } from "@/lib/accounts";
import { getRecentTransactions, getTransactions } from "@/lib/transactions";
import { Account, Transaction } from "@/types";
import AccountModal from "@/components/AccountModal";
import {
    Plus,
    Wallet,
    CreditCard,
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    RefreshCw,
    ArrowUpRight,
    ArrowDownLeft,
    DollarSign,
    Landmark,
    Banknote
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import CashFlowChart from "@/components/CashFlowChart";
// We can reuse CashFlowChart or create a specific AccountTrendChart. 
// For now, let's reuse/adapt CashFlowChart logic or creating a simple wrapper.

export default function AccountsPage() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [accs, txs] = await Promise.all([
                getAccounts(user.uid),
                getTransactions(user.uid)
            ]);
            setAccounts(accs);
            setTransactions(txs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccount = () => {
        setEditingAccount(undefined);
        setIsAccountModalOpen(true);
    };

    const handleEditAccount = (account: Account) => {
        setEditingAccount(account);
        setIsAccountModalOpen(true);
    };

    const handleSaveAccount = async (data: any) => {
        if (!user) return;
        if (editingAccount) {
            await updateAccount(editingAccount.id, data);
        } else {
            await addAccount(user.uid, data);
        }
        loadData();
    };

    const handleDeleteAccount = async (id: string) => {
        if (!user) return;
        await deleteAccount(id);
        setIsAccountModalOpen(false);
        loadData();
    }



    // Calculations
    const stats = useMemo(() => {
        // 1. Current Stats
        let currentAssets = 0;
        let currentLiabilities = 0; // Stored as positive magnitude
        let assetCount = 0;
        let liabilityCount = 0;

        accounts.forEach(acc => {
            if (acc.balance >= 0) {
                currentAssets += acc.balance;
                assetCount++;
            } else {
                currentLiabilities += Math.abs(acc.balance);
                liabilityCount++;
            }
        });

        const currentNetWorth = currentAssets - currentLiabilities;

        // 2. Historical Stats (30 days ago)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Map account ID to its balance 30 days ago
        const prevBalances = new Map<string, number>();
        accounts.forEach(acc => prevBalances.set(acc.id, acc.balance));

        // Reverse transactions from now to 30 days ago
        transactions.forEach(tx => {
            const txDate = new Date(tx.date.seconds * 1000);
            if (txDate > thirtyDaysAgo) {
                const accBal = prevBalances.get(tx.accountId) || 0;
                // Reverse logic: Income added to balance, so subtract it. Expense subtracted, so add it.
                if (tx.type === 'income') {
                    prevBalances.set(tx.accountId, accBal - tx.amount);
                } else {
                    prevBalances.set(tx.accountId, accBal + tx.amount);
                }
            }
        });

        let prevAssets = 0;
        let prevLiabilities = 0;

        prevBalances.forEach((bal) => {
            if (bal >= 0) {
                prevAssets += bal;
            } else {
                prevLiabilities += Math.abs(bal);
            }
        });

        const prevNetWorth = prevAssets - prevLiabilities;

        // 3. Calculate Trends
        const calcTrend = (curr: number, prev: number) => {
            if (prev === 0) return curr === 0 ? 0 : 100;
            return ((curr - prev) / prev) * 100;
        };

        return {
            assets: currentAssets,
            assetCount,
            assetsTrend: calcTrend(currentAssets, prevAssets),
            liabilities: currentLiabilities,
            liabilityCount,
            liabilitiesTrend: calcTrend(currentLiabilities, prevLiabilities),
            netWorth: currentNetWorth,
            netWorthTrend: calcTrend(currentNetWorth, prevNetWorth),
            netWorthChange: currentNetWorth - prevNetWorth
        };
    }, [accounts, transactions]);

    const formatTrend = (trend: number) => {
        if (Math.abs(trend) < 0.01) return '— 0.0%';
        const sign = trend > 0 ? '↗' : '↘';
        return `${sign} ${Math.abs(trend).toFixed(1)}%`;
    };

    const getTrendColor = (trend: number, inverse = false) => {
        if (Math.abs(trend) < 0.01) return 'text-gray-500 bg-white/5';
        if (inverse) return trend < 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10';
        return trend > 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10';
    };

    return (
        <div className="min-h-screen bg-[#0B0D12] text-foreground p-6 sm:p-8 font-sans">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Accounts Overview</h1>
                        <p className="text-gray-400 mt-1">Your financial snapshot across all institutions.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-medium">Last updated: Just now</span>
                        <button onClick={loadData} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Total Assets */}
                    <div className="bg-[#161920] rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Wallet className="h-24 w-24 text-green-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-semibold text-gray-300 tracking-wide">TOTAL ASSETS</span>
                            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${getTrendColor(stats.assetsTrend)}`}>
                                {formatTrend(stats.assetsTrend)}
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.assets)}</div>
                        <div className="text-xs text-gray-500">Across {stats.assetCount} accounts</div>
                    </div>

                    {/* Total Liabilities */}
                    <div className="bg-[#161920] rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CreditCard className="h-24 w-24 text-red-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-semibold text-gray-300 tracking-wide">TOTAL LIABILITIES</span>
                            {/* Inverse trend: Descreasing liabilities is Good (Green) */}
                            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${getTrendColor(stats.liabilitiesTrend, true)}`}>
                                {formatTrend(stats.liabilitiesTrend)}
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.liabilities)}</div>
                        <div className="text-xs text-gray-500">{stats.liabilityCount > 0 ? `${stats.liabilityCount} accounts with debt` : 'Debt free'}</div>
                    </div>

                    {/* Net Worth */}
                    <div className="bg-[#161920] rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="h-24 w-24 text-primary" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-semibold text-gray-300 tracking-wide">NET WORTH</span>
                            <button className="ml-auto text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="text-3xl font-bold text-blue-100 mb-1">{formatCurrency(stats.netWorth)}</div>
                        <div className={`text-xs ${Math.abs(stats.netWorthChange) > 0 ? (stats.netWorthChange > 0 ? 'text-green-500' : 'text-red-500') : 'text-gray-500'}`}>
                            {stats.netWorthChange > 0 ? '+' : ''}{formatCurrency(stats.netWorthChange)} this month
                        </div>
                    </div>
                </div>

                {/* My Accounts Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">My Accounts</h2>
                    <button
                        onClick={handleAddAccount}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Add Account
                    </button>
                </div>

                {/* Accounts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {accounts.map((acc) => {
                        const isCredit = acc.type === 'Credit';
                        return (
                            <div
                                key={acc.id}
                                onClick={() => handleEditAccount(acc)}
                                className={`rounded-2xl p-6 border transition-all cursor-pointer group relative overflow-hidden ${isCredit
                                    ? 'bg-[#12141C] border-white/5 hover:border-white/10'
                                    : 'bg-[#161920] border-white/5 hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <p className="text-sm font-medium text-gray-400 mb-1">{acc.type}</p>
                                        <h3 className="text-lg font-bold text-white">{acc.name}</h3>
                                    </div>
                                    <div className={`p-2 rounded-lg ${isCredit ? 'bg-white/5 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                                        {isCredit ? <CreditCard className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <p className="text-2xl font-bold text-white">{formatCurrency(acc.balance)}</p>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-gray-600" />)}
                                        </div>
                                        <span>8829</span> {/* Placeholder last 4 */}
                                    </div>
                                    {!isCredit && (
                                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">Primary</span>
                                    )}
                                    {isCredit && (
                                        <span>Due in 5 days</span>
                                    )}
                                </div>
                                {/* Highlight on hover */}
                                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${isCredit ? 'via-gray-700' : 'via-primary'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                            </div>
                        );
                    })}

                    {/* Add New Placeholder Card */}
                    <button
                        onClick={handleAddAccount}
                        className="rounded-2xl border border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center gap-4 min-h-[180px] text-gray-500 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all group"
                    >
                        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="h-6 w-6" />
                        </div>
                        <span className="font-medium">Add New Account</span>
                    </button>
                </div>

                {/* Bottom Section: Trend Chart & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Chart Section */}
                    <div className="bg-[#161920] rounded-2xl border border-white/5 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white">Checking Account Trend</h3>
                                <p className="text-sm text-gray-400">Balance history</p>
                            </div>
                            <div className="flex items-center gap-2 bg-[#0B0D12] p-1 rounded-lg">
                                <span className="px-3 py-1 text-xs font-medium text-white bg-white/10 rounded-md">30 Days</span>
                                <span className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-white cursor-pointer">90 Days</span>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <CashFlowChart transactions={transactions} />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-[#161920] rounded-2xl border border-white/5 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                            <button className="text-xs font-medium text-primary hover:text-primary/80">View All</button>
                        </div>
                        <div className="space-y-4">
                            {transactions.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-lg -mx-2 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-gray-400'}`}>
                                            {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white text-sm">{tx.description}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(tx.date.seconds * 1000).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-medium text-sm ${tx.type === 'income' ? 'text-green-500' : 'text-white'}`}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            ))}
                            {transactions.length === 0 && (
                                <p className="text-center text-gray-500 text-sm py-4">No recent activity</p>
                            )}
                        </div>
                    </div>
                </div>

                <AccountModal
                    isOpen={isAccountModalOpen}
                    onClose={() => setIsAccountModalOpen(false)}
                    onSubmit={handleSaveAccount}
                    onDelete={handleDeleteAccount}
                    initialData={editingAccount}
                />
            </div>
        </div>
    );
}

