import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ExternalLink,
  Send,
  Mail,
  Check,
  Sparkles,
  RefreshCw,
  Users,
  Copy,
} from 'lucide-react';
import type { BoutiqueKeyPerson, JobOffer, SuggestedBoutique } from '../types';
import { api } from '../api/client';

interface SuggestionsViewProps {
  applicationsCount: number;
  onColdApply: (syntheticOffer: JobOffer) => void;
  onQuickTrackBoutique: (boutique: SuggestedBoutique) => Promise<void>;
}

export const SuggestionsView: React.FC<SuggestionsViewProps> = ({
  applicationsCount,
  onColdApply,
  onQuickTrackBoutique,
}) => {
  const [items, setItems] = useState<SuggestedBoutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichBanner, setEnrichBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [hubFilter, setHubFilter] = useState('all');
  const [onlyDirectEmail, setOnlyDirectEmail] = useState(false);
  const [onlyNoLogin, setOnlyNoLogin] = useState(false);
  const [onlyWithPeople, setOnlyWithPeople] = useState(false);
  const [hideTracked, setHideTracked] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await api.getSuggestedBoutiques();
      setItems(data);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [applicationsCount]);

  const handleEnrich = async () => {
    setEnriching(true);
    setEnrichBanner(null);
    try {
      const res = await api.enrichSuggestedBoutiques();
      await loadSuggestions();
      setEnrichBanner(
        `Enrichissement terminé : ${res.verified_emails_count} emails vérifiés sur site, ${res.inferred_emails_count} formats déduits (MX OK), ${res.with_key_people_count}/${res.total_boutiques} firmes avec décideurs/RH identifiés.`
      );
    } catch (err) {
      console.error(err);
      setEnrichBanner('Erreur pendant le scraping des contacts.');
    } finally {
      setEnriching(false);
    }
  };

  const handleCopyEmail = (email: string, key: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))),
    [items]
  );

  const hubs = useMemo(
    () => Array.from(new Set(items.map((i) => i.hub))),
    [items]
  );

  const stats = useMemo(() => {
    const emailCount = items.filter((i) => Boolean(i.best_email || i.spontaneous_email)).length;
    const verifiedCount = items.filter((i) => i.email_confidence === 'verified_site').length;
    const noLoginCount = items.filter((i) => i.no_login).length;
    const peopleCount = items.filter((i) => (i.key_people?.length || 0) > 0).length;
    const catCounts: Record<string, number> = {};
    for (const i of items) {
      catCounts[i.category] = (catCounts[i.category] || 0) + 1;
    }
    return { emailCount, verifiedCount, noLoginCount, peopleCount, catCounts };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
      if (hubFilter !== 'all' && i.hub !== hubFilter) return false;
      if (onlyDirectEmail && !(i.best_email || i.spontaneous_email)) return false;
      if (onlyNoLogin && !i.no_login) return false;
      if (onlyWithPeople && (i.key_people?.length || 0) === 0) return false;
      if (hideTracked && i.is_tracked) return false;
      if (q) {
        const peopleTxt = (i.key_people || []).map((p) => `${p.name} ${p.role}`).join(' ');
        const hay = `${i.name} ${i.category} ${i.location} ${i.specialties.join(' ')} ${i.leo_fit_angle} ${i.target_role} ${i.best_email || ''} ${peopleTxt}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, categoryFilter, hubFilter, onlyDirectEmail, onlyNoLogin, onlyWithPeople, hideTracked]);

  const toSyntheticOffer = (b: SuggestedBoutique, person?: BoutiqueKeyPerson): JobOffer => {
    const email = person?.email_guess || b.best_email || b.spontaneous_email || undefined;
    return {
      id: 0,
      title: b.target_role,
      company: b.name,
      location: b.location,
      desk: b.category,
      asset_class: b.specialties[0] || 'Multi-Asset',
      contract_type: 'Candidature Spontanée · Stage 6 mois (Juin 2027)',
      description: `${b.leo_fit_angle}\nSpécialités : ${b.specialties.join(', ')}.`,
      requirements: person ? `Contact cible : ${person.name} (${person.role})` : 'EDHEC Master in Management (Finance Track)',
      url: b.careers_url || b.website_url,
      source: 'Suggestions Boutiques',
      ats_platform: b.ats_platform,
      direct_apply_email: email,
      is_favorite: false,
      is_applied: b.is_tracked,
    };
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6b7280] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>SUGGESTIONS · BOUTIQUES, MAILS &amp; DÉCIDEURS ({items.length} CIBLES)</span>
          </div>
          <p className="text-[11px] text-[#6b7280] mt-0.5">
            Wealth Management, Asset Management, Macro Hedge Funds &amp; Market Makers (sans Corporate Finance) avec extraction des emails clés, profils LinkedIn dirigeants/RH et modèles sans localhost.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEnrich}
          disabled={enriching}
          className="sq-btn sq-btn-primary"
          title="Crawler les sites officiels pour extraire emails, dirigeants, RH et liens LinkedIn"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${enriching ? 'animate-spin' : ''}`} />
          <span>{enriching ? 'SCRAPING CONTACTS...' : 'SCRAPER CONTACTS & LINKEDIN'}</span>
        </button>
      </div>

      {enrichBanner && (
        <div className="bg-black text-white px-4 py-2 text-[11px] font-medium flex items-center justify-between">
          <span>{enrichBanner}</span>
          <button type="button" onClick={() => setEnrichBanner(null)} className="text-[10px] underline cursor-pointer">
            FERMER
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-[#e5e5e5] p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer boutique, dirigeant, email, Monaco, macro..."
              className="sq-input w-full pl-8"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="sq-input min-w-[210px]"
          >
            <option value="all">TOUTES CATÉGORIES ({items.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} ({stats.catCounts[c] || 0})
              </option>
            ))}
          </select>

          <select
            value={hubFilter}
            onChange={(e) => setHubFilter(e.target.value)}
            className="sq-input min-w-[150px]"
          >
            <option value="all">TOUS HUBS</option>
            {hubs.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setOnlyDirectEmail(!onlyDirectEmail)}
            className={`sq-btn py-1 px-2.5 text-[10px] ${
              onlyDirectEmail ? 'bg-[#16a34a] text-white border-[#16a34a]' : ''
            }`}
          >
            AVEC EMAIL ({stats.emailCount} · {stats.verifiedCount} VÉRIFIÉS)
          </button>
          <button
            type="button"
            onClick={() => setOnlyWithPeople(!onlyWithPeople)}
            className={`sq-btn py-1 px-2.5 text-[10px] ${
              onlyWithPeople ? 'sq-btn-primary' : ''
            }`}
          >
            DÉCIDEURS / RH ({stats.peopleCount})
          </button>
          <button
            type="button"
            onClick={() => setOnlyNoLogin(!onlyNoLogin)}
            className={`sq-btn py-1 px-2.5 text-[10px] ${
              onlyNoLogin ? 'sq-btn-primary' : ''
            }`}
          >
            SANS LOGIN / DIRECT ({stats.noLoginCount})
          </button>
          <button
            type="button"
            onClick={() => setHideTracked(!hideTracked)}
            className={`sq-btn py-1 px-2.5 text-[10px] ${
              hideTracked ? 'sq-btn-primary' : ''
            }`}
          >
            MASQUER POSTULÉES
          </button>
          <span className="text-[11px] text-[#6b7280] tabular-nums ml-2">
            {filtered.length} cibles affichées
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-2 py-1 text-[10px] font-semibold border cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-black text-white border-black'
                : 'bg-[#fafafa] text-[#6b7280] border-[#e5e5e5] hover:border-black'
            }`}
          >
            TOUTES ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
              className={`px-2 py-1 text-[10px] font-semibold border cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-[#6b7280] border-[#e5e5e5] hover:border-black'
              }`}
            >
              {cat.toUpperCase()} ({stats.catCounts[cat] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Boutiques Grid */}
      {loading ? (
        <div className="sq-card p-10 text-center text-[12px] text-[#6b7280]">
          Chargement des boutiques Wealth Management, Asset Management &amp; Hedge Funds...
        </div>
      ) : filtered.length === 0 ? (
        <div className="sq-card p-10 text-center text-[12px] text-[#6b7280]">
          Aucune boutique ne correspond à ces filtres.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => {
            const activeEmail = b.best_email || b.spontaneous_email || null;
            const isVerified = b.email_confidence === 'verified_site';
            const isInferred = b.email_confidence === 'pattern_inferred';

            return (
              <div key={b.id} className="sq-card p-4 flex flex-col justify-between gap-3">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#e5e5e5] pb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#6b7280]">
                      {b.category}
                    </span>
                    <div className="flex items-center gap-1">
                      {isVerified && (
                        <span className="text-[8.5px] font-bold uppercase px-1.5 py-0.5 bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30">
                          EMAIL VÉRIFIÉ
                        </span>
                      )}
                      {isInferred && (
                        <span className="text-[8.5px] font-bold uppercase px-1.5 py-0.5 bg-[#f59e0b]/15 text-[#b45309] border border-[#f59e0b]/40">
                          FORMAT DÉDUIT
                        </span>
                      )}
                      <span
                        className={`text-[8.5px] font-bold uppercase px-1.5 py-0.5 border ${
                          b.no_login
                            ? 'bg-white text-[#111818] border-[#e5e5e5]'
                            : 'bg-[#fafafa] text-[#9ca3af] border-[#e5e5e5]'
                        }`}
                      >
                        {b.no_login ? 'SANS LOGIN' : b.ats_platform.toUpperCase()}
                      </span>
                      {b.is_tracked && (
                        <span className="text-[8.5px] font-bold uppercase px-1.5 py-0.5 bg-[#16a34a] text-white border border-[#16a34a]">
                          POSTULÉ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[14.5px] font-bold text-[#111818]">{b.name}</h3>
                    <span className="text-[11px] font-semibold text-[#6b7280] shrink-0">
                      {b.location}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-[#111818]">
                    {b.target_role}
                  </div>

                  {/* Discovered Best Email Box */}
                  {activeEmail && (
                    <div className="flex items-center justify-between gap-2 bg-white border border-[#e5e5e5] px-2.5 py-1.5 text-[11px]">
                      <div className="truncate font-mono text-[#111818]" title={activeEmail}>
                        {activeEmail}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(activeEmail, `${b.id}_main`)}
                        className="text-[10px] font-bold text-[#6b7280] hover:text-black shrink-0 cursor-pointer flex items-center gap-1"
                        title="Copier cet email"
                      >
                        {copiedId === `${b.id}_main` ? (
                          <Check className="w-3 h-3 text-[#16a34a]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Discovered Decision Makers & LinkedIn Profiles */}
                  {b.key_people && b.key_people.length > 0 && (
                    <div className="bg-white border border-[#e5e5e5] p-2.5 space-y-1.5">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-[#6b7280] flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>DÉCIDEURS &amp; RH IDENTIFIÉS</span>
                      </div>
                      {b.key_people.slice(0, 3).map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-[10.5px] border-t border-[#f4f4f5] pt-1 first:border-t-0 first:pt-0">
                          <div className="min-w-0">
                            <span className="font-semibold text-[#111818]">{p.name}</span>
                            <span className="text-[#6b7280]"> · {p.role}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {p.linkedin_url && (
                              <a
                                href={p.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-1.5 py-0.5 border border-[#e5e5e5] hover:border-black text-[9px] font-bold text-[#111818]"
                                title={`Profil LinkedIn de ${p.name}`}
                              >
                                IN
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => onColdApply(toSyntheticOffer(b, p))}
                              className="px-1.5 py-0.5 border border-black bg-black text-white text-[9px] font-bold cursor-pointer"
                              title={`Générer mail personnalisé pour ${p.name}`}
                            >
                              CIBLER
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-[#4b5563] leading-relaxed bg-white border border-[#e5e5e5] p-2.5">
                    {b.leo_fit_angle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2.5 border-t border-[#e5e5e5]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onColdApply(toSyntheticOffer(b))}
                      className="sq-btn sq-btn-primary py-1 px-2 text-[10px]"
                      title="Générer le mail calibré + lettre (sans localhost) + CV routé"
                    >
                      <Send className="w-3 h-3" />
                      POSTULER À CHAUD
                    </button>
                    {activeEmail && (
                      <a
                        href={`mailto:${activeEmail}?subject=${encodeURIComponent(
                          `Candidature Spontanée Stage Juin 2027 - ${b.target_role} - Léo Lombardini (EDHEC)`
                        )}`}
                        className="sq-btn py-1 px-2 text-[10px] border-[#16a34a] text-[#16a34a]"
                        title={`Ouvrir mailto vers ${activeEmail}`}
                      >
                        <Mail className="w-3 h-3" />
                        MAIL
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {(b.company_linkedin_url || b.linkedin_search_url) && (
                      <a
                        href={b.company_linkedin_url || b.linkedin_search_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sq-btn py-1 px-1.5 text-[10px]"
                        title={
                          b.company_linkedin_url
                            ? 'Page LinkedIn officielle'
                            : 'Rechercher les décideurs / RH sur LinkedIn'
                        }
                      >
                        <span className="font-bold text-[9px] leading-none">IN</span>
                      </a>
                    )}
                    <a
                      href={b.careers_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sq-btn py-1 px-2 text-[10px]"
                      title="Ouvrir le site / portail officiel"
                    >
                      <ExternalLink className="w-3 h-3" />
                      PORTAIL
                    </a>
                    {!b.is_tracked && (
                      <button
                        type="button"
                        onClick={() => onQuickTrackBoutique(b)}
                        className="sq-btn py-1 px-1.5 text-[10px]"
                        title="Enregistrer comme postulé dans le Tracker"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
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
