"use client";

import { Account } from "@/types";
import { CreditCard, MoreHorizontal } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AccountCardProps {
    account: Account;
    onEdit: (account: Account) => void;
}

export default function AccountCard({ account, onEdit }: AccountCardProps) {
    return (
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${account.bgGradient || 'from-gray-800 to-gray-700'} p-6 transition-transform hover:scale-[1.02]`}>
            <div className="relative z-10 flex flex-col justify-between h-[140px]">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-white/80">{account.type}</p>
                        <h3 className="text-lg font-bold text-white mt-1">{account.name}</h3>
                    </div>
                    <button
                        onClick={() => onEdit(account)}
                        className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
                    >
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                </div>

                <div>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {formatCurrency(account.balance)}
                    </p>
                    <div className="mt-2 text-xs text-white/60 flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        <span>**** ****</span>
                    </div>
                </div>
            </div>

            {/* Decorative Circles */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
        </div>
    );
}
