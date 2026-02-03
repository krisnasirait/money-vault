"use client";

import { useState, useEffect } from "react";
import { Account, DEFAULT_CATEGORIES, TransactionType, Category, Transaction } from "@/types";
import {
    X,
    ShoppingBag,
    Utensils,
    Car,
    Home,
    Film,
    Heart,
    MoreHorizontal,
    Calendar,
    CreditCard,
    Tag // generic fallback
} from "lucide-react";

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    onDelete?: (id: string, accountId: string, amount: number, type: string) => Promise<void>;
    accounts: Account[];
    initialData?: Transaction | null;
    categories?: { name: string; type: string; icon?: string; color?: string }[]; // Flexible type
}

// Icon mapping for grid
const ICONS: Record<string, any> = {
    'Groceries': ShoppingBag,
    'Food': Utensils,
    'Transport': Car,
    'Rent': Home,
    'Entertainment': Film,
    'Health': Heart,
    'More': MoreHorizontal,
    'Housing': Home,
    'Utilities': Home,
    'Shopping': ShoppingBag,
    'Salary': CreditCard,
    'Freelance': CreditCard,
    'Dining & Drinks': Utensils,
    'Tag': Tag
};

export default function TransactionModal({ isOpen, onClose, onSubmit, onDelete, accounts, initialData, categories = DEFAULT_CATEGORIES }: TransactionModalProps) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState(""); // Title/Payee
    const [notes, setNotes] = useState("");
    const [type, setType] = useState<TransactionType>("expense");
    const [accountId, setAccountId] = useState("");
    const [category, setCategory] = useState(DEFAULT_CATEGORIES[3].name); // Default to Food
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                setAmount(initialData.amount.toString());
                setDescription(initialData.description);
                setNotes(initialData.notes || "");
                setType(initialData.type);
                setAccountId(initialData.accountId);
                setCategory(initialData.categoryName || DEFAULT_CATEGORIES[0].name);
                // Handle date conversion if it's firestore timestamp
                const dateVal = initialData.date?.seconds
                    ? new Date(initialData.date.seconds * 1000).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0];
                setDate(dateVal);
            } else {
                // Add Mode - Reset
                setAmount("");
                setDescription("");
                setNotes("");
                setType("expense");
                if (accounts.length > 0) setAccountId(accounts[0].id);
                setCategory(DEFAULT_CATEGORIES[3].name); // Fallback, but might check categories[0]
                setDate(new Date().toISOString().split('T')[0]);
            }
        }
    }, [isOpen, initialData, accounts]);

    // Set default account if not already set and in add mode
    useEffect(() => {
        if (accounts.length > 0 && !accountId && !initialData) {
            setAccountId(accounts[0].id);
        }
    }, [accounts, accountId, initialData]);

    // Update categories based on type
    const availableCategories = (categories || DEFAULT_CATEGORIES).filter(c =>
        type === 'income' ? c.type === 'income' : c.type === 'expense'
    );

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                amount: parseFloat(amount),
                description,
                notes,
                type,
                accountId,
                categoryName: category,
                date: date,
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
        if (!confirm("Are you sure you want to delete this transaction?")) return;

        setLoading(true);
        try {
            await onDelete(initialData.id, initialData.accountId, initialData.amount, initialData.type);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-[#161920] shadow-2xl border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <h2 className="text-xl font-bold text-white">
                        {initialData ? "Edit Transaction" : "Add Transaction"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 space-y-6">
                        {/* Type Switcher */}
                        <div className="grid grid-cols-3 bg-[#0B0D12] p-1 rounded-lg border border-white/5">
                            {(['expense', 'income', 'transfer'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`py-2 text-sm font-medium rounded-md transition-all ${type === t
                                        ? 'bg-[#1E2330] text-white shadow-sm border border-white/5'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Amount Input */}
                        <div className="text-center py-4">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Amount</label>
                            <div className="flex items-center justify-center gap-2 text-white">
                                <span className="text-3xl font-medium text-gray-400 mb-2">Rp</span>
                                <input
                                    type="number"
                                    step="1000"
                                    autoFocus
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-transparent text-5xl font-bold text-center w-full focus:outline-none placeholder-gray-700"
                                />
                            </div>
                        </div>

                        {/* Payee / Description Input */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Payee / Title</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Starbucks, Salary, Rent"
                                className="w-full bg-[#0B0D12] border border-white/5 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                                required
                            />
                        </div>

                        {/* Category Grid */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Category</label>
                            <div className="grid grid-cols-4 gap-3">
                                {availableCategories.slice(0, 16).map((cat) => {
                                    const Icon = ICONS[cat.name] || Tag;
                                    const isSelected = category === cat.name;
                                    return (
                                        <button
                                            key={cat.name}
                                            type="button"
                                            onClick={() => setCategory(cat.name)}
                                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${isSelected
                                                ? 'bg-primary/20 border-primary text-primary'
                                                : 'bg-[#0B0D12] border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                                            <span className="text-[10px] font-medium truncate w-full text-center">{cat.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date & Account Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-[#0B0D12] border border-white/5 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Account</label>
                                <div className="relative">
                                    <select
                                        value={accountId}
                                        onChange={(e) => setAccountId(e.target.value)}
                                        className="w-full bg-[#0B0D12] border border-white/5 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add extra details..."
                                className="w-full bg-[#0B0D12] border border-white/5 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors resize-none h-20"
                            />
                        </div>
                    </div>

                    {/* Footer / Submit */}
                    <div className="p-6 pt-4 flex gap-3">
                        {initialData && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                Delete
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading || !amount}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Saving..." : (initialData ? "Update Transaction" : "Save Transaction")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

