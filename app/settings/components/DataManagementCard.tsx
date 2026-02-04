"use client";

import { Database, Download, Trash2, FileText } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions } from "@/lib/transactions";
import { getAccounts } from "@/lib/accounts";
import { exportTransactionsToCSV, clearAllUserData } from "@/lib/dataManagement";
import { exportTransactionsToPDF } from "@/lib/exportPdf";

export default function DataManagementCard() {
    const { user } = useAuth();
    const [clearing, setClearing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const getFilteredTransactions = async () => {
        if (!user) return [];
        const allTransactions = await getTransactions(user.uid);

        if (!startDate && !endDate) return allTransactions;

        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date(8640000000000000);
        // Ensure end date covers the full day
        if (endDate) end.setHours(23, 59, 59, 999);

        return allTransactions.filter(tx => {
            const txDate = new Date(tx.date.seconds * 1000);
            return txDate >= start && txDate <= end;
        });
    };

    const handleExportPDF = async () => {
        if (!user) return;
        setExportingPdf(true);
        try {
            const [transactions, accounts] = await Promise.all([
                getFilteredTransactions(),
                getAccounts(user.uid)
            ]);

            const range = (startDate || endDate) ? {
                start: startDate ? new Date(startDate) : null,
                end: endDate ? new Date(endDate) : null
            } : undefined;

            exportTransactionsToPDF(transactions, accounts, range);
        } catch (error) {
            console.error(error);
            alert("Failed to export PDF.");
        } finally {
            setExportingPdf(false);
        }
    };

    const handleExport = async () => {
        if (!user) return;
        setExporting(true);
        try {
            const transactions = await getFilteredTransactions();
            exportTransactionsToCSV(transactions);
        } catch (error) {
            console.error(error);
            alert("Failed to export data.");
        } finally {
            setExporting(false);
        }
    };

    const handleClearData = async () => {
        if (!user) return;
        if (!confirm("Are you sure? This will permanently delete ALL your transactions, budgets, accounts, and categories. This action cannot be undone.")) return;

        setClearing(true);
        try {
            await clearAllUserData(user.uid);
            alert("All data has been cleared.");
            window.location.reload(); // Reload to reflect empty state
        } catch (error) {
            console.error(error);
            alert("Failed to clear data.");
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="bg-[#161920] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
                <Database className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-bold text-white">Data Management</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-[#0B0D12] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-[#0B0D12] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                    />
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center justify-center gap-3 px-4 py-4 bg-[#232936] hover:bg-[#2A3040] border border-white/5 rounded-xl transition-all group disabled:opacity-50"
                >
                    <Download className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                    <span className="text-sm font-medium text-white">
                        {exporting ? "Exporting CSV..." : "Export as CSV"}
                    </span>
                </button>

                <button
                    onClick={handleExportPDF}
                    disabled={exportingPdf}
                    className="flex items-center justify-center gap-3 px-4 py-4 bg-[#232936] hover:bg-[#2A3040] border border-white/5 rounded-xl transition-all group disabled:opacity-50"
                >
                    <FileText className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
                    <span className="text-sm font-medium text-white">
                        {exportingPdf ? "Exporting PDF..." : "Export as PDF"}
                    </span>
                </button>

                <button
                    onClick={handleClearData}
                    disabled={clearing}
                    className="flex items-center justify-center gap-3 px-4 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 rounded-xl transition-all group disabled:opacity-50"
                >
                    <Trash2 className="h-5 w-5 text-red-500 group-hover:text-red-400" />
                    <span className="text-sm font-medium text-red-500 group-hover:text-red-400">
                        {clearing ? "Clearing..." : "Clear All Data"}
                    </span>
                </button>
            </div>
        </div>
    );
}
