"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
} from "@/lib/transactions";
import { getAccounts } from "@/lib/accounts";
import { getUserSettings } from "@/lib/settings";
import { getCustomCategories } from "@/lib/categories";
import { Transaction, Account, DEFAULT_CATEGORIES, UserSettings, Category } from "@/types";
import TransactionModal from "@/components/TransactionModal";
import {
    Plus,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Calendar,
    ShoppingBag,
    Coffee,
    Film,
    Zap,
    Home,
    Car,
    Heart,
    Wallet,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownLeft,
    Utensils,
    Tag
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, getCycleRange } from "@/lib/utils";

// Map category names to icons
const CATEGORY_ICONS: Record<string, any> = {
    'Food': Utensils,
    'Transport': Car,
    'Entertainment': Film,
    'Shopping': ShoppingBag,
    'Utilities': Zap,
    'Housing': Home,
    'Health': Heart,
    'Salary': Wallet,
    'Freelance': Wallet,
    'Dining & Drinks': Coffee,
    'Groceries': ShoppingBag,
    'Tag': Tag
};

export default function TransactionsPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [settings, setSettings] = useState<UserSettings>({ cycleStartDay: 1 });
    const [customCategories, setCustomCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // Month/Cycle Selection
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filter States
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [txs, accs, s, c] = await Promise.all([
                getTransactions(user.uid),
                getAccounts(user.uid),
                getUserSettings(user.uid),
                getCustomCategories(user.uid)
            ]);
            setTransactions(txs);
            setAccounts(accs);
            setSettings(s);
            setCustomCategories(c);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = () => {
        setEditingTransaction(null);
        setIsModalOpen(true);
    };

    const handleEditTransaction = (tx: Transaction) => {
        setEditingTransaction(tx);
        setIsModalOpen(true);
    };

    const handleSaveTransaction = async (data: any) => {
        if (!user) return;
        if (editingTransaction) {
            await updateTransaction(user.uid, editingTransaction.id, editingTransaction, data);
        } else {
            await addTransaction(user.uid, data);
        }
        loadData();
    };

    const handleDeleteTransaction = async (id: string, accountId: string, amount: number, type: string) => {
        if (!user) return;
        await deleteTransaction(user.uid, id, accountId, amount, type);
        loadData();
    };

    // Derived State: Account Map for quick lookup
    const accountMap = useMemo(() => {
        return accounts.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {} as Record<string, Account>);
    }, [accounts]);

    // Cycle Calculations
    const cycleRange = useMemo(() => {
        return getCycleRange(currentDate, settings.cycleStartDay);
    }, [currentDate, settings.cycleStartDay]);

    const handlePrevMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const formattedCycleLabel = useMemo(() => {
        return cycleRange.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, [cycleRange]);

    // Derived State: Filtered & Grouped Transactions
    const processedData = useMemo(() => {
        let filtered = transactions.filter(tx => {
            // Cycle Filter
            const txDate = new Date(tx.date.seconds * 1000);
            const inCycle = txDate >= cycleRange.start && txDate <= cycleRange.end;
            if (!inCycle) return false;

            const matchesType = filterType === 'all' || tx.type === filterType;
            const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (tx.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "All" || tx.categoryName === selectedCategory;

            return matchesType && matchesSearch && matchesCategory;
        });

        // Group by Date
        const groups: Record<string, Transaction[]> = {};

        filtered.forEach(tx => {
            const date = new Date(tx.date.seconds * 1000);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            let groupKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

            if (date.toDateString() === today.toDateString()) groupKey = "Today";
            else if (date.toDateString() === yesterday.toDateString()) groupKey = "Yesterday";

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(tx);
        });

        return groups;
    }, [transactions, filterType, searchQuery, selectedCategory, cycleRange]);

    const allCategories = useMemo(() => {
        return [...DEFAULT_CATEGORIES, ...customCategories];
    }, [customCategories]);

    const getIcon = (categoryName: string) => {
        // Try direct match
        let Icon = CATEGORY_ICONS[categoryName];

        // Try case-insensitive match if not found
        if (!Icon) {
            const key = Object.keys(CATEGORY_ICONS).find(k => k.toLowerCase() === categoryName.toLowerCase());
            if (key) Icon = CATEGORY_ICONS[key];
        }

        Icon = Icon || Tag;
        return <Icon className="h-5 w-5" />;
    };

    const getCategoryColor = (categoryName: string) => {
        // Simple consistent coloring based on name hash or refined mapping could be added here
        // For now returning defaults styled in render
        return "bg-white/5 text-gray-300";
    };

    return (
        <div className="min-h-screen bg-[#0B0D12] text-foreground p-6 sm:p-8 font-sans">
            <div className="mx-auto max-w-6xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Transactions</h1>
                        <p className="text-gray-400 mt-1">Manage and track your financial activity.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center bg-[#161920] border border-white/5 rounded-lg p-1">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="flex items-center gap-2 px-3 text-sm font-medium text-gray-200 min-w-[140px] justify-center">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{formattedCycleLabel}</span>
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus className="h-4 w-4" />
                            Add Transaction
                        </button>
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="overflow-x-auto pb-1 md:pb-0 -mb-1 md:mb-0">
                            <div className="flex bg-[#161920] rounded-full p-1 border border-white/5 whitespace-nowrap">
                                {(['all', 'income', 'expense'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setFilterType(t)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filterType === t
                                            ? 'bg-white text-black shadow-sm'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-6 w-px bg-white/10 hidden md:block shrink-0" />

                        <div className="relative group shrink-0">
                            <button
                                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg border ${selectedCategory !== 'All'
                                    ? 'bg-white text-black border-white'
                                    : 'text-gray-400 hover:text-white border-transparent hover:bg-white/5'
                                    }`}
                            >
                                <Filter className="h-4 w-4" />
                                <span>{selectedCategory === 'All' ? 'Category' : selectedCategory}</span>
                            </button>

                            {isCategoryDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsCategoryDropdownOpen(false)}
                                    />
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-[#161920] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden flex flex-col max-h-[400px]">
                                        <div className="p-3 border-b border-white/5">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Category</p>
                                        </div>
                                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                            <button
                                                onClick={() => {
                                                    setSelectedCategory('All');
                                                    setIsCategoryDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${selectedCategory === 'All' ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-gray-300'}`}
                                            >
                                                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                                                    <Filter className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium">All Categories</span>
                                            </button>

                                            {allCategories.map(cat => {
                                                const Icon = CATEGORY_ICONS[cat.name] || Tag;
                                                // Try to find icon case-insensitive if not direct match
                                                let DisplayIcon = Icon;
                                                if (!CATEGORY_ICONS[cat.name]) {
                                                    const key = Object.keys(CATEGORY_ICONS).find(k => k.toLowerCase() === cat.name.toLowerCase());
                                                    if (key) DisplayIcon = CATEGORY_ICONS[key];
                                                }

                                                return (
                                                    <button
                                                        key={cat.name}
                                                        onClick={() => {
                                                            setSelectedCategory(cat.name);
                                                            setIsCategoryDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${selectedCategory === cat.name ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-gray-300'}`}
                                                    >
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-white/5 ${selectedCategory === cat.name ? 'text-primary' : 'text-gray-400'}`}>
                                                            <DisplayIcon className="h-4 w-4" />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-medium text-sm">{cat.name}</p>
                                                            <p className="text-[10px] text-gray-500 first-letter:capitalize">{cat.type}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="p-2 border-t border-white/5 bg-[#0B0D12]/50">
                                            <Link href="/settings" className="w-full flex items-center justify-center gap-2 p-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                                                Manage Categories
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#161920] border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors placeholder-gray-600"
                            />
                        </div>
                        <button className="p-2 text-gray-400 hover:text-white border border-white/5 rounded-lg bg-[#161920]">
                            <Filter className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Transactions List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-primary" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.keys(processedData).length === 0 && (
                            <div className="text-center py-20 bg-[#161920] rounded-2xl border border-white/5 border-dashed">
                                <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <Search className="h-6 w-6 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-white">No transactions found</h3>
                                <p className="text-gray-500 mt-1">Try adjusting your filters or search query.</p>
                            </div>
                        )}

                        {Object.entries(processedData).map(([dateGroup, items]) => (
                            <div key={dateGroup}>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 pl-1">{dateGroup}</h3>
                                <div className="space-y-3">
                                    {items.map((tx) => (
                                        <div
                                            key={tx.id}
                                            onClick={() => handleEditTransaction(tx)}
                                            className="group flex flex-col sm:flex-row sm:items-center justify-between bg-[#161920] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getCategoryColor(tx.categoryName || '')} bg-white/5 text-gray-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                                    {getIcon(tx.categoryName || '')}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-white">{tx.description}</h4>
                                                    <p className="text-sm text-gray-500">{tx.categoryName}</p>
                                                </div>
                                                {/* Account Badge */}
                                                <div className="hidden sm:block ml-4 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-gray-400">
                                                    {accountMap[tx.accountId]?.name || "Unknown Account"}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0 pl-[4rem] sm:pl-0">
                                                <div className="text-right">
                                                    <p className={`font-bold ${tx.type === 'income' ? 'text-green-500' : 'text-white'}`}>
                                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(tx.date.seconds * 1000).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditTransaction(tx);
                                                        }}
                                                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Load More */}
                {!loading && Object.keys(processedData).length > 0 && (
                    <div className="mt-10 text-center">
                        <button className="text-sm font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-1 mx-auto transition-colors">
                            Load More Transactions
                            <ChevronRight className="h-4 w-4 rotate-90" />
                        </button>
                    </div>
                )}

                <TransactionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleSaveTransaction}
                    onDelete={handleDeleteTransaction}
                    accounts={accounts}
                    initialData={editingTransaction}
                    categories={allCategories}
                />
            </div>
        </div>
    );
}

