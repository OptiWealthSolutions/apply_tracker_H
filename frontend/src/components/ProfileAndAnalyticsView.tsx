import React, { useState } from 'react';
import { Sliders, BarChart3, Cpu, RefreshCw } from 'lucide-react';
import type { AnalyticsData, UserProfile } from '../types';
import { PreferencesView } from './PreferencesView';
import { AnalyticsView } from './AnalyticsView';

interface ProfileAndAnalyticsViewProps {
  profile: UserProfile | null;
  analytics: AnalyticsData | null;
  offersCount?: number;
  atsHealth?: { total_boards: number; quarantined_boards: string[] } | null;
  isAnalyticsLoading: boolean;
  onProfileUpdated: (updated: UserProfile) => void;
  onRecalibrate: () => Promise<void>;
  isRecalibrating: boolean;
}

export const ProfileAndAnalyticsView: React.FC<ProfileAndAnalyticsViewProps> = ({
  profile,
  analytics,
  offersCount = 0,
  atsHealth = null,
  isAnalyticsLoading,
  onProfileUpdated,
  onRecalibrate,
  isRecalibrating,
}) => {
  const [subTab, setSubTab] = useState<'prefs' | 'analytics'>('prefs');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-b border-[#e5e5e5] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('prefs')}
            className={`sq-btn ${subTab === 'prefs' ? 'sq-btn-primary' : ''}`}
          >
            <Sliders className="w-3.5 h-3.5" />
            PROFIL & CIBLES MÉTIERS
          </button>
          <button
            onClick={() => setSubTab('analytics')}
            className={`sq-btn ${subTab === 'analytics' ? 'sq-btn-primary' : ''}`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            ANALYTICS PIPELINE
          </button>
        </div>

        <button
          onClick={onRecalibrate}
          disabled={isRecalibrating}
          className="sq-btn sq-btn-primary"
        >
          <Cpu className="w-3.5 h-3.5" />
          <RefreshCw className={`w-3 h-3 ${isRecalibrating ? 'animate-spin' : ''}`} />
          <span>{isRecalibrating ? 'RECALIBRAGE...' : 'RECALIBRER QWEN3 + RIDGE'}</span>
        </button>
      </div>

      <div className="bw-mono-override">
        {subTab === 'prefs' ? (
          <PreferencesView initialProfile={profile} onProfileUpdated={onProfileUpdated} />
        ) : (
          <AnalyticsView
            analytics={analytics}
            offersCount={offersCount}
            atsHealth={atsHealth}
            isLoading={isAnalyticsLoading}
          />
        )}
      </div>
    </div>
  );
};
