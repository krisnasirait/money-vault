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
  const { user, signOut } = useAuth();
  const [totalBalance, setTotalBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [chartTransactions, setChartTransactions] = useState<Transaction[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({ income: 0, expense: 0 });
  const [statsComparison, setStatsComparison] = useState({
    balanceChange: 0,
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

      // Date Setup with Custom Cycle
      const now = new Date();
      // Current Cycle Range
      const { start: thisCycleStart, end: thisCycleEnd } = getCycleRange(now, userSettings.cycleStartDay);

      // Last Cycle Range (Based on start date of this cycle minus 1 day)
      const lastCycleRefDate = new Date(thisCycleStart);
      lastCycleRefDate.setDate(lastCycleRefDate.getDate() - 1);
      const { start: lastCycleStart, end: lastCycleEnd } = getCycleRange(lastCycleRefDate, userSettings.cycleStartDay);

      // Filter Transactions
      const thisMonthTxs = allTransactions.filter(tx => {
        const d = new Date(tx.date.seconds * 1000);
        return d >= thisCycleStart && d <= thisCycleEnd;
      });

      const lastMonthTxs = allTransactions.filter(tx => {
        const d = new Date(tx.date.seconds * 1000);
        return d >= lastCycleStart && d <= lastCycleEnd;
      });

      // Calculate Metrics
      const thisMonthIncome = thisMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const thisMonthExpense = thisMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const thisMonthSavings = thisMonthIncome - thisMonthExpense;

      const lastMonthIncome = lastMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const lastMonthExpense = lastMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const lastMonthSavings = lastMonthIncome - lastMonthExpense;

      // Derived Last Month Balance: Current Balance - (This Month Net Change)
      const lastMonthTotalBalance = currentTotalBalance - thisMonthSavings;

      setMonthlyStats({ income: thisMonthIncome, expense: thisMonthExpense });

      setStatsComparison({
        balanceChange: calculatePercentageChange(currentTotalBalance, lastMonthTotalBalance),
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

  const getTrend = (value: number, inverse = false) => {
    if (value === 0) return 'neutral';
    if (inverse) return value < 0 ? 'up' : 'down'; // For Expenses: negative change is 'good' (up trend color)
    return value > 0 ? 'up' : 'down';
  };

  const formatChange = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}% vs last month`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Balance"
            amount={formatCurrency(totalBalance)}
            change={formatChange(statsComparison.balanceChange)}
            trend={getTrend(statsComparison.balanceChange)}
            icon={<Wallet className="text-primary" />}
          />
          <StatCard
            title="Income"
            amount={formatCurrency(monthlyStats.income)}
            change={formatChange(statsComparison.incomeChange)}
            trend={getTrend(statsComparison.incomeChange)}
            icon={<TrendingUp className="text-green-500" />}
          />
          <StatCard
            title="Expenses"
            amount={formatCurrency(monthlyStats.expense)}
            change={formatChange(statsComparison.expenseChange)}
            trend={getTrend(statsComparison.expenseChange, true)} // Inverse for expense
            icon={<TrendingDown className="text-red-500" />}
          />
          <StatCard
            title="Savings"
            amount={formatCurrency(monthlyStats.income - monthlyStats.expense)}
            change={formatChange(statsComparison.savingsChange)}
            trend={getTrend(statsComparison.savingsChange)}
            icon={<PiggyBank className="text-purple-500" />}
          />
        </div>

        {/* Charts & Transactions Row */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Chart Section */}
          <div className="lg:col-span-3 rounded-2xl bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Monthly Cash Flow</h3>
                <p className="text-sm text-gray-400">Income vs Expense analysis</p>
              </div>
            </div>
            <div className="h-64 w-full text-gray-600 rounded-lg">
              <CashFlowChart transactions={chartTransactions} />
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
            <Link href="/transactions" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No recent transactions.</div>
            ) : (
              recentTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  title={tx.description}
                  date={new Date(tx.date.seconds * 1000).toLocaleDateString()}
                  amount={formatCurrency(tx.amount)}
                  isPositive={tx.type === 'income'}
                  icon={tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, amount, change, trend, icon }: any) {
  // Determine color based on trend
  // For Expense (where we passed inverse=true to getTrend), 'up' meant good (green), 'down' meant bad (red).
  // But wait, getTrend returns 'up' or 'down'. 
  // If we want 'Expense went down' to be green:
  // Expense Change = -5%. formatChange = "-5%". getTrend(-5, true) -> value < 0 ? 'up' : 'down' -> 'up'.
  // So 'up' trend should ALWAYS be green, and 'down' trend ALWAYS red?
  // Usually 'up' arrow means value increased.
  // Let's refine:
  // trend='up' -> Green if good, Red if bad.
  // Simpler: Just resolve color here based on if it's "positive outcome".

  // Actually, standard UI:
  // Green = Good. Red = Bad.
  // Increase in Income = Good (Green). Decrease = Bad (Red).
  // Increase in Expense = Bad (Red). Decrease = Good (Green).

  // Let's look at what we passed:
  // Balance: getTrend(change) -> >0 'up'. Green.
  // Income: getTrend(change) -> >0 'up'. Green.
  // Expense: getTrend(change, true) -> <0 'up'. Green.
  // Savings: getTrend(change) -> >0 'up'. Green.

  // So 'up' means "Positive Outcome / Good". 
  // But purely visual "Up Arrow" might be confusing if value is -5%.
  // Let's settle on: trend string is just 'positive' or 'negative' visual sentiment.

  const isPositiveSentiment = trend === 'up';

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        <div className="rounded-lg bg-white/5 p-2 text-gray-400">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <span className="text-2xl font-bold text-white">{amount}</span>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${trend === 'neutral'
              ? 'text-gray-400 bg-white/5'
              : trend === 'up'
                ? 'text-green-500 bg-green-500/10'
                : 'text-red-500 bg-red-500/10'
            }`}>
            {change}
          </span>
        </div>
      </div>
    </div>
  );
}

function TransactionItem({ title, date, amount, isPositive, icon }: any) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-card border border-border p-4 hover:border-border/80 transition-colors cursor-pointer">
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full  ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {icon}
        </div>
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      </div>
      <span className={`font-medium ${isPositive ? 'text-green-500' : 'text-white'}`}>
        {isPositive ? '+' : '-'}{amount}
      </span>
    </div>
  );
}
