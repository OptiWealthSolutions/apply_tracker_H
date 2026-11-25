import React from 'react';
import { RefreshCw, Plus, FileText } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  applicationsCount: number;
  followUpAlertCount: number;
  onSyncRealOffers: () => void;
  isSyncing: boolean;
  onNewApplication: () => void;
  onOpenCVModal: () => void;
  lastSyncTime?: string;
  targetStartPeriod?: string;
}

const NAV_TABS = [
  { id: 'digest', label: 'DIGEST' },
  { id: 'offers', label: 'OFFRES' },
  { id: 'suggestions', label: 'SUGGESTIONS' },
  { id: 'tracker', label: 'TRACKER' },
  { id: 'prep', label: 'PREP & CV' },
  { id: 'profile', label: 'PROFIL & IA' },
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  applicationsCount,
  followUpAlertCount,
  onSyncRealOffers,
  isSyncing,
  onNewApplication,
  onOpenCVModal,
  lastSyncTime,
  targetStartPeriod = 'Juin 2027',
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#e5e5e5]">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-5 pb-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left Brand (matches Macro Survey localhost:3001) */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#111818] leading-tight">
              AlphaTracker
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 border border-[#e5e5e5] bg-[#fafafa] text-[#111818]">
              EDHEC M1
            </span>
          </div>
          <p className="text-[11px] text-[#6b7280] tracking-[0.02em] mt-0.5">
            Léo Lombardini · Début cible : {targetStartPeriod} · Qwen3 + Ridge
            {lastSyncTime ? ` · Synchro ${lastSyncTime}` : ''}
          </p>
        </div>

        {/* Center/Right Navigation Tabs */}
        <nav className="flex items-center gap-6 md:gap-7 overflow-x-auto">
          {NAV_TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`pb-2 text-[13px] font-medium tracking-[0.03em] transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-black border-black font-semibold'
                    : 'text-[#6b7280] border-transparent hover:text-[#111818]'
                }`}
              >
                {tab.label}
                {tab.id === 'tracker' && (
                  <span className="ml-1.5 text-[10px] font-bold tabular-nums text-[#6b7280]">
                    [{applicationsCount}]
                  </span>
                )}
                {tab.id === 'tracker' && followUpAlertCount > 0 && (
                  <span className="ml-1 text-[9px] font-bold px-1 py-0.2 bg-[#fef3c7] text-[#b45309] border border-[#f59e0b]/40 tabular-nums">
                    {followUpAlertCount}!
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Compact Square Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCVModal}
            className="sq-btn h-[29px]"
            title="Mon CV hébergé"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CV</span>
          </button>

          <button
            onClick={onSyncRealOffers}
            disabled={isSyncing}
            className="sq-btn sq-btn-primary h-[29px]"
            title="Synchroniser les offres actives (ATS Directs + Marché)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'SYNC...' : 'SYNC'}</span>
          </button>

          <button
            onClick={onNewApplication}
            className="sq-btn h-[29px] text-[#111818]"
            title="Ajouter une candidature manuelle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>AJOUTER</span>
          </button>
        </div>
      </div>
    </header>
  );
};
