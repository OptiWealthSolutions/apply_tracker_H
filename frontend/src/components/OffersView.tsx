import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  Send,
  Bookmark,
  Check,
  X,
  Plus,
  Building2,
  RefreshCw,
  Link as LinkIcon,
  AlertTriangle,
  SlidersHorizontal,
  GraduationCap,
  Download,
} from 'lucide-react';
import type { BankDirectoryItem, JobOffer, LiveBankSearchResultItem } from '../types';
import { api } from '../api/client';

interface OffersViewProps {
  offers: JobOffer[];
  onScrapeSearch: (keywords: string, location: string) => Promise<void>;
  onScrapeUrl: (url: string) => Promise<void>;
  onSyncRealOffers: () => Promise<void>;
  onAddToTracker: (offer: JobOffer) => void;
  onDirectApply: (offer: JobOffer) => void;
  onToggleFavorite: (id: number) => void;
  onDismissOffer: (id: number) => Promise<void>;
  onVerifyLinks: () => Promise<void>;
  onOfferImported: (offer: JobOffer) => void;
  onOpenOfferPrep?: (offer: JobOffer) => void;
  isScraping: boolean;
  isSyncing: boolean;
}

const PRESET_QUERIES = [
  'stage trading paris',
  'quantitative research intern',
  'stage structuring dérivés',
  'hedge fund quant intern',
  'sales trading intern london',
  'asset management quant',
];

const NO_LOGIN_PLATFORMS = new Set([
  'greenhouse',
  'lever',
  'ashby',
  'smartrecruiters',
  'teamtailor',
  'workable',
  'flatchr',
  'taleez',
  'direct',
]);

const PLATFORM_LABELS: Record<string, string> = {
  greenhouse: 'Greenhouse',
  direct: 'Direct Entreprise',
  teamtailor: 'Teamtailor',
  ashby: 'Ashby',
  lever: 'Lever',
  smartrecruiters: 'SmartRecruiters',
  workable: 'Workable',
  flatchr: 'Flatchr',
  taleez: 'Taleez',
  linkedin: 'LinkedIn',
  avature: 'Avature (BNP)',
  talentsoft: 'TalentSoft (CACIB/Amundi)',
  altays: 'Altays (Oddo)',
  jobteaser: 'JobTeaser EDHEC',
  wttj: 'Welcome to the Jungle',
  efinancialcareers: 'eFinancialCareers',
  indeed: 'Indeed',
  glassdoor: 'Glassdoor',
  workday: 'Workday',
  taleo: 'Taleo',
  icims: 'iCIMS',
};

const QUICK_PLATFORM_KEYS = [
  'greenhouse',
  'direct',
  'teamtailor',
  'ashby',
  'avature',
  'talentsoft',
  'linkedin',
  'jobteaser',
  'wttj',
  'efinancialcareers',
  'indeed',
  'workday',
];

export const OffersView: React.FC<OffersViewProps> = ({
  offers,
  onScrapeSearch,
  onScrapeUrl,
  onSyncRealOffers,
  onAddToTracker,
  onDirectApply,
  onToggleFavorite,
  onDismissOffer,
  onVerifyLinks,
  onOfferImported,
  onOpenOfferPrep,
  isScraping,
  isSyncing,
}) => {
  const [subTab, setSubTab] = useState<'feed' | 'banks' | 'scraper'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [deskFilter, setDeskFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [atsFilter, setAtsFilter] = useState('all');
  const [noLoginOnly, setNoLoginOnly] = useState(false);
  const [startPeriodFilter, setStartPeriodFilter] = useState('all');
  const [excludePureQuant, setExcludePureQuant] = useState(true);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [hideApplied, setHideApplied] = useState(false);
  const [sortBy, setSortBy] = useState<'qwen' | 'date'>('qwen');
  const [isVerifying, setIsVerifying] = useState(false);

  // Scraper state
  const [scrapeKw, setScrapeKw] = useState('quantitative trading intern');
  const [scrapeLoc, setScrapeLoc] = useState('Paris');
  const [customUrl, setCustomUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  // Direct Bank Career Portals state
  const [banks, setBanks] = useState<BankDirectoryItem[]>([]);
  const [banksLoaded, setBanksLoaded] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [bankKeyword, setBankKeyword] = useState('trading quant intern');
  const [bankLocation, setBankLocation] = useState('Paris');
  const [bankResults, setBankResults] = useState<LiveBankSearchResultItem[]>([]);
  const [bankSearching, setBankSearching] = useState(false);
  const [bankSearched, setBankSearched] = useState(false);
  const [bankCategoryFilter, setBankCategoryFilter] = useState<string>('ALL');

  const loadBanksIfNeeded = async () => {
    if (banksLoaded) return;
    try {
      const list = await api.getBankDirectory();
      setBanks(list);
      setBanksLoaded(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubTabChange = (t: 'feed' | 'banks' | 'scraper') => {
    setSubTab(t);
    if (t === 'banks') loadBanksIfNeeded();
  };

  const uniqueDesks = useMemo(
    () => Array.from(new Set(offers.map((o) => o.desk).filter(Boolean))).sort(),
    [offers]
  );

  const uniqueLocations = useMemo(
    () => Array.from(new Set(offers.map((o) => o.location).filter(Boolean))).sort(),
    [offers]
  );

  const platformStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let noLoginTotal = 0;
    for (const o of offers) {
      const p = (o.ats_platform || 'direct').toLowerCase();
      counts[p] = (counts[p] || 0) + 1;
      if (NO_LOGIN_PLATFORMS.has(p)) noLoginTotal += 1;
    }
    return { counts, noLoginTotal };
  }, [offers]);

  const filteredOffers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = offers.filter((o) => {
      const plat = (o.ats_platform || 'direct').toLowerCase();
      if (onlyFavorites && !o.is_favorite) return false;
      if (hideApplied && o.is_applied) return false;
      if (deskFilter !== 'all' && o.desk !== deskFilter) return false;
      if (locationFilter !== 'all' && o.location !== locationFilter) return false;
      if (atsFilter !== 'all' && plat !== atsFilter) return false;
      if (noLoginOnly && !NO_LOGIN_PLATFORMS.has(plat)) return false;
      if (excludePureQuant) {
        const flagsStr = (o.hard_flags || '').toLowerCase();
        if (flagsStr.includes('quant pur')) return false;
      }
      if (startPeriodFilter !== 'all') {
        const sd = (o.start_date || '').toLowerCase();
        const hay = `${sd} ${o.title} ${o.description || ''}`.toLowerCase();
        if (startPeriodFilter === 'juin_2027') {
          if (!['juin 2027', 'june 2027', 'summer 2027', 'été 2027', 'juillet 2027', 'july 2027'].some((k) => hay.includes(k))) return false;
        } else if (startPeriodFilter === 'janvier_2027') {
          if (!['janvier 2027', 'january 2027', 'hiver 2027', 'winter 2027'].some((k) => hay.includes(k))) return false;
        } else if (startPeriodFilter === 'septembre_2027') {
          if (!['septembre 2027', 'september 2027', 'automne 2027'].some((k) => hay.includes(k))) return false;
        } else if (startPeriodFilter === 'flexible') {
          if (sd && !sd.includes('flexible') && !sd.includes('non précisée')) return false;
        }
      }
      if (q) {
        const hay = `${o.title} ${o.company} ${o.desk} ${o.location} ${o.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'date') {
        return (b.date_posted || '').localeCompare(a.date_posted || '') || b.id - a.id;
      }
      return (b.qwen_score || 0) - (a.qwen_score || 0) || b.id - a.id;
    });
  }, [offers, searchQuery, deskFilter, locationFilter, atsFilter, noLoginOnly, startPeriodFilter, excludePureQuant, onlyFavorites, hideApplied, sortBy]);

  const handleBankSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSearching(true);
    setBankSearched(false);
    try {
      const res = await api.liveBankSearch({
        keyword: bankKeyword,
        bank_ids: selectedBankIds.length ? selectedBankIds : undefined,
        location: bankLocation,
      });
      setBankResults(res);
      setBankSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setBankSearching(false);
    }
  };

  const handleImportBankOffer = async (item: LiveBankSearchResultItem) => {
    try {
      const imported = await api.importBankOffer(item);
      onOfferImported(imported);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setUrlLoading(true);
    try {
      await onScrapeUrl(customUrl.trim());
      setCustomUrl('');
    } finally {
      setUrlLoading(false);
    }
  };

  const handleVerifyAll = async () => {
    setIsVerifying(true);
    try {
      await onVerifyLinks();
    } finally {
      setIsVerifying(false);
    }
  };

  const parseJsonList = (raw?: string): string[] => {
    if (!raw) return [];
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-5">
      {/* Section Header + Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-b border-[#e5e5e5] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSubTabChange('feed')}
            className={`sq-btn ${subTab === 'feed' ? 'sq-btn-primary' : ''}`}
          >
            OFFRES ACTIVES ({offers.length})
          </button>
          <button
            onClick={() => handleSubTabChange('banks')}
            className={`sq-btn ${subTab === 'banks' ? 'sq-btn-primary' : ''}`}
          >
            <Building2 className="w-3.5 h-3.5" />
            PORTAILS CARRIÈRES DIRECTS
          </button>
          <button
            onClick={() => handleSubTabChange('scraper')}
            className={`sq-btn ${subTab === 'scraper' ? 'sq-btn-primary' : ''}`}
          >
            <Search className="w-3.5 h-3.5" />
            SCRAPER & IMPORT URL
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={api.getExportOffersCsvUrl({
              query: searchQuery.trim() || undefined,
              desk: deskFilter,
              location: locationFilter,
              ats_platform: atsFilter,
              no_login_only: noLoginOnly,
              start_period: startPeriodFilter,
              exclude_pure_quant: excludePureQuant,
              only_favorites: onlyFavorites,
            })}
            download
            className="sq-btn"
            title="Exporter ces offres et leurs liens directs en CSV formaté pour Excel"
          >
            <Download className="w-3 h-3" />
            <span>EXPORT CSV ({filteredOffers.length})</span>
          </a>
          <button
            onClick={handleVerifyAll}
            disabled={isVerifying}
            className="sq-btn"
            title="Vérifier en direct que toutes les offres sont toujours ouvertes et supprimer les expirées"
          >
            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'VÉRIFICATION...' : 'PURGER EXPIRÉES'}</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ACTIVE OFFERS FEED (Macro Survey Filter Bar + Square Cards) */}
      {subTab === 'feed' && (
        <div className="space-y-5">
          {/* Sticky Filter Bar (Macro Survey Style) */}
          <div className="bg-white border border-[#e5e5e5] p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Recherche titre, banque, desk, compétence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sq-input w-full pl-8"
                />
              </div>

              <select
                value={deskFilter}
                onChange={(e) => setDeskFilter(e.target.value)}
                className="sq-input min-w-[160px]"
              >
                <option value="all">TOUS DESKS</option>
                {uniqueDesks.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="sq-input min-w-[140px]"
              >
                <option value="all">TOUS LIEUX</option>
                {uniqueLocations.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>

              <select
                value={atsFilter}
                onChange={(e) => setAtsFilter(e.target.value)}
                className="sq-input min-w-[160px]"
              >
                <option value="all">TOUTES PLATEFORMES ({offers.length})</option>
                {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label.toUpperCase()} ({platformStats.counts[key] || 0})
                  </option>
                ))}
              </select>

              <select
                value={startPeriodFilter}
                onChange={(e) => setStartPeriodFilter(e.target.value)}
                className="sq-input min-w-[140px]"
              >
                <option value="all">DÉBUT : TOUS</option>
                <option value="juin_2027">JUIN / ÉTÉ 2027</option>
                <option value="janvier_2027">JANVIER 2027</option>
                <option value="septembre_2027">SEPTEMBRE 2027</option>
                <option value="flexible">FLEXIBLE</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setNoLoginOnly(!noLoginOnly)}
                className={`sq-btn py-1 px-2.5 text-[10px] ${
                  noLoginOnly ? 'bg-[#16a34a] text-white border-[#16a34a]' : ''
                }`}
                title="Filtrer les offres sans création de compte / mur de connexion"
              >
                SANS LOGIN ({platformStats.noLoginTotal})
              </button>
              <button
                type="button"
                onClick={() => setAtsFilter('all')}
                className={`px-2 py-1 text-[10px] font-semibold border cursor-pointer ${
                  atsFilter === 'all'
                    ? 'bg-black text-white border-black'
                    : 'bg-[#fafafa] text-[#6b7280] border-[#e5e5e5] hover:border-black'
                }`}
              >
                TOUTES ({offers.length})
              </button>
              {QUICK_PLATFORM_KEYS.map((key) => {
                const cnt = platformStats.counts[key] || 0;
                const active = atsFilter === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setAtsFilter(active ? 'all' : key)}
                    className={`px-2 py-1 text-[10px] font-semibold border cursor-pointer ${
                      active
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-[#6b7280] border-[#e5e5e5] hover:border-black'
                    }`}
                  >
                    {(PLATFORM_LABELS[key] || key).toUpperCase()} ({cnt})
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setExcludePureQuant(!excludePureQuant)}
                  className={`sq-btn py-1 px-2.5 ${excludePureQuant ? 'sq-btn-primary' : ''}`}
                >
                  {excludePureQuant ? 'SANS QUANT PUR / INGÉ' : 'AVEC QUANT PUR'}
                </button>
                <button
                  onClick={() => setOnlyFavorites(!onlyFavorites)}
                  className={`sq-btn py-1 px-2.5 ${onlyFavorites ? 'sq-btn-primary' : ''}`}
                >
                  FAVORIS
                </button>
                <button
                  onClick={() => setHideApplied(!hideApplied)}
                  className={`sq-btn py-1 px-2.5 ${hideApplied ? 'sq-btn-primary' : ''}`}
                >
                  MASQUER POSTULÉES
                </button>
                <span className="text-[11px] text-[#6b7280] tabular-nums ml-2">
                  {filteredOffers.length} offres disponibles
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  TRI
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'qwen' | 'date')}
                  className="sq-input py-1 px-2 text-[11px]"
                >
                  <option value="qwen">SCORE QWEN3 + RIDGE</option>
                  <option value="date">PLUS RÉCENTES</option>
                </select>
              </div>
            </div>
          </div>

          {/* Square Cards Grid */}
          {filteredOffers.length === 0 ? (
            <div className="sq-card p-12 text-center">
              <p className="text-[12px] text-[#6b7280]">
                Aucune offre disponible ne correspond à ces filtres.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOffers.map((offer) => {
                const score = offer.qwen_score ?? 50;
                const reasons = parseJsonList(offer.qwen_reasons);
                const flags = parseJsonList(offer.hard_flags);
                const atsKey = (offer.ats_platform || 'direct').toLowerCase();
                const ats = (PLATFORM_LABELS[atsKey] || atsKey).toUpperCase();
                const isDirectNoLogin = NO_LOGIN_PLATFORMS.has(atsKey);

                return (
                  <div key={offer.id} className="sq-card flex flex-col justify-between min-h-[250px]">
                    <div className="h-[3px] w-full bg-[#e5e5e5]">
                      <div
                        className={`h-full ${score >= 80 ? 'bg-[#16a34a]' : score >= 60 ? 'bg-black' : 'bg-[#9ca3af]'}`}
                        style={{ width: `${Math.min(100, Math.max(8, score))}%` }}
                      />
                    </div>

                    <div className="p-4 flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#e5e5e5] bg-white">
                            {ats}
                          </span>
                          <span
                            className={`text-[8.5px] font-bold uppercase tracking-wider px-1 py-0.5 border ${
                              isDirectNoLogin
                                ? 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/30'
                                : 'bg-[#fafafa] text-[#9ca3af] border-[#e5e5e5]'
                            }`}
                          >
                            {isDirectNoLogin ? 'SANS LOGIN' : 'LOGIN'}
                          </span>
                          {offer.date_posted && (
                            <span className="text-[10px] text-[#6b7280] tabular-nums">
                              {offer.date_posted}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[13px] font-bold tabular-nums ${
                            score >= 80 ? 'text-[#16a34a]' : 'text-[#111818]'
                          }`}
                        >
                          {score.toFixed(1)}/100
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] border-b border-[#e5e5e5] pb-1.5">
                        <span className="font-bold text-[#111818] truncate">{offer.company}</span>
                        <span className="text-[#6b7280] truncate ml-2">{offer.location}</span>
                      </div>

                      <h3 className="text-[13.5px] font-semibold text-[#111818] leading-snug line-clamp-2">
                        {offer.title}
                      </h3>

                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">
                        {offer.desk} · {offer.start_date || offer.contract_type}
                      </div>

                      {(reasons.length > 0 || flags.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {reasons.slice(0, 2).map((r, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-semibold px-1.5 py-0.5 bg-white border border-[#e5e5e5] text-[#6b7280]"
                            >
                              {r}
                            </span>
                          ))}
                          {flags.map((f, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-bold px-1.5 py-0.5 bg-[#dc2626]/10 border border-[#dc2626]/30 text-[#dc2626] inline-flex items-center gap-1"
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto pt-3 border-t border-[#e5e5e5] flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          {offer.url && (
                            <a
                              href={offer.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sq-btn sq-btn-primary py-1 px-2 text-[10px]"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {isDirectNoLogin ? 'POSTULER DIRECT' : 'POSTULER'}
                            </a>
                          )}
                          {offer.direct_apply_email && (
                            <a
                              href={`mailto:${offer.direct_apply_email}?subject=${encodeURIComponent(`Candidature Stage - ${offer.title} - Léo Lombardini`)}`}
                              className="sq-btn py-1 px-2 text-[10px] border-[#16a34a] text-[#16a34a]"
                              title={`Envoyer par email à ${offer.direct_apply_email}`}
                            >
                              MAIL RH
                            </a>
                          )}
                          <button
                            onClick={() => onDirectApply(offer)}
                            className="sq-btn py-1 px-2 text-[10px]"
                          >
                            <Send className="w-3 h-3" />
                            PITCH
                          </button>
                          {onOpenOfferPrep && (
                            <button
                              onClick={() => onOpenOfferPrep(offer)}
                              className="sq-btn py-1 px-1.5 text-[10px]"
                              title="Préparation technique desk & fit ATS"
                            >
                              <GraduationCap className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {offer.is_applied ? (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-1 bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30 inline-flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              SUIVI
                            </span>
                          ) : (
                            <button
                              onClick={() => onAddToTracker(offer)}
                              className="sq-btn py-1 px-2 text-[10px]"
                              title="Enregistrer comme Postulé dans le Tracker (1 clic)"
                            >
                              <Check className="w-3 h-3" />
                              POSTULÉ
                            </button>
                          )}
                          <button
                            onClick={() => onToggleFavorite(offer.id)}
                            className={`sq-btn py-1 px-1.5 text-[10px] ${
                              offer.is_favorite ? 'bg-black text-white border-black' : ''
                            }`}
                            title="Favori"
                          >
                            <Bookmark className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDismissOffer(offer.id)}
                            className="sq-btn py-1 px-1.5 text-[10px] hover:text-[#dc2626]"
                            title="Masquer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: BANK CAREER PORTALS */}
      {subTab === 'banks' && (
        <div className="space-y-5">
          <form onSubmit={handleBankSearch} className="bg-white border border-[#e5e5e5] p-4 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
              RECHERCHE EN DIRECT SUR PORTAILS CARRIÈRES OFFICIELS
            </div>
            <div className="flex flex-wrap gap-2.5">
              <input
                type="text"
                value={bankKeyword}
                onChange={(e) => setBankKeyword(e.target.value)}
                placeholder="Mots-clés (ex: trading, quant, structuring)"
                className="sq-input flex-1 min-w-[200px]"
              />
              <input
                type="text"
                value={bankLocation}
                onChange={(e) => setBankLocation(e.target.value)}
                placeholder="Ville (Paris, London...)"
                className="sq-input w-40"
              />
              <button type="submit" disabled={bankSearching} className="sq-btn sq-btn-primary">
                <Search className="w-3.5 h-3.5" />
                {bankSearching ? 'INTERROGATION...' : 'LANCER RECHERCHE'}
              </button>
            </div>

            {banks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {banks.map((b) => {
                  const active = selectedBankIds.includes(b.id);
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() =>
                        setSelectedBankIds((prev) =>
                          prev.includes(b.id) ? prev.filter((x) => x !== b.id) : [...prev, b.id]
                        )
                      }
                      className={`px-2 py-1 text-[10px] font-semibold border cursor-pointer ${
                        active
                          ? 'bg-black text-white border-black'
                          : 'bg-[#fafafa] text-[#6b7280] border-[#e5e5e5] hover:border-black'
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>
            )}
          </form>

          {bankSearched && !bankSearching && bankResults.length === 0 && (
            <div className="sq-card p-4 text-[12px] text-[#6b7280]">
              Aucune annonce temps réel remontée sur ces filtres par l&apos;API publique. Utilisez directement les boutons <strong className="text-[#111818]">PORTAIL OFFICIEL</strong> ou <strong className="text-[#111818]">RECHERCHER</strong> ci-dessous pour consulter les offres en direct chez chaque firme.
            </div>
          )}

          {bankResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankResults.map((item, idx) => (
                <div key={idx} className="sq-card p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] border-b border-[#e5e5e5] pb-1.5">
                      <span className="font-bold text-[#111818]">{item.company}</span>
                      <span className="text-[#6b7280]">{item.location}</span>
                    </div>
                    <h4 className="text-[13.5px] font-semibold text-[#111818] mt-2">{item.title}</h4>
                    <div className="text-[10px] uppercase tracking-wider text-[#6b7280] mt-1">
                      {item.desk} · {item.duration_months}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#e5e5e5]">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sq-btn sq-btn-primary py-1 px-2 text-[10px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      OUVRIR
                    </a>
                    <button
                      onClick={() => handleImportBankOffer(item)}
                      className="sq-btn py-1 px-2 text-[10px]"
                    >
                      <Plus className="w-3 h-3" />
                      IMPORTER
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {banks.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                  RÉPERTOIRE OFFICIEL DES PORTAILS CARRIÈRES ({banks.length} INSTITUTIONS)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['ALL', ...Array.from(new Set(banks.map((b) => b.category)))].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setBankCategoryFilter(cat)}
                      className={`px-2 py-1 text-[10px] font-semibold border cursor-pointer ${
                        bankCategoryFilter === cat
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-[#6b7280] border-[#e5e5e5] hover:border-black'
                      }`}
                    >
                      {cat === 'ALL' ? 'TOUTES' : cat.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banks
                  .filter((b) => bankCategoryFilter === 'ALL' || b.category === bankCategoryFilter)
                  .map((b) => {
                    const directSearchUrl = b.search_url_template
                      ? b.search_url_template.replace('{query}', encodeURIComponent(bankKeyword.trim() || 'intern'))
                      : b.career_portal_url;
                    return (
                      <div key={b.id} className="sq-card p-4 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-[#6b7280] border-b border-[#e5e5e5] pb-1.5">
                            <span>{b.category}</span>
                            <span>{b.region}</span>
                          </div>
                          <h4 className="text-[14px] font-bold text-[#111818] mt-2">{b.name}</h4>
                          <div className="text-[11px] text-[#6b7280] mt-1">
                            {b.specialties.slice(0, 3).join(' · ')}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e5e5e5]">
                          <a
                            href={b.career_portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sq-btn sq-btn-primary py-1 px-2.5 text-[10px]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            PORTAIL OFFICIEL
                          </a>
                          <a
                            href={directSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sq-btn py-1 px-2 text-[10px]"
                          >
                            <Search className="w-3 h-3" />
                            RECHERCHER
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: SCRAPER & URL IMPORTER */}
      {subTab === 'scraper' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-[#e5e5e5] p-5 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
              SCRAPER PAR MOTS-CLÉS (VÉRIFICATION HTTP 200)
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onScrapeSearch(scrapeKw, scrapeLoc);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={scrapeKw}
                onChange={(e) => setScrapeKw(e.target.value)}
                placeholder="Requête (ex: quant intern)"
                className="sq-input w-full"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scrapeLoc}
                  onChange={(e) => setScrapeLoc(e.target.value)}
                  placeholder="Lieu"
                  className="sq-input flex-1"
                />
                <button type="submit" disabled={isScraping} className="sq-btn sq-btn-primary">
                  <Search className="w-3.5 h-3.5" />
                  {isScraping ? 'SCRAPING...' : 'SCRAPER'}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#e5e5e5]">
              {PRESET_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setScrapeKw(q);
                    onScrapeSearch(q, scrapeLoc);
                  }}
                  className="sq-btn py-1 px-2 text-[10px]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e5e5e5] p-5 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
              IMPORTER UNE URL DIRECTE (GREENHOUSE / LEVER / LINKEDIN / BANQUE)
            </div>
            <form onSubmit={handleUrlImport} className="space-y-3">
              <div className="relative">
                <LinkIcon className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  required
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://boards.greenhouse.io/..."
                  className="sq-input w-full pl-8"
                />
              </div>
              <div className="flex items-center justify-between">
                <button type="submit" disabled={urlLoading} className="sq-btn sq-btn-primary">
                  {urlLoading ? 'EXTRACTION...' : 'VÉRIFIER & IMPORTER'}
                </button>
                <button
                  type="button"
                  onClick={onSyncRealOffers}
                  disabled={isSyncing}
                  className="sq-btn"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  SYNC GLOBALE ATS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
