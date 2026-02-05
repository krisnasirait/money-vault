"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getBudgets, addBudget, updateBudget, deleteBudget } from "@/lib/budgets";
import { getTransactions } from "@/lib/transactions";
import { getUserSettings } from "@/lib/settings";
import { getCustomCategories } from "@/lib/categories";
import { Budget, Transaction, DEFAULT_CATEGORIES, UserSettings, Category } from "@/types";
import { formatCurrency, getCycleRange, formatCycleLabel } from "@/lib/utils";
import BudgetModal from "@/components/BudgetModal";
import BudgetVsActualChart from "@/components/BudgetVsActualChart";
import {
    Plus,
    MoreVertical,
    ShoppingBag,
    Utensils,
    Car,
    Home,
    Film,
    Heart,
    Wallet,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Tag
} from "lucide-react";

// Icons Mapping
const CATEGORY_ICONS: Record<string, any> = {
    'Food': Utensils,
    'Transport': Car,
    'Housing': Home,
    'Entertainment': Film,
    'Health': Heart,
    'Shopping': ShoppingBag,
    'Utilities': Home,
    'Dining & Drinks': Utensils,
    'Salary': Wallet,
    'Freelance': Wallet,
    'Tag': Tag
};

export default function BudgetsPage() {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [settings, setSettings] = useState<UserSettings>({ cycleStartDay: 1 });
    const [customCategories, setCustomCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);

    // Month Selection (simplified to current month for MVP, but prepared for state)
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    // Align default view with Calendar Month for early-start cycles
    useEffect(() => {
        if (settings.cycleStartDay > 1 && settings.cycleStartDay < 20) {
            const today = new Date();
            const day = today.getDate();
            // If we are in the 'gap' (e.g. Feb 4, start is 5), we show "Previous Month" cycle by default.
            // But if user expects "Current Calendar Month", we should jump to the next cycle.
            if (day < settings.cycleStartDay) {
                const nextCycle = new Date(today);
                nextCycle.setDate(settings.cycleStartDay);
                setCurrentDate(nextCycle);
            }
        }
    }, [settings.cycleStartDay]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [b, t, s, c] = await Promise.all([
                getBudgets(user.uid),
                getTransactions(user.uid),
                getUserSettings(user.uid),
                getCustomCategories(user.uid)
            ]);
            setBudgets(b);
            setTransactions(t);
            setSettings(s);
            setCustomCategories(c);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBudget = async (data: any) => {
        if (!user) return;
        if (editingBudget && editingBudget.id) {
            await updateBudget(editingBudget.id, data);
        } else {
            await addBudget(user.uid, data);
        }
        loadData();
    };

    const handleDeleteBudget = async (id: string) => {
        await deleteBudget(id);
        loadData();
    };

    const handleEdit = (b: Budget) => {
        setEditingBudget(b);
        setIsModalOpen(true);
    };

    const handleAdd = (categoryName?: string) => {
        // If adding for a specific category without a budget ID, pass it as partial data
        if (categoryName) {
            setEditingBudget({ categoryName } as any);
        } else {
            setEditingBudget(undefined);
        }
        setIsModalOpen(true);
    };

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

    // --- Calculations ---

    const currentMonthStats = useMemo(() => {
        const { start, end } = getCycleRange(currentDate, settings.cycleStartDay);

        // Filter transactions for this cycle
        const cycleTxs = transactions.filter(tx => {
            const d = new Date(tx.date.seconds * 1000);
            return d >= start && d <= end && tx.type === 'expense';
        });

        const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

        const allCategories = [
            ...DEFAULT_CATEGORIES.filter(c => c.type === 'expense'),
            ...customCategories
        ];

        // Create map of Budget by Category Name
        const budgetMap = new Map(budgets.map(b => [b.categoryName, b]));

        // Calculate progress for ALL categories
        const budgetProgress = allCategories.map(cat => {
            const budget = budgetMap.get(cat.name);
            const spent = cycleTxs
                .filter(tx => tx.categoryName === cat.name)
                .reduce((sum, tx) => sum + tx.amount, 0);

            if (budget) {
                return {
                    ...budget,
                    hasBudget: true,
                    spent,
                    remaining: budget.amount - spent,
                    percentage: Math.min(100, (spent / budget.amount) * 100)
                };
            } else {
                return {
                    id: `no-budget-${cat.name}`,
                    categoryName: cat.name,
                    amount: 0,
                    ownerId: '',
                    createdAt: null,
                    updatedAt: null,
                    hasBudget: false,
                    spent,
                    remaining: 0,
                    percentage: 0
                };
            }
        });

        // Unique categories only (in case defaults name conflicts with something else, though unlikely)
        // Set logic to handle potential duplicates if any
        const uniqueBudgetProgress = Array.from(new Map(budgetProgress.map(item => [item.categoryName, item])).values());

        const totalSpent = uniqueBudgetProgress.reduce((sum, b) => sum + b.spent, 0);
        const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        return {
            totalBudget,
            totalSpent,
            totalRemaining: totalBudget - totalSpent,
            totalPercentage,
            budgetProgress: uniqueBudgetProgress,
            cycleStart: start,
            cycleEnd: end
        };
    }, [budgets, transactions, currentDate, settings, customCategories]);

    const daysLeft = useMemo(() => {
        const { end } = getCycleRange(currentDate, settings.cycleStartDay);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, [currentDate, settings]);

    const monthName = useMemo(() => {
        const range = getCycleRange(currentDate, settings.cycleStartDay);
        return formatCycleLabel(range, settings.cycleStartDay);
    }, [currentDate, settings.cycleStartDay]);

    // History Data (Last 6 Months)
    const historyData = useMemo(() => {
        const data = [];
        const today = new Date();
        // Use current total budget as the baseline for comparison
        const currentTotalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

        for (let i = 5; i >= 0; i--) {
            // Create a reference date for the month (using 15th to be safe for finding the cycle)
            // Actually, getCycleRange logic: if day < startDay, it goes to prev month.
            // If we want "The cycle that ends in Month X" or "Starts in Month X"?
            // Let's just iterate 0..5 months back from "now".
            const d = new Date();
            d.setMonth(today.getMonth() - i);

            const { start, end } = getCycleRange(d, settings.cycleStartDay);

            const monthlySpent = transactions
                .filter(tx => {
                    const txDate = new Date(tx.date.seconds * 1000);
                    return txDate >= start && txDate <= end && tx.type === 'expense';
                })
                .reduce((sum, tx) => sum + tx.amount, 0);

            data.push({
                month: (settings.cycleStartDay >= 20 ? end : start).toLocaleString('default', { month: 'short' }),
                budget: currentTotalBudget,
                actual: monthlySpent
            });
        }
        return data;
    }, [transactions, budgets, settings.cycleStartDay]);

    return (
        <div className="min-h-screen bg-[#0B0D12] text-foreground p-6 sm:p-8 font-sans">
            <div className="mx-auto max-w-6xl space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Budgets</h1>
                        <p className="text-gray-400 mt-1">Manage your monthly spending limits.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center bg-[#161920] border border-white/5 rounded-lg p-1">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="px-4 text-sm font-medium text-gray-200">
                                {monthName}
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => handleAdd()}
                            className="bg-primary hover:bg-primary/90 text-white rounded-full p-2 md:px-4 md:py-2 flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus className="h-5 w-5" />
                            <span className="hidden md:inline font-bold">New Budget</span>
                        </button>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="w-full bg-[#161920] rounded-2xl p-6 md:p-8 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-blue-400 font-medium tracking-wider mb-2">
                                <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                                TOTAL MONTHLY BUDGET
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                                    {formatCurrency(currentMonthStats.totalSpent)}
                                </span>
                                <span className="text-xl text-gray-500 font-medium">
                                    of {formatCurrency(currentMonthStats.totalBudget)}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-white mb-1">
                                {Math.round(currentMonthStats.totalPercentage)}%
                            </div>
                            <div className="text-sm text-gray-400">Total Spent</div>
                        </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="h-4 w-full bg-[#0B0D12] rounded-full overflow-hidden border border-white/5 mb-4">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-primary transition-all duration-1000 ease-out"
                            style={{ width: `${currentMonthStats.totalPercentage}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-400">{formatCurrency(currentMonthStats.totalRemaining)} Remaining</span>
                        <span className="bg-white/5 px-3 py-1 rounded-md text-gray-300 border border-white/5">
                            {daysLeft} Days Left in Cycle
                        </span>
                    </div>
                </div>

                {/* Categories Grid */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            Categories
                        </h2>
                        <button className="text-xs font-bold text-primary hover:text-primary/80 uppercase tracking-wider">Manage Categories</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentMonthStats.budgetProgress.map((budget: any) => {
                            const Icon = CATEGORY_ICONS[budget.categoryName] || Tag;

                            // No Budget State
                            if (!budget.hasBudget) {
                                return (
                                    <div
                                        key={budget.categoryName}
                                        onClick={() => handleAdd(budget.categoryName)}
                                        className="bg-[#161920] rounded-2xl p-5 border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-all group cursor-pointer flex flex-col justify-between min-h-[160px]"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#0B0D12] border border-white/5 text-gray-500">
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-400 text-lg group-hover:text-white transition-colors">{budget.categoryName}</h3>
                                                    <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">No Limit Set</p>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-primary/10 rounded-full text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-baseline mt-2">
                                            <span className="text-white font-bold">{formatCurrency(budget.spent)} <span className="text-xs text-gray-500 font-normal">spent</span></span>
                                            <span className="text-xs font-semibold text-primary">Set Budget</span>
                                        </div>
                                    </div>
                                );
                            }

                            // Has Budget State
                            const isOver = budget.spent > budget.amount;
                            const isWarning = !isOver && budget.percentage > 80;
                            const statusColor = isOver ? 'bg-red-500' : (isWarning ? 'bg-orange-500' : 'bg-primary');

                            return (
                                <div
                                    key={budget.id}
                                    onClick={() => handleEdit(budget)}
                                    className="bg-[#161920] rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center bg-[#0B0D12] border border-white/5 group-hover:border-${isOver ? 'red' : 'primary'}/30 transition-colors`}>
                                                <Icon className={`h-6 w-6 text-gray-400 group-hover:text-white transition-colors`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{budget.categoryName}</h3>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Budget Limit</p>
                                            </div>
                                        </div>
                                        <button className="text-gray-600 hover:text-white transition-colors">
                                            <MoreVertical className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="text-white font-bold">{formatCurrency(budget.spent)} <span className="text-xs text-gray-500 font-normal">spent</span></span>
                                        <span className="text-gray-400 text-sm">{formatCurrency(budget.amount)}</span>
                                    </div>

                                    {/* Progress */}
                                    <div className="h-2 w-full bg-[#0B0D12] rounded-full overflow-hidden mb-4">
                                        <div
                                            className={`h-full ${statusColor} transition-all duration-700`}
                                            style={{ width: `${budget.percentage}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-medium">
                                        <span className={isOver ? "text-red-500" : "text-gray-500"}>
                                            {isOver ? `Over by ${formatCurrency(budget.spent - budget.amount)}` : `${formatCurrency(budget.remaining)} left`}
                                        </span>
                                        {isOver ? (
                                            <span className="flex items-center gap-1 text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                Over Budget
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                {budget.categoryName === 'Food' && daysLeft > 0 && budget.remaining > 0 && (
                                                    <span className="text-white bg-white/10 px-2 py-0.5 rounded text-[10px]">
                                                        {formatCurrency(budget.remaining / daysLeft)} / day
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1 text-green-500">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    On Track
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add Placeholder */}
                        <button
                            onClick={() => handleAdd()}
                            className="bg-[#161920]/50 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 min-h-[200px] text-gray-500 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all group"
                        >
                            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="h-6 w-6" />
                            </div>
                            <span className="font-medium">Create New Category Budget</span>
                        </button>
                    </div>
                </div>

                {/* History Chart */}
                <div className="bg-[#161920] rounded-2xl border border-white/5 p-6 md:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                Budget vs Actual
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">Performance over the last 6 months</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <span className="h-2 w-2 rounded-full bg-[#374151]" />
                                Budget
                            </div>
                            <div className="flex items-center gap-1.5 text-blue-400">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                Actual
                            </div>
                        </div>
                    </div>

                    <BudgetVsActualChart data={historyData} />
                </div>
            </div>

            <BudgetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveBudget}
                onDelete={handleDeleteBudget}
                initialData={editingBudget}
                availableCategories={[...DEFAULT_CATEGORIES.filter(c => c.type === 'expense').map(c => c.name), ...customCategories.map(c => c.name)]}
            />
        </div>
    );
}
