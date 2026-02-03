"use client";

import { useState } from "react";
import { ACCOUNT_TYPES, Account, AccountType } from "@/types";
import { X } from "lucide-react";

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; type: AccountType; balance: number; bgGradient: string }) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    initialData?: Account;
}

const GRADIENTS = [
    "from-blue-600 to-blue-400",
    "from-purple-600 to-purple-400",
    "from-green-600 to-green-400",
    "from-orange-600 to-orange-400",
    "from-red-600 to-red-400",
    "from-pink-600 to-pink-400",
    "from-gray-800 to-gray-600",
];

export default function AccountModal({ isOpen, onClose, onSubmit, onDelete, initialData }: AccountModalProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [type, setType] = useState<AccountType>(initialData?.type || "Checking");
    const [balance, setBalance] = useState(initialData?.balance?.toString() || "");
    const [bgGradient, setBgGradient] = useState(initialData?.bgGradient || GRADIENTS[0]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                name,
                type,
                balance: parseFloat(balance) || 0,
                bgGradient,
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
        if (!confirm("Are you sure you want to delete this account? WARNING: Associated transactions will effectively be orphaned.")) return;

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

    const isSubmitting = loading;


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border bg-[#161920] p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">
                        {initialData ? "Edit Account" : "Add Account"}
                    </h2>
                    <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-300">Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-border bg-[#0B0D12] px-3 py-2 text-white placeholder-gray-600 focus:border-primary focus:outline-none"
                            placeholder="e.g. Chase Checking"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-300">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as AccountType)}
                            className="w-full rounded-lg border border-border bg-[#0B0D12] px-3 py-2 text-white focus:border-primary focus:outline-none"
                        >
                            {ACCOUNT_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-300">Current Balance</label>
                        <input
                            type="number"
                            step="1000"
                            required
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            className="w-full rounded-lg border border-border bg-[#0B0D12] px-3 py-2 text-white placeholder-gray-600 focus:border-primary focus:outline-none"
                            placeholder="Rp 0"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-300">Card Color</label>
                        <div className="flex flex-wrap gap-2">
                            {GRADIENTS.map((gradient) => (
                                <button
                                    key={gradient}
                                    type="button"
                                    onClick={() => setBgGradient(gradient)}
                                    className={`h-8 w-8 rounded-full bg-gradient-to-br ${gradient} ${bgGradient === gradient ? "ring-2 ring-white" : "opacity-70 hover:opacity-100"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        {initialData && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 font-medium transition-colors"
                            >
                                Delete
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 rounded-lg bg-primary py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Save Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
