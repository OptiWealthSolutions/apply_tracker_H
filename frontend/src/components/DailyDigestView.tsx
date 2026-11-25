import React, { useState, useEffect, useCallback } from 'react';
import {
  ExternalLink,
  Send,
  Bookmark,
  X,
  Undo2,
  Cpu,
  RefreshCw,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  Download,
} from 'lucide-react';
import type { DigestOfferItem, DigestResponse, JobOffer } from '../types';
import { api } from '../api/client';

interface DailyDigestViewProps {
  digest: DigestResponse | null;
  isLoading: boolean;
  errorMessage?: string | null;
  windowDays: number;
  startFilter: string;
  excludePureQuant: boolean;
  platformFilter: string;
  noLoginOnly: boolean;
  targetStartPeriod: string;
  onChangeWindowDays: (days: number) => void;
  onChangeStartFilter: (startFilter: string) => void;
  onToggleExcludePureQuant: (val: boolean) => void;
  onChangePlatformFilter: (platform: string) => void;
  onToggleNoLoginOnly: (val: boolean) => void;
  onUpdateTargetStartPeriod: (period: string) => Promise<void>;
  onRecalibrate: () => Promise<void>;
  isRecalibrating: boolean;
  onDirectApply: (offer: JobOffer) => void;
  onQuickApplied: (offer: JobOffer) => Promise<void>;
  onSaveToTracker: (offer: JobOffer) => Promise<void>;
  onDismissOffer: (offerId: number) => Promise<void>;
  onUndoDismiss: (offerId: number) => Promise<void>;
  onToggleFavorite: (offerId: number) => Promise<void>;
  onOpenOffersTab: () => void;
  onOpenTrackerTab: () => void;
}

export const DailyDigestView: React.FC<DailyDigestViewProps> = ({
  digest,
  isLoading,
  errorMessage,
  windowDays,
  startFilter,
  excludePureQuant,
  platformFilter,
  noLoginOnly,
  targetStartPeriod,
  onChangeWindowDays,
  onChangeStartFilter,
  onToggleExcludePureQuant,
  onChangePlatformFilter,
  onToggleNoLoginOnly,
  onUpdateTargetStartPeriod,
  onRecalibrate,
  isRecalibrating,
  onDirectApply,
  onQuickApplied,
  onSaveToTracker,
  onDismissOffer,
  onUndoDismiss,
  onToggleFavorite,
  onOpenOffersTab,
  onOpenTrackerTab,
}) => {
  const [sectionTab, setSectionTab] = useState<'latest' | 'top' | 'gems'>('latest');
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [lastDismissedId, setLastDismissedId] = useState<number | null>(null);

  const items: DigestOfferItem[] =
    sectionTab === 'latest'
      ? digest?.latest_offers || []
      : sectionTab === 'top'
      ? digest?.top_qwen_picks || []
      : digest?.serendipity_gems || [];

  useEffect(() => {
    setSelectedIdx(0);
  }, [sectionTab, windowDays, items.length]);

  const handleDismiss = useCallback(
    async (offerId: number) => {
      setLastDismissedId(offerId);
      await onDismissOffer(offerId);
    },
    [onDismissOffer]
  );

  const handleUndo = useCallback(async () => {
    if (lastDismissedId !== null) {
      const idToRestore = lastDismissedId;
      setLastDismissedId(null);
      await onUndoDismiss(idToRestore);
    }
  }, [lastDismissedId, onUndoDismiss]);

  // Keyboard-first triage shortcuts (reverse-engineered from career-ops TUI)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!items.length) return;

      const current = items[Math.min(selectedIdx, items.length - 1)];
      if (!current) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(items.length - 1, i + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'o') {
        e.preventDefault();
        if (current.offer.url) window.open(current.offer.url, '_blank', 'noopener,noreferrer');
      } else if (e.key === 'p') {
        e.preventDefault();
        onDirectApply(current.offer);
      } else if (e.key === 'a') {
        e.preventDefault();
        onQuickApplied(current.offer);
      } else if (e.key === 's') {
        e.preventDefault();
        onSaveToTracker(current.offer);
      } else if (e.key === 'x') {
        e.preventDefault();
        handleDismiss(current.offer.id);
      } else if (e.key === 'u') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [items, selectedIdx, onDirectApply, onQuickApplied, onSaveToTracker, handleDismiss, handleUndo]);

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-[#16a34a]';
    if (score >= 60) return 'bg-[#111818]';
    return 'bg-[#9ca3af]';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-[#16a34a]';
    if (score >= 60) return 'text-[#111818]';
    return 'text-[#6b7280]';
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
          DAILY DIGEST · OFFRES DISPONIBLES
        </div>
        <div className="text-[11px] text-[#6b7280] tabular-nums">
          {digest ? `Mise à jour ${digest.generated_at}` : 'Chargement...'}
        </div>
      </div>

      {/* Macro Survey-style Summary Strip */}
      <div className="bg-[#fafafa] border border-[#e5e5e5] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Qwen3 + Ridge Engine Indicator */}
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">
              MOTEUR EMBEDDING
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Cpu className="w-3.5 h-3.5 text-black" />
              <span className="text-[14px] font-bold text-[#111818] tabular-nums">
                {digest?.engine_name || 'qwen3-embedding:0.6b + Ridge'}
              </span>
              <span
                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border ${
                  digest?.ollama_active
                    ? 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/30'
                    : 'bg-[#f59e0b]/10 text-[#b45309] border-[#f59e0b]/30'
                }`}
              >
                {digest?.ollama_active ? 'ACTIF' : 'FALLBACK'}
              </span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-[#e5e5e5] hidden xl:block" />

          {/* Key Counters */}
          <div className="flex flex-wrap items-center gap-5 tabular-nums">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                DISPONIBLES
              </div>
              <div className="text-[18px] font-bold text-[#111818]">
                {digest?.total_available ?? '—'}
              </div>
            </div>

            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                NOUVELLES ({windowDays}J)
              </div>
              <div className="text-[18px] font-bold text-[#16a34a]">
                {digest?.new_in_window_count ?? '—'}
              </div>
            </div>

            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                SIGNAUX RIDGE
              </div>
              <div className="text-[18px] font-bold text-[#111818]">
                {digest?.ridge_samples ?? 0}
              </div>
            </div>

            {(digest?.follow_up_alerts_count || 0) > 0 && (
              <button
                onClick={onOpenTrackerTab}
                className="text-left px-2.5 py-1 border border-[#f59e0b]/50 bg-[#fef3c7]/50 hover:border-black cursor-pointer"
              >
                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#b45309]">
                  RELANCES DUES
                </div>
                <div className="text-[14px] font-bold text-[#b45309] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {digest?.follow_up_alerts_count}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Target Start Date, Filter, Window, EDHEC Filter & Recalibrate */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Choix de ma date de début cible (enregistré dans le profil & score Qwen3) */}
          <div className="flex items-center border border-[#e5e5e5] bg-white px-2 h-[28px] gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#6b7280]">
              MON DÉBUT :
            </span>
            <select
              value={targetStartPeriod}
              onChange={(e) => onUpdateTargetStartPeriod(e.target.value)}
              className="text-[11px] font-bold text-[#111818] bg-transparent outline-none cursor-pointer"
              title="Date de début personnelle (calibre le scoring Qwen3 + Ridge)"
            >
              <option value="Juin 2027">Juin 2027</option>
              <option value="Juillet 2027">Juillet 2027</option>
              <option value="Septembre 2027">Septembre 2027</option>
              <option value="Janvier 2027">Janvier 2027</option>
              <option value="Avril 2027">Avril 2027</option>
            </select>
          </div>

          {/* Filtre rapide de date des offres */}
          <select
            value={startFilter}
            onChange={(e) => onChangeStartFilter(e.target.value)}
            className="sq-input h-[28px] py-0 px-2 text-[10px] font-bold uppercase tracking-wider"
            title="Filtrer les offres par date de début"
          >
            <option value="all">DÉBUT : TOUS</option>
            <option value="juin_2027">JUIN / ÉTÉ 2027</option>
            <option value="janvier_2027">JANVIER 2027</option>
            <option value="septembre_2027">SEPTEMBRE 2027</option>
            <option value="flexible">FLEXIBLE</option>
          </select>

          <button
            onClick={() => onToggleExcludePureQuant(!excludePureQuant)}
            className={`sq-btn h-[28px] text-[10px] ${excludePureQuant ? 'sq-btn-primary' : ''}`}
            title="Masquer les postes d'ingénieur / Quant pur (C++, FPGA, PhD)"
          >
            {excludePureQuant ? 'PROFIL EDHEC (SANS QUANT PUR)' : 'INCLURE QUANT PUR'}
          </button>

          <button
            onClick={() => onToggleNoLoginOnly(!noLoginOnly)}
            className={`sq-btn h-[28px] text-[10px] ${noLoginOnly ? 'bg-[#16a34a] text-white border-[#16a34a]' : ''}`}
            title="Afficher uniquement les candidatures directes sans création de compte (Greenhouse, Lever, Ashby, Portails Directs)"
          >
            SANS LOGIN ({digest?.no_login_count ?? 0})
          </button>

          <select
            value={platformFilter}
            onChange={(e) => onChangePlatformFilter(e.target.value)}
            className="sq-input h-[28px] py-0 px-2 text-[10px] font-bold uppercase tracking-wider"
            title="Filtrer par plateforme de recrutement"
          >
            <option value="all">PLATEFORME : TOUTES</option>
            <option value="greenhouse">GREENHOUSE ({digest?.platform_counts?.greenhouse ?? 0})</option>
            <option value="direct">DIRECT ENTREPRISE ({digest?.platform_counts?.direct ?? 0})</option>
            <option value="teamtailor">TEAMTAILOR ({digest?.platform_counts?.teamtailor ?? 0})</option>
            <option value="ashby">ASHBY ({digest?.platform_counts?.ashby ?? 0})</option>
            <option value="lever">LEVER ({digest?.platform_counts?.lever ?? 0})</option>
            <option value="smartrecruiters">SMARTRECRUITERS ({digest?.platform_counts?.smartrecruiters ?? 0})</option>
            <option value="flatchr">FLATCHR ({digest?.platform_counts?.flatchr ?? 0})</option>
            <option value="taleez">TALEEZ ({digest?.platform_counts?.taleez ?? 0})</option>
            <option value="workable">WORKABLE ({digest?.platform_counts?.workable ?? 0})</option>
            <option value="avature">AVATURE BNP ({digest?.platform_counts?.avature ?? 0})</option>
            <option value="talentsoft">TALENTSOFT CACIB/AMUNDI ({digest?.platform_counts?.talentsoft ?? 0})</option>
            <option value="altays">ALTAYS ODDO ({digest?.platform_counts?.altays ?? 0})</option>
            <option value="linkedin">LINKEDIN ({digest?.platform_counts?.linkedin ?? 0})</option>
            <option value="jobteaser">JOBTEASER EDHEC ({digest?.platform_counts?.jobteaser ?? 0})</option>
            <option value="wttj">WELCOME TO THE JUNGLE ({digest?.platform_counts?.wttj ?? 0})</option>
            <option value="efinancialcareers">EFINANCIALCAREERS ({digest?.platform_counts?.efinancialcareers ?? 0})</option>
            <option value="indeed">INDEED ({digest?.platform_counts?.indeed ?? 0})</option>
            <option value="workday">WORKDAY ({digest?.platform_counts?.workday ?? 0})</option>
          </select>

          <div className="flex border border-[#e5e5e5] bg-white">
            {[
              { label: '24H', days: 1 },
              { label: '72H', days: 3 },
              { label: '7J', days: 7 },
              { label: '30J', days: 30 },
            ].map((w) => (
              <button
                key={w.days}
                onClick={() => onChangeWindowDays(w.days)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                  windowDays === w.days
                    ? 'bg-black text-white'
                    : 'bg-white text-[#6b7280] hover:text-black'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          <button
            onClick={onRecalibrate}
            disabled={isRecalibrating}
            className="sq-btn h-[28px]"
            title="Recalibrer la régression Ridge sur vos dernières actions"
          >
            <RefreshCw className={`w-3 h-3 ${isRecalibrating ? 'animate-spin' : ''}`} />
            <span>{isRecalibrating ? 'CALIBRAGE...' : 'RECALIBRER RIDGE'}</span>
          </button>

          <a
            href={api.getExportOffersCsvUrl({
              ats_platform: platformFilter,
              no_login_only: noLoginOnly,
              start_period: startFilter,
              exclude_pure_quant: excludePureQuant,
            })}
            download
            className="sq-btn h-[28px]"
            title="Exporter les offres et liens en CSV pour Excel / WhatsApp / Email"
          >
            <Download className="w-3 h-3" />
            <span>EXPORT CSV</span>
          </a>
        </div>
      </div>

      {/* Sub-Navigation Switcher + Keyboard Triage Hints */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e5e5] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSectionTab('latest')}
            className={`sq-btn ${sectionTab === 'latest' ? 'sq-btn-primary' : ''}`}
          >
            DERNIÈRES SORTIES ({digest?.latest_offers.length ?? 0})
          </button>
          <button
            onClick={() => setSectionTab('top')}
            className={`sq-btn ${sectionTab === 'top' ? 'sq-btn-primary' : ''}`}
          >
            TOP QWEN3 + RIDGE ({digest?.top_qwen_picks.length ?? 0})
          </button>
          <button
            onClick={() => setSectionTab('gems')}
            className={`sq-btn ${sectionTab === 'gems' ? 'sq-btn-primary' : ''}`}
          >
            <Sparkles className="w-3 h-3" />
            PÉPITES ADJACENTES ({digest?.serendipity_gems.length ?? 0})
          </button>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-[#6b7280]">
          <span className="hidden lg:inline font-mono">
            [J/K] NAV · [O] OUVRIR · [P] PITCH · [A] POSTULÉ · [S] SAUVER · [X] PASSER
          </span>
          {lastDismissedId !== null && (
            <button onClick={handleUndo} className="sq-btn py-1 px-2 text-black">
              <Undo2 className="w-3 h-3" />
              ANNULER PASS (U)
            </button>
          )}
          <button
            onClick={onOpenOffersTab}
            className="text-[11px] font-bold uppercase tracking-wider text-black hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>TOUTES LES OFFRES</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Digest Square Cards Grid (4 cols on desktop, matching Macro Survey) */}
      {isLoading && !digest ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="sq-card p-4 h-[260px] animate-pulse bg-[#fafafa]" />
          ))}
        </div>
      ) : errorMessage && !digest ? (
        <div className="sq-card p-10 text-center border-[#dc2626]/40">
          <p className="text-[12px] font-semibold text-[#dc2626]">{errorMessage}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="sq-card p-10 text-center">
          <p className="text-[12px] text-[#6b7280]">
            Aucune offre active dans cette section. Lancez SYNC pour poller les ATS directs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item, idx) => {
            const { offer, qwen_score, freshness_label, ats_platform, match_reasons, hard_flags } = item;
            const isSelected = idx === selectedIdx;

            return (
              <div
                key={offer.id}
                onClick={() => setSelectedIdx(idx)}
                className={`flex flex-col justify-between min-h-[265px] cursor-pointer transition-all ${
                  isSelected ? 'sq-card-active' : 'sq-card'
                }`}
              >
                {/* Top 4px Qwen3 Score Bar */}
                <div className="h-[4px] w-full bg-[#e5e5e5]">
                  <div
                    className={`h-full ${getScoreBarColor(qwen_score)}`}
                    style={{ width: `${Math.min(100, Math.max(8, qwen_score))}%` }}
                  />
                </div>

                <div className="p-3.5 flex-1 flex flex-col gap-2">
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 border tabular-nums ${
                          item.freshness_days <= 3
                            ? 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/30'
                            : 'bg-white text-[#6b7280] border-[#e5e5e5]'
                        }`}
                      >
                        {freshness_label}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 border border-[#e5e5e5] bg-white text-[#111818]">
                        {ats_platform.toUpperCase()}
                      </span>
                      <span
                        className={`text-[8.5px] font-bold uppercase tracking-[0.06em] px-1 py-0.5 border ${
                          item.login_required
                            ? 'bg-[#fafafa] text-[#9ca3af] border-[#e5e5e5]'
                            : 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/30'
                        }`}
                        title={item.login_required ? 'Compte/connexion requis sur cette plateforme' : 'Formulaire direct sans création de compte'}
                      >
                        {item.login_required ? 'LOGIN' : 'SANS LOGIN'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[13px] font-bold tabular-nums ${getScoreTextColor(qwen_score)}`}>
                        {qwen_score.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-[#9ca3af] uppercase">/100</span>
                    </div>
                  </div>

                  {/* Company & Location */}
                  <div className="flex items-center justify-between text-[11px] text-[#6b7280] border-b border-[#e5e5e5] pb-1.5">
                    <span className="font-bold text-[#111818] truncate">{offer.company}</span>
                    <span className="truncate ml-2">{offer.location}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[13.5px] font-semibold leading-[1.35] text-[#111818] line-clamp-2">
                    {offer.title}
                  </h3>

                  {/* Desk, Start Date & Posted Date */}
                  <div className="text-[10px] uppercase tracking-[0.08em] text-[#6b7280] font-semibold truncate">
                    {offer.desk}
                    {offer.start_date ? ` · Début: ${offer.start_date}` : ''}
                    {offer.date_posted ? ` · ${offer.date_posted}` : ''}
                  </div>

                  {/* Qwen3 + Ridge Reasons */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {match_reasons.slice(0, 2).map((reason, rIdx) => (
                      <span
                        key={rIdx}
                        className="text-[9px] font-semibold px-1.5 py-0.5 bg-white border border-[#e5e5e5] text-[#6b7280] truncate max-w-full"
                      >
                        {reason}
                      </span>
                    ))}
                    {hard_flags.map((flag, fIdx) => (
                      <span
                        key={fIdx}
                        className="text-[9px] font-bold px-1.5 py-0.5 bg-[#dc2626]/10 border border-[#dc2626]/30 text-[#dc2626] inline-flex items-center gap-1"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {flag}
                      </span>
                    ))}
                  </div>

                  {/* Bottom Action Row */}
                  <div className="mt-auto pt-2.5 border-t border-[#e5e5e5] flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      {offer.url && (
                        <a
                          href={offer.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="sq-btn sq-btn-primary py-1 px-2 text-[10px]"
                          title="Ouvrir l'offre directe (O)"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{item.login_required ? 'POSTULER' : 'POSTULER DIRECT'}</span>
                        </a>
                      )}
                      {offer.direct_apply_email && (
                        <a
                          href={`mailto:${offer.direct_apply_email}?subject=${encodeURIComponent(`Candidature Stage - ${offer.title} - Léo Lombardini`)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="sq-btn py-1 px-2 text-[10px] border-[#16a34a] text-[#16a34a]"
                          title={`Envoyer directement par email à ${offer.direct_apply_email}`}
                        >
                          MAIL RH
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDirectApply(offer);
                        }}
                        className="sq-btn py-1 px-2 text-[10px]"
                        title="Pitch & Speed-Apply Pack (P)"
                      >
                        <Send className="w-3 h-3" />
                        <span>PITCH</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {offer.is_applied ? (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-1 bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30 inline-flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          POSTULÉ
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickApplied(offer);
                            }}
                            className="sq-btn py-1 px-1.5 text-[10px]"
                            title="Marquer Postulé 1-clic (A)"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(offer.id);
                            }}
                            className={`sq-btn py-1 px-1.5 text-[10px] ${
                              offer.is_favorite ? 'bg-black text-white border-black' : ''
                            }`}
                            title="Favori (entraîne Ridge)"
                          >
                            <Bookmark className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(offer.id);
                            }}
                            className="sq-btn py-1 px-1.5 text-[10px] hover:text-[#dc2626]"
                            title="Passer cette offre (X)"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
