"use client";

import { Shield, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";

export default function SecurityCard() {
    const { user } = useAuth();
    const [resetSent, setResetSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            setResetSent(true);
            alert("Password reset email sent to " + user.email);
        } catch (error: any) {
            console.error(error);
            alert("Error sending reset email: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#161920] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-6">
                <Shield className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-bold text-white">Security Settings</h3>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                    <div>
                        <p className="text-white font-medium">Password</p>
                        <p className="text-gray-500 text-sm mt-1">
                            {resetSent ? "Reset link sent to your email." : "Secure your account with a strong password."}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-500 tracking-widest text-sm hidden sm:block">••••••••••••</span>
                        <button
                            onClick={handlePasswordReset}
                            disabled={loading}
                            className="px-4 py-2 border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Change"}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white font-medium">Two-Factor Authentication</p>
                        <p className="text-gray-500 text-sm mt-1">Add an extra layer of security (Coming Soon)</p>
                    </div>
                    {/* Toggle Switch UI - Disabled for now */}
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-700 cursor-not-allowed opacity-50">
                        <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out" />
                    </div>
                </div>
            </div>
        </div>
    );
}
