import React from 'react';
import { Plus, SlidersHorizontal, RefreshCw, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onNewApplication: () => void;
  onOpenPreferences: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  followUpAlertCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onNewApplication,
  onOpenPreferences,
  onRefresh,
  isRefreshing,
  followUpAlertCount = 0,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4.5 flex items-center justify-between sticky top-0 z-20">
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
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center space-x-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
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
