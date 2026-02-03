"use client";

import { Sliders, Save, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserSettings, updateUserSettings } from "@/lib/settings";
import { UserSettings } from "@/types";

export default function PreferencesCard() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings>({
        cycleStartDay: 1,
        currency: 'USD ($)',
        language: 'English (US)',
        theme: 'dark'
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (user) loadSettings();
    }, [user]);

    const loadSettings = async () => {
        if (!user) return;
        try {
            const s = await getUserSettings(user.uid);
            setSettings(s);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdate = async (key: keyof UserSettings, value: any) => {
        if (!user) return;
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        // Debounce or instant save? Let's do instant for dropdowns
        setSaving(true);
        try {
            await updateUserSettings(user.uid, { [key]: value });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-[#161920] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Sliders className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-bold text-white">App Preferences</h3>
                </div>
                {saved && (
                    <span className="text-xs text-green-500 font-medium flex items-center gap-1 fade-in">
                        <Check className="h-3 w-3" /> Saved
                    </span>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Currency</label>
                    <select
                        value={settings.currency || 'USD ($)'}
                        onChange={(e) => handleUpdate('currency', e.target.value)}
                        className="w-full bg-[#0B0D12] border border-white/5 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary appearance-none"
                    >
                        <option value="USD ($)">USD ($)</option>
                        <option value="EUR (€)">EUR (€)</option>
                        <option value="IDR (Rp)">IDR (Rp)</option>
                        <option value="GBP (£)">GBP (£)</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Language</label>
                    <select
                        value={settings.language || 'English (US)'}
                        onChange={(e) => handleUpdate('language', e.target.value)}
                        className="w-full bg-[#0B0D12] border border-white/5 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary appearance-none"
                    >
                        <option value="English (US)">English (US)</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="Indonesian">Indonesian</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between pb-2">
                <div>
                    <p className="text-white font-medium">Appearance</p>
                    <p className="text-gray-500 text-sm mt-1">Customize the interface theme</p>
                </div>
                <div className="flex bg-[#0B0D12] rounded-lg p-1 border border-white/5">
                    <button
                        onClick={() => handleUpdate('theme', 'dark')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${settings.theme !== 'light' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <span className={`h-2 w-2 rounded-full ${settings.theme !== 'light' ? 'bg-white' : 'bg-gray-600'}`}></span>
                        Dark
                    </button>
                    <button
                        onClick={() => handleUpdate('theme', 'light')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${settings.theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Light
                    </button>
                </div>
            </div>
        </div>
    );
}
