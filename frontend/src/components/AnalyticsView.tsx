import React from 'react';
import {
  TrendingUp,
  Award,
  AlertCircle,
  Building,
  Briefcase,
  PieChart,
} from 'lucide-react';
import type { AnalyticsData } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsData | null;
  isLoading: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <div className="text-xs text-slate-500">Chargement des métriques du pipeline...</div>
      </div>
    );
  }

  const {
    total_applications,
    status_breakdown,
    desks_distribution,
    companies_distribution,
    interview_conversion_rate,
    offer_rate,
    action_required_count,
    active_interviews_count,
  } = analytics;

  const totalDeskCount = Object.values(desks_distribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Candidatures Actives</span>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-slate-900">
            {total_applications}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Enregistrées dans la base locale
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Taux d'Entretien</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-emerald-600">
            {interview_conversion_rate}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {active_interviews_count} processus en cours
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Offres Obtenues</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-slate-900">
            {status_breakdown.offer_received || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Taux d'admission : {offer_rate}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Relances Requises</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-rose-600">
            {action_required_count}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            À relancer (délai dépassé)
          </div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Entonnoir de Conversion du Pipeline</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div className="text-[10px] font-semibold text-slate-500 uppercase">À Postuler</div>
            <div className="text-lg font-bold font-mono-numbers text-slate-800 mt-1">
              {status_breakdown.saved || 0}
            </div>
          </div>
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-center">
            <div className="text-[10px] font-semibold text-blue-700 uppercase">Postulé</div>
            <div className="text-lg font-bold font-mono-numbers text-blue-800 mt-1">
              {status_breakdown.applied || 0}
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
            <div className="text-[10px] font-semibold text-amber-800 uppercase">À Relancer</div>
            <div className="text-lg font-bold font-mono-numbers text-amber-900 mt-1">
              {status_breakdown.follow_up_needed || 0}
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
            <div className="text-[10px] font-semibold text-purple-700 uppercase">Entretiens</div>
            <div className="text-lg font-bold font-mono-numbers text-purple-800 mt-1">
              {status_breakdown.interviewing || 0}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <div className="text-[10px] font-semibold text-emerald-700 uppercase">Offre / Accepté</div>
            <div className="text-lg font-bold font-mono-numbers text-emerald-800 mt-1">
              {status_breakdown.offer_received || 0}
            </div>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
            <div className="text-[10px] font-semibold text-rose-700 uppercase">Refusé</div>
            <div className="text-lg font-bold font-mono-numbers text-rose-800 mt-1">
              {status_breakdown.rejected || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Desks Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              Répartition par Desk / Spécialisation
            </h3>
          </div>
          <div className="space-y-3">
            {Object.entries(desks_distribution).map(([deskName, count]) => {
              const pct = Math.round((count / totalDeskCount) * 100);
              return (
                <div key={deskName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate">{deskName}</span>
                    <span className="font-mono-numbers text-slate-500 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Companies Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Établissements & Banques Ciblées
            </h3>
          </div>
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
            {Object.entries(companies_distribution).map(([bank, count]) => (
              <div
                key={bank}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
              >
                <span className="font-semibold text-slate-800">{bank}</span>
                <span className="font-mono font-medium px-2 py-0.5 rounded-full bg-white text-blue-700 border border-slate-200">
                  {count} candidature{count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
