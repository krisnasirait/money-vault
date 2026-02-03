"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserSettings, updateUserSettings } from "@/lib/settings";
import { getCustomCategories, addCategory, deleteCategory } from "@/lib/categories";
import { UserSettings, Category } from "@/types";
import { Plus, Trash2, Save, Check, Calendar, Tag } from "lucide-react";

export default function FinancialSettingsCard() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings>({ cycleStartDay: 1 });
    const [customCategories, setCustomCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [s, c] = await Promise.all([
                getUserSettings(user.uid),
                getCustomCategories(user.uid)
            ]);
            setSettings(s);
            setCustomCategories(c);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!user) return;
        setSavingSettings(true);
        await updateUserSettings(user.uid, settings);
        setSavingSettings(false);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newCategoryName.trim()) return;

        try {
            await addCategory(user.uid, {
                name: newCategoryName,
                type: 'expense', // Default to expense for now
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                icon: 'Tag'
            });
            setNewCategoryName("");

            // Refresh categories
            const c = await getCustomCategories(user.uid);
            setCustomCategories(c);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!user) return;
        if (!confirm("Delete this category?")) return;
        await deleteCategory(id);
        const c = await getCustomCategories(user.uid);
        setCustomCategories(c);
    };

    return (
        <div className="bg-[#161920] rounded-2xl p-6 border border-white/5 space-y-8">
            <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-bold text-white">Financial Settings</h3>
            </div>

            {/* Cycle Settings */}
            <div className="pb-8 border-b border-white/5">
                <label className="block text-sm font-medium text-white mb-2">
                    Cycle Start Day
                </label>
                <p className="text-xs text-gray-500 mb-4">
                    The day your financial month begins (e.g. Salary day).
                </p>
                <div className="flex gap-4 max-w-sm">
                    <select
                        value={settings.cycleStartDay}
                        onChange={(e) => setSettings({ ...settings, cycleStartDay: parseInt(e.target.value) })}
                        className="bg-[#0B0D12] border border-white/5 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary flex-1"
                    >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {settingsSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                        {settingsSaved ? "Saved" : "Save"}
                    </button>
                </div>
            </div>

            {/* Custom Categories */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <h4 className="text-md font-bold text-white">Custom Categories</h4>
                </div>

                <form onSubmit={handleAddCategory} className="flex gap-3 mb-4">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Subscriptions, Gym..."
                        className="flex-1 bg-[#0B0D12] border border-white/5 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary placeholder-gray-600"
                    />
                    <button
                        type="submit"
                        disabled={!newCategoryName.trim()}
                        className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {customCategories.length === 0 && (
                        <p className="text-gray-500 text-xs italic">No custom categories added.</p>
                    )}
                    {customCategories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between bg-[#0B0D12] p-2.5 rounded-lg border border-white/5 group">
                            <span className="text-gray-300 text-sm">{cat.name}</span>
                            <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-white/5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
