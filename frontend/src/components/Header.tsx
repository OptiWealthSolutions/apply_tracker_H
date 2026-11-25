import React from 'react';

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
  { id: 'digest', label: 'Digest' },
  { id: 'offers', label: 'Offres' },
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'tracker', label: 'Tracker' },
  { id: 'prep', label: 'Prep & CV' },
  { id: 'profile', label: 'Profil & IA' },
];

// En-tête et onglets : charte Horacle UI (public/horacle/horacle.css, copie de Horacle Orchestrator/design/horacle-ui).
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
    <header className="sticky top-0 z-20 bg-white">
      <div className="ho-header">
        <div className="min-w-0">
          <h1>Apply Tracker</h1>
          <p>
            AlphaTracker · EDHEC M1 · début cible {targetStartPeriod} · Qwen3 + Ridge
            {lastSyncTime ? ` · synchro ${lastSyncTime}` : ''}
          </p>
        </div>
        <div className="ho-header-right">
          <button onClick={onOpenCVModal} className="ho-btn ghost sm" title="Mon CV hébergé">CV</button>
          <button onClick={onNewApplication} className="ho-btn ghost sm" title="Ajouter une candidature manuelle">Ajouter</button>
          <button
            onClick={onSyncRealOffers}
            disabled={isSyncing}
            className="ho-btn sm"
            title="Synchroniser les offres actives (ATS directs + marché)"
          >
            {isSyncing ? 'Synchro…' : 'Synchroniser'}
          </button>
        </div>
      </div>
      <nav className="ho-tabs">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`ho-tab ${currentTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
            {tab.id === 'tracker' && <span className="ml-1.5 text-[11px] tabular-nums text-[#a1a1a6]">{applicationsCount}</span>}
            {tab.id === 'tracker' && followUpAlertCount > 0 && (
              <span className="ho-badge warn ml-1.5" title="relances dues">{followUpAlertCount} relance{followUpAlertCount > 1 ? 's' : ''}</span>
            )}
          </button>
        ))}
      </nav>
    </header>
  );
};
