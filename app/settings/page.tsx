"use client";



"use client";

import ProfileCard from "./components/ProfileCard";
import SecurityCard from "./components/SecurityCard";
import PreferencesCard from "./components/PreferencesCard";
import FinancialSettingsCard from "./components/FinancialSettingsCard";
import DataManagementCard from "./components/DataManagementCard";

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-[#0B0D12] text-foreground p-6 sm:p-8 font-sans">
            <div className="mx-auto max-w-6xl">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Profile & Settings</h1>
                    <p className="text-gray-400 mt-1">Manage your personal information and application preferences.</p>
                </header>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile */}
                    <div className="lg:col-span-1">
                        <ProfileCard />
                    </div>

                    {/* Right Column: Settings */}
                    <div className="lg:col-span-2 space-y-8">
                        <SecurityCard />
                        <PreferencesCard />
                        <FinancialSettingsCard />
                        <DataManagementCard />
                    </div>
                </div>
            </div>
        </div>
    );
}
