import React from 'react';
import { Plus, SlidersHorizontal, RefreshCw, Bell, Download, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onNewApplication: () => void;
  onOpenPreferences: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onSyncRealOffers: () => void;
  isSyncing: boolean;
  onExportCsv: () => void;
  followUpAlertCount?: number;
  lastSyncTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onNewApplication,
  onOpenPreferences,
  onRefresh,
  isRefreshing,
  onSyncRealOffers,
  isSyncing,
  onExportCsv,
  followUpAlertCount = 0,
  lastSyncTime,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          {title}
          {followUpAlertCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Bell className="w-3 h-3 text-amber-600" />
              {followUpAlertCount} relance{followUpAlertCount > 1 ? 's' : ''} à faire
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-slate-500">{subtitle}</p>
          {lastSyncTime && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Synchro : {lastSyncTime}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2.5">
        {/* Sync Real Offers Button */}
        <button
          onClick={onSyncRealOffers}
          disabled={isSyncing}
          className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          title="Synchroniser et vérifier les offres réelles du marché en direct"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
          <span>{isSyncing ? 'Synchronisation réelle...' : 'Synchroniser Offres Réelles'}</span>
        </button>

        {/* Export CSV Button */}
        <button
          onClick={onExportCsv}
          className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
          title="Exporter le pipeline en CSV (format open source)"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>CSV</span>
        </button>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}

        <button
          onClick={onOpenPreferences}
          className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span>Préférences KNN</span>
        </button>

        <button
          onClick={onNewApplication}
          className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter Candidature</span>
        </button>
      </div>
    </header>
  );
};
