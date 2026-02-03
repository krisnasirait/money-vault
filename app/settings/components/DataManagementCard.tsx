"use client";

import { Database, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions } from "@/lib/transactions";
import { exportTransactionsToCSV, clearAllUserData } from "@/lib/dataManagement";

export default function DataManagementCard() {
    const { user } = useAuth();
    const [clearing, setClearing] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (!user) return;
        setExporting(true);
        try {
            const transactions = await getTransactions(user.uid);
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

            <div className="grid sm:grid-cols-2 gap-4">
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center justify-center gap-3 px-4 py-4 bg-[#232936] hover:bg-[#2A3040] border border-white/5 rounded-xl transition-all group disabled:opacity-50"
                >
                    <Download className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                    <span className="text-sm font-medium text-white">
                        {exporting ? "Exporting..." : "Export as CSV"}
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
