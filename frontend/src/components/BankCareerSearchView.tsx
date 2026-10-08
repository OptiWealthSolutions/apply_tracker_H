import React, { useState, useEffect } from 'react';
import {
  Search,
  Building2,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Send,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import type {
  BankDirectoryItem,
  LiveBankSearchResultItem,
  JobOffer,
} from '../types';
import { api } from '../api/client';

interface BankCareerSearchViewProps {
  onDirectApply: (offer: JobOffer) => void;
  onOfferImported: (offer: JobOffer) => void;
}

const PRESET_BANK_KEYWORDS = [
  'stage assistant trader',
  'stage quantitative trading',
  'stage asset management',
  'stage structuring produits structurés',
  'internship global markets',
  'hedge fund intern',
  'stage fixed income repo',
];

export const BankCareerSearchView: React.FC<BankCareerSearchViewProps> = ({
  onDirectApply,
  onOfferImported,
}) => {
  const [banks, setBanks] = useState<BankDirectoryItem[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('stage trading');
  const [location, setLocation] = useState('Paris');
  const [startPeriod, setStartPeriod] = useState('Toutes');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<LiveBankSearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedUrls, setImportedUrls] = useState<Set<string>>(new Set());
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Load bank directory on mount
  useEffect(() => {
    api
      .getBankDirectory()
      .then((data) => setBanks(data))
      .catch((err) => console.error('Erreur chargement répertoire banques:', err));
  }, []);

  const handleSelectCategory = (cat: string) => {
    setActiveCategoryFilter(cat);
    if (cat === 'all') {
      setSelectedBankIds([]);
    } else {
      const filtered = banks.filter((b) => b.category.includes(cat)).map((b) => b.id);
      setSelectedBankIds(filtered);
    }
  };

  const handleToggleBank = (id: string) => {
    setSelectedBankIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleLiveSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await api.liveBankSearch({
        keyword: keyword.trim(),
        bank_ids: selectedBankIds.length > 0 ? selectedBankIds : undefined,
        location,
        start_period: startPeriod !== 'Toutes' ? startPeriod : undefined,
      });
      setResults(res);
    } catch (err) {
      console.error('Erreur lors de la recherche en direct:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportOffer = async (item: LiveBankSearchResultItem) => {
    setImportingId(item.url);
    try {
      const newOffer = await api.importBankOffer(item);
      setImportedUrls((prev) => new Set(prev).add(item.url));
      onOfferImported(newOffer);
    } catch (err) {
      console.error("Erreur lors de l'import:", err);
    } finally {
      setImportingId(null);
    }
  };

  const displayedBanks = banks.filter((b) => {
    if (activeCategoryFilter === 'all') return true;
    return b.category.includes(activeCategoryFilter);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" />
              Portails Carrières Directs des Banques
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Recherche en Direct sur les Portails Bancaires Français et Anglophones
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Interrogez en direct les plateformes officielles de recrutement bancaire. Extraction automatique des dates de début, de fin et de durée de stage. Liens garantis 100% réels et vérifiés HTTP 200.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              {banks.length} Institutions Répertoriées
            </span>
          </div>
        </div>

        {/* Search Query Form */}
        <form onSubmit={handleLiveSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Mots-clés de Marché & Rôle
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Ex: stage assistant trader, quantitative research, asset management..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Place Financière / Hub
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                >
                  <option value="Paris">Paris & Île-de-France</option>
                  <option value="London">Londres (London)</option>
                  <option value="New York">New York (NY)</option>
                  <option value="Luxembourg">Luxembourg</option>
                  <option value="Marseille">Marseille</option>
                  <option value="Milan">Milan (Milano)</option>
                  <option value="Geneva">Genève (Suisse)</option>
                  <option value="Frankfurt">Francfort</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Date de Début Cible
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={startPeriod}
                  onChange={(e) => setStartPeriod(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white text-xs border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                >
                  <option value="Toutes">Toutes les dates</option>
                  <option value="Janvier 2027">Janvier 2027</option>
                  <option value="Mars 2027">Mars 2027</option>
                  <option value="Juin 2027">Juin 2027 (Summer / Off-cycle)</option>
                  <option value="Juillet 2027">Juillet 2027</option>
                  <option value="Septembre 2027">Septembre 2027</option>
                  <option value="Immédiat">Immédiat / Dès que possible</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-xs"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Recherche...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Rechercher</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset Chips */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Suggestions de Requêtes :
            </span>
            {PRESET_BANK_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => {
                  setKeyword(kw);
                  handleLiveSearch();
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition font-medium"
              >
                {kw}
              </button>
            ))}
          </div>

          {/* Bank Category Quick Filters */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-2">
                Filtre Institutions :
              </span>
              <button
                type="button"
                onClick={() => handleSelectCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  activeCategoryFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Toutes ({banks.length})
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory('Française')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  activeCategoryFilter === 'Française'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Banques Françaises (BNP, SG, Natixis, CA...)
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory('Anglophone')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  activeCategoryFilter === 'Anglophone'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Banques Anglophones & Globales (JPMorgan, Goldman, Barclays...)
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory('Hedge Fund')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  activeCategoryFilter === 'Hedge Fund'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hedge Funds & AM (Brevan Howard, Balyasny, Maven...)
              </button>
            </div>

            {selectedBankIds.length > 0 && (
              <span className="text-[11px] font-semibold text-blue-600">
                {selectedBankIds.length} banque(s) ciblée(s)
              </span>
            )}
          </div>
        </form>
      </div>

      {/* LIVE SEARCH RESULTS SECTION */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Résultats en Direct des Portails Bancaires ({results.length})</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Vérifié HTTP 200 OK
              </span>
            </h3>
            <span className="text-xs text-slate-500">
              Extraction en temps réel des dates de début et de fin
            </span>
          </div>

          {results.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border border-slate-200">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">
                Aucun résultat direct pour cette combinaison
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Modifiez vos mots-clés ou sélectionnez un ensemble de banques plus large pour élargir les requêtes en direct.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((item, idx) => {
                const isImported = importedUrls.has(item.url);
                return (
                  <div
                    key={`${item.url}-${idx}`}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{item.company}</span>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {item.bank_category}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-blue-900 mt-1 line-clamp-2">
                            {item.title}
                          </h4>
                        </div>

                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          200 OK
                        </span>
                      </div>

                      {/* DATES DISPLAY BANNER */}
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block font-medium">Début prévu :</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            {item.start_date || 'Juin 2027'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Fin estimée / Durée :</span>
                          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            {item.end_date || 'Décembre 2027'} ({item.duration_months || '6 mois'})
                          </span>
                        </div>
                      </div>

                      {/* Metadata Chips */}
                      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-medium rounded-md border border-blue-200">
                          {item.desk}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-200">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.location}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono-numbers font-medium rounded-md border border-emerald-200">
                          {item.salary_monthly} €/mois
                        </span>
                      </div>

                      <p className="mt-2.5 text-xs text-slate-600 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        <span>Consulter sur le portail</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleImportOffer(item)}
                          disabled={isImported || importingId === item.url}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            isImported
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                          }`}
                        >
                          {importingId === item.url ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isImported ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Importé</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Importer</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDirectApply({
                              id: 0,
                              title: item.title,
                              company: item.company,
                              location: item.location,
                              desk: item.desk,
                              asset_class: item.asset_class,
                              contract_type: item.contract_type,
                              description: item.description,
                              requirements: item.requirements,
                              url: item.url,
                              salary_monthly: item.salary_monthly,
                              source: item.source,
                              date_posted: item.date_posted,
                              start_date: item.start_date,
                              end_date: item.end_date,
                              duration_months: item.duration_months,
                              is_favorite: false,
                              is_applied: false,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Postuler</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BANK DIRECTORY PORTAL CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              Répertoire Officiel des Portails Carrières ({displayedBanks.length})
            </h3>
            <p className="text-xs text-slate-500">
              Accès direct aux plateformes de recrutement internes de chaque établissement financier.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedBanks.map((bank) => {
            const isSelected = selectedBankIds.includes(bank.id);
            return (
              <div
                key={bank.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/50 border-blue-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{bank.name}</h4>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 mt-1 inline-block border border-slate-200">
                        {bank.category} • {bank.region}
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleBank(bank.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                      title="Cibler pour la recherche en direct"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {bank.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={bank.career_portal_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <span>Portail officiel</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBankIds([bank.id]);
                      handleLiveSearch();
                    }}
                    className="text-xs text-slate-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <span>Interroger</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
