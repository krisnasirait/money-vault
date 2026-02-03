"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface BudgetVsActualChartProps {
    data: {
        month: string;
        budget: number;
        actual: number;
    }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1f2937] border border-gray-700 p-3 rounded-lg shadow-xl">
                <p className="text-gray-400 text-xs mb-1">{label}</p>
                <div className="space-y-1">
                    <p className="text-blue-400 text-sm font-medium">
                        Budget: {formatCurrency(payload[0].value)}
                    </p>
                    <p className="text-blue-500 text-sm font-medium">
                        Actual: {formatCurrency(payload[1].value)}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function BudgetVsActualChart({ data }: BudgetVsActualChartProps) {
    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barGap={4}>
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        dy={10}
                    />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />

                    {/* Darker background bars could be simulated, but for simplicity: */}

                    <Bar
                        dataKey="budget"
                        fill="#374151"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />
                    <Bar
                        dataKey="actual"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? '#EF4444' : '#3B82F6'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
