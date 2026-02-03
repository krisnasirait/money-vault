"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Transaction } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface CashFlowChartProps {
    transactions: Transaction[];
}

export default function CashFlowChart({ transactions }: CashFlowChartProps) {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        if (transactions.length === 0) {
            setData([]);
            return;
        }

        // Process transactions to generate daily balance/spending trend
        // Sorting transactions by date ascending for the chart
        const sortedDetails = [...transactions].sort((a, b) => a.date.seconds - b.date.seconds);

        // Group by Date (YYYY-MM-DD)
        const grouped = sortedDetails.reduce((acc, tx) => {
            const date = new Date(tx.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!acc[date]) {
                acc[date] = { date, income: 0, expense: 0 };
            }
            if (tx.type === 'income') acc[date].income += tx.amount;
            else if (tx.type === 'expense') acc[date].expense += tx.amount;
            return acc;
        }, {} as Record<string, any>);

        // Convert to array
        const chartData = Object.values(grouped);
        setData(chartData);
    }, [transactions]);

    if (data.length === 0) {
        return (
            <div className="h-64 w-full flex items-center justify-center text-gray-500">
                No data available for chart
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        minTickGap={30}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#F3F4F6' }}
                        itemStyle={{ color: '#F3F4F6' }}
                        formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                        name="Income"
                    />
                    <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#EF4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                        name="Expense"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
