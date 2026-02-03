"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { Edit2, Check, X } from "lucide-react";

export default function ProfileCard() {
    const { user } = useAuth();

    // Derive name from email if display name is not set
    const derivedName = user?.displayName || user?.email?.split('@')[0] || "User";

    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(derivedName);
    const [loading, setLoading] = useState(false);

    // Reset local state when user changes (e.g. initial load)
    // We can use a key on the component or useEffect, but here just checking if we match
    if (!isEditing && newName !== derivedName && newName === "") {
        setNewName(derivedName);
    }

    // Fallback for metadata
    const creationTime = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : "Oct 2021";

    const lastSignIn = user?.metadata?.lastSignInTime
        ? new Date(user.metadata.lastSignInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "Today, 9:41 AM";

    const handleSaveName = async () => {
        if (!user || !newName.trim()) return;
        setLoading(true);
        try {
            await updateProfile(user, {
                displayName: newName
            });
            setIsEditing(false);
            // Force re-render or toast? Context should update automatically if listening to auth state changes,
            // but sometimes it's sticky. For now, local state update or just trust auth listener.
        } catch (error) {
            console.error(error);
            alert("Failed to update name.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#161920] rounded-2xl p-8 border border-white/5 flex flex-col items-center h-full">
            <div className="relative mb-6">
                <div className="h-32 w-32 rounded-full bg-[#FFE4BC] overflow-hidden ring-4 ring-[#161920]">
                    {/* Placeholder Avatar based on design */}
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Alex'}`}
                        alt="Profile"
                        className="h-full w-full object-cover"
                    />
                </div>
                {/* Could add photo upload here later */}
                <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-lg border-4 border-[#161920]">
                    <Edit2 className="h-4 w-4" />
                </button>
            </div>

            {isEditing ? (
                <div className="flex items-center gap-2 mb-1 w-full max-w-[200px]">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-[#0B0D12] border border-white/10 rounded px-2 py-1 text-white text-center text-lg font-bold focus:outline-none focus:border-primary"
                        autoFocus
                    />
                    <button onClick={handleSaveName} disabled={loading} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                        <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setIsEditing(false); setNewName(user?.displayName || ""); }} className="p-1 text-gray-500 hover:bg-gray-500/10 rounded">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 mb-1 group">
                    <h2 className="text-xl font-bold text-white capitalize">{derivedName}</h2>
                    <button
                        onClick={() => { setIsEditing(true); setNewName(derivedName); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-all"
                    >
                        <Edit2 className="h-3 w-3" />
                    </button>
                </div>
            )}

            <p className="text-gray-400 text-sm mb-6">{user?.email}</p>

            <div className="px-4 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider mb-8 border border-blue-500/20">
                Pro Member
            </div>

            <div className="w-full space-y-4 border-t border-white/5 pt-6 mt-auto">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Member Since</span>
                    <span className="text-gray-300 font-medium">{creationTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Login</span>
                    <span className="text-gray-300 font-medium">{lastSignIn}</span>
                </div>
            </div>
        </div>
    );
}
