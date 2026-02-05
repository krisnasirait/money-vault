"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Transaction } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface CashFlowChartProps {
    transactions: Transaction[];
    className?: string;
}

export default function CashFlowChart({ transactions, className }: CashFlowChartProps) {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        if (transactions.length === 0) {
            setData([]);
            return;
        }

        const sortedDetails = [...transactions].sort((a, b) => a.date.seconds - b.date.seconds);
        const grouped = sortedDetails.reduce((acc, tx) => {
            // Safety check for date
            if (!tx.date || !tx.date.seconds) return acc;

            const date = new Date(tx.date.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!acc[date]) {
                acc[date] = { date, income: 0, expense: 0 };
            }

            if (tx.type === 'income') {
                acc[date].income += tx.amount;
            } else if (tx.type === 'expense') {
                acc[date].expense += tx.amount;
            } else if (tx.type === 'transfer' && tx.transferFee) {
                // Include transfer fee as expense
                acc[date].expense += tx.transferFee;
            }

            return acc;
        }, {} as Record<string, any>);

        const chartData = Object.values(grouped);
        setData(chartData);
    }, [transactions]);

    if (data.length === 0) {
        return (
            <div className={`h-full w-full flex items-center justify-center text-zinc-600 text-sm ${className || ''}`}>
                No activity to display
            </div>
        );
    }

    return (
        <div className={`h-full w-full pt-4 ${className || ''}`}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis
                        dataKey="date"
                        stroke="#a1a1aa"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        stroke="#a1a1aa"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#18181b',
                            borderColor: '#27272a',
                            borderRadius: '12px',
                            color: '#f4f4f5',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                        labelStyle={{ color: '#a1a1aa', marginBottom: '8px', fontSize: '12px' }}
                        cursor={{ stroke: '#27272a', strokeWidth: 1 }}
                        formatter={(value: number | undefined) => [formatCurrency(value || 0), ""]}
                    />
                    <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#10B981', strokeWidth: 0 }}
                        name="Income"
                        animationDuration={1000}
                    />
                    <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#F43F5E"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#F43F5E', strokeWidth: 0 }}
                        name="Expense"
                        animationDuration={1000}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
