"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  PiggyBank,
  Plus,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet // Keep Wallet for StatCard
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency, getCycleRange } from "@/lib/utils";
import { getUserSettings } from "@/lib/settings";
import { getAccounts } from "@/lib/accounts";
import { getRecentTransactions, getTransactions } from "@/lib/transactions";
import { Account, Transaction } from "@/types";
import CashFlowChart from "@/components/CashFlowChart";

export default function Dashboard() {
  const { user } = useAuth();
  const [totalBalance, setTotalBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [chartTransactions, setChartTransactions] = useState<Transaction[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({ income: 0, expense: 0 });
  const [statsComparison, setStatsComparison] = useState({
    incomeChange: 0,
    expenseChange: 0,
    savingsChange: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  };

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      const [accounts, allTransactions, userSettings] = await Promise.all([
        getAccounts(user.uid),
        getTransactions(user.uid),
        getUserSettings(user.uid)
      ]);

      const currentTotalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      setTotalBalance(currentTotalBalance);

      setRecentTransactions(allTransactions.slice(0, 5));
      setChartTransactions(allTransactions);

      const now = new Date();
      const { start: thisCycleStart, end: thisCycleEnd } = getCycleRange(now, userSettings.cycleStartDay);

      const lastCycleRefDate = new Date(thisCycleStart);
      lastCycleRefDate.setDate(lastCycleRefDate.getDate() - 1);
      const { start: lastCycleStart, end: lastCycleEnd } = getCycleRange(lastCycleRefDate, userSettings.cycleStartDay);

      const thisMonthTxs = allTransactions.filter(tx => {
        const d = new Date(tx.date.seconds * 1000);
        return d >= thisCycleStart && d <= thisCycleEnd;
      });

      const lastMonthTxs = allTransactions.filter(tx => {
        const d = new Date(tx.date.seconds * 1000);
        return d >= lastCycleStart && d <= lastCycleEnd;
      });

      const thisMonthIncome = thisMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const thisMonthExpense = thisMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const thisMonthSavings = thisMonthIncome - thisMonthExpense;

      const lastMonthIncome = lastMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const lastMonthExpense = lastMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const lastMonthSavings = lastMonthIncome - lastMonthExpense;

      setMonthlyStats({ income: thisMonthIncome, expense: thisMonthExpense });

      setStatsComparison({
        incomeChange: calculatePercentageChange(thisMonthIncome, lastMonthIncome),
        expenseChange: calculatePercentageChange(thisMonthExpense, lastMonthExpense),
        savingsChange: calculatePercentageChange(thisMonthSavings, lastMonthSavings)
      });

    } catch (error) {
      console.error("Dashboard data load failed", error);
    } finally {
      setLoading(false);
    }
  };

  const currentSavings = monthlyStats.income - monthlyStats.expense;

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">

        {/* Hero Section: Total Balance with Ambient Glow */}
        <section className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-white/5 p-8 sm:p-12 text-center mb-8">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
          <div className="relative z-10">
            <p className="text-zinc-400 font-medium mb-2 tracking-wide text-sm uppercase">Total Balance</p>
            <h1 className="text-5xl sm:text-7xl font-bold text-white tracking-tight mb-4">
              {formatCurrency(totalBalance)}
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-sm text-zinc-300">
              <span className={currentSavings >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {currentSavings >= 0 ? "+" : ""}{formatCurrency(currentSavings)}
              </span>
              <span className="text-zinc-500">this month</span>
            </div>
          </div>

          {/* Background ambient light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        </section>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <MiniStat
            label="Income"
            value={monthlyStats.income}
            change={statsComparison.incomeChange}
            isGood={true}
          />
          <MiniStat
            label="Expenses"
            value={monthlyStats.expense}
            change={statsComparison.expenseChange}
            isGood={false} // Increase in expense is generally "bad" visually, or at least neutral/orange
          />
          <MiniStat
            label="Savings"
            value={currentSavings}
            change={statsComparison.savingsChange}
            isGood={true}
          />
        </div>

        {/* Two Column Layout for Chart and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Left: Cashflow Chart */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Cash Flow</h3>
              <select className="bg-transparent text-sm text-zinc-500 hover:text-white transition-colors outline-none cursor-pointer">
                <option>This Month</option>
              </select>
            </div>
            <div className="h-64 w-full bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden group hover:border-white/10 transition-colors">
              <CashFlowChart transactions={chartTransactions} />
            </div>
          </div>

          {/* Right: Recent Transactions */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
              <Link href="/transactions" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <div className="text-center p-8 rounded-2xl border border-white/5 border-dashed text-zinc-500">
                  No recent activity
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))
              )}

              <Link href="/transactions" className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/5 border-dashed text-zinc-500 hover:text-white hover:bg-white/5 transition-all text-sm mt-2">
                <Plus className="h-4 w-4" />
                <span>Add New Transaction</span>
              </Link>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

function MiniStat({ label, value, change, isGood }: { label: string, value: number, change: number, isGood: boolean }) {
  // Determine trend color
  // For Income/Savings: Increase (>0) is Good (Emerald), Decrease (<0) is Bad (Rose)
  // For Expenses: Increase (>0) is "Bad" (Rose/Neutral), Decrease (<0) is Good (Emerald)

  let trendColor = "text-zinc-500";
  if (change > 0) trendColor = isGood ? "text-emerald-400" : "text-rose-400";
  if (change < 0) trendColor = isGood ? "text-rose-400" : "text-emerald-400"; // Inverse for expenses

  return (
    <div className="flex flex-col gap-1 p-6 rounded-2xl bg-zinc-900/30 border border-white/5 hover:bg-zinc-900/50 transition-colors group">
      <span className="text-sm text-zinc-500 font-medium group-hover:text-zinc-400 transition-colors">{label}</span>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold text-white">{formatCurrency(value)}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md bg-white/5 ${trendColor}`}>
          {change > 0 ? "+" : ""}{change.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === 'income';

  return (
    <div className="group flex items-center justify-between p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${isIncome ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
          {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
        </div>
        <div>
          <p className="font-medium text-zinc-200 group-hover:text-white transition-colors">{tx.description}</p>
          <p className="text-xs text-zinc-500">
            {new Date(tx.date.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
      <span className={`font-mono font-medium ${isIncome ? 'text-emerald-400' : 'text-zinc-300'}`}>
        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
      </span>
    </div>
  )
}
