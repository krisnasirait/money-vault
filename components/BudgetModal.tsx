"use client";

import { useState, useEffect } from "react";
import { DEFAULT_CATEGORIES, Budget } from "@/types";
import { X } from "lucide-react";

interface BudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { categoryName: string; amount: number }) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialData?: Budget;
    availableCategories?: string[]; // Correct Prop
}

export default function BudgetModal({ isOpen, onClose, onSubmit, onDelete, initialData, availableCategories }: BudgetModalProps) {
    // If availableCategories provided, use 0th index, else default Food
    const defaultCat = availableCategories && availableCategories.length > 0 ? availableCategories[0] : DEFAULT_CATEGORIES[3].name;
    const [categoryName, setCategoryName] = useState(initialData?.categoryName || defaultCat);
    const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCategoryName(initialData?.categoryName || defaultCat);
            setAmount(initialData?.amount?.toString() || "");
        }
    }, [isOpen, initialData, defaultCat]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                categoryName,
                amount: parseFloat(amount) || 0,
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData || !onDelete) return;
        if (!confirm("Delete this budget?")) return;
        setLoading(true);
        try {
            await onDelete(initialData.id);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Use passed categories or fallback
    const categoriesToDisplay = availableCategories || DEFAULT_CATEGORIES.filter(c => c.type === 'expense').map(c => c.name);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-[#161920] shadow-2xl border border-white/10 overflow-hidden">
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className="text-xl font-bold text-white">
                        {initialData ? "Edit Budget" : "New Budget"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
                        <select
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="w-full bg-[#0B0D12] border border-white/5 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                            disabled={!!initialData} // Maybe lock category on edit? commonly done.
                        >
                            {categoriesToDisplay.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Monthly Limit</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                            <input
                                type="number"
                                step="1000"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-[#0B0D12] border border-white/5 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-600"
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        {initialData && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 font-bold transition-all disabled:opacity-50"
                            >
                                Delete
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Budget"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
