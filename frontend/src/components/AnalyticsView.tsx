import React from 'react';
import type { AnalyticsData } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsData | null;
  offersCount?: number;
  atsHealth?: { total_boards: number; quarantined_boards: string[] } | null;
  isLoading: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  saved: 'À postuler',
  applied: 'Postulé',
  follow_up_needed: 'Relance requise',
  interviewing: 'Entretien',
  offer_received: 'Offre reçue',
  rejected: 'Refusé',
  withdrawn: 'Retiré',
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  offersCount = 0,
  atsHealth = null,
  isLoading,
}) => {
  if (isLoading || !analytics) {
    return (
      <div className="sq-card p-10 text-center text-[12px] text-[#6b7280]">
        Chargement des métriques du pipeline...
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
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sq-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
            CANDIDATURES TOTALES
          </div>
          <div className="text-[24px] font-bold tabular-nums text-[#111818] mt-1">
            {total_applications}
          </div>
        </div>
        <div className="sq-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
            TAUX CONVERSION ENTRETIEN
          </div>
          <div className="text-[24px] font-bold tabular-nums text-[#16a34a] mt-1">
            {interview_conversion_rate}
          </div>
          <div className="text-[11px] text-[#6b7280] mt-0.5 tabular-nums">
            {active_interviews_count} en cours · Offres: {offer_rate}
          </div>
        </div>
        <div className="sq-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
            RELANCES REQUISES
          </div>
          <div className="text-[24px] font-bold tabular-nums text-[#b45309] mt-1">
            {action_required_count}
          </div>
        </div>
        <div className="sq-card p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
            OFFRES ACTIVES / ATS
          </div>
          <div className="text-[24px] font-bold tabular-nums text-[#111818] mt-1">
            {offersCount}
          </div>
          <div className="text-[11px] text-[#6b7280] mt-0.5 tabular-nums">
            {atsHealth ? `${atsHealth.total_boards} boards ATS · ${atsHealth.quarantined_boards.length} quarantaine` : `${Object.keys(companies_distribution).length} firmes suivies`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="sq-card p-5 space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
            RÉPARTITION PAR STATUT
          </div>
          <div className="space-y-2">
            {Object.entries(status_breakdown).map(([st, cnt]) => (
              <div key={st} className="flex items-center justify-between text-[12px] border-b border-[#e5e5e5] pb-1.5">
                <span className="uppercase text-[10px] font-bold tracking-wider text-[#111818]">
                  {STATUS_LABELS[st] || st}
                </span>
                <span className="font-bold tabular-nums">{cnt}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sq-card p-5 space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
            RÉPARTITION PAR DESK
          </div>
          {Object.keys(desks_distribution).length === 0 ? (
            <div className="text-[12px] text-[#6b7280]">Aucune donnée desk.</div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(desks_distribution).map(([desk, count]) => {
                const pct = Math.round((count / totalDeskCount) * 100);
                return (
                  <div key={desk} className="space-y-1">
                    <div className="flex justify-between text-[11px] tabular-nums">
                      <span className="font-semibold text-[#111818]">{desk}</span>
                      <span className="text-[#6b7280]">{count} ({pct}%)</span>
                    </div>
                    <div className="h-[6px] w-full bg-[#e5e5e5]">
                      <div className="h-full bg-black" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
