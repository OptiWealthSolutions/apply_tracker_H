import React, { useState } from 'react';
import {
  Search,
  Globe,
  ExternalLink,
  Plus,
  Send,
  Bookmark,
  Building,
  MapPin,
  Link as LinkIcon,
  CheckCircle,
  Filter,
} from 'lucide-react';
import type { JobOffer } from '../types';

interface JobScraperViewProps {
  offers: JobOffer[];
  onScrapeSearch: (keywords: string, location: string) => Promise<void>;
  onScrapeUrl: (url: string) => Promise<void>;
  onAddToTracker: (offer: JobOffer) => void;
  onDirectApply: (offer: JobOffer) => void;
  onToggleFavorite: (id: number) => void;
  isScraping: boolean;
}

const PRESET_QUERIES = [
  'Stage Assistant Trader Equity Derivatives Paris',
  'Stage Quantitative Research Trading Python',
  'Stage Structuring Produits Structurés Cross Asset',
  'Stage Sales FICC Fixed Income Taux Change',
  'Stage Assistant Trader ETF Market Making',
  'Stage Risques de Marché Stress Testing',
];

export const JobScraperView: React.FC<JobScraperViewProps> = ({
  offers,
  onScrapeSearch,
  onScrapeUrl,
  onAddToTracker,
  onDirectApply,
  onToggleFavorite,
  isScraping,
}) => {
  const [keywords, setKeywords] = useState('stage assistant trader paris');
  const [location, setLocation] = useState('Paris');
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);
  const [deskFilter, setDeskFilter] = useState('all');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim()) return;
    onScrapeSearch(keywords, location);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setUrlLoading(true);
    try {
      await onScrapeUrl(customUrl);
      setCustomUrl('');
      setShowUrlInput(false);
    } finally {
      setUrlLoading(false);
    }
  };

  const filteredOffers = offers.filter((o) => {
    if (deskFilter === 'all') return true;
    return o.desk === deskFilter;
  });

  const uniqueDesks = Array.from(new Set(offers.map((o) => o.desk))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* SCRAPING COMMAND PANEL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Scraper d'Offres de Stage via Mots-Clés & Google
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Recherchez et importez automatiquement les annonces de stages publiées sur les plateformes financières et moteurs de recherche.
            </p>
          </div>
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 self-start md:self-auto"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            {showUrlInput ? 'Masquer import URL' : 'Importer une URL spécifique'}
          </button>
        </div>

        {/* Custom URL Importer */}
        {showUrlInput && (
          <form
            onSubmit={handleUrlSubmit}
            className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 flex items-center gap-2"
          >
            <input
              type="url"
              required
              placeholder="Collez l'URL de l'annonce (LinkedIn, eFinancialCareers, BNP, SG, WTTJ...)"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={urlLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
            >
              {urlLoading ? 'Extraction...' : 'Extraire & Ajouter'}
            </button>
          </form>
        )}

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ex: stage assistant trader flow, structuring quant, fixed income analyst..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="sm:w-44">
            <input
              type="text"
              placeholder="Lieu (Paris, Londres...)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={isScraping}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 shrink-0"
          >
            {isScraping ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Scraping en cours...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Lancer le Scraper</span>
              </>
            )}
          </button>
        </form>

        {/* Preset Query Chips */}
        <div className="pt-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Recherches Spécialisées Finance de Marché :
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_QUERIES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setKeywords(preset);
                  onScrapeSearch(preset, location);
                }}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 font-medium transition"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS LISTING */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Offres Détectées ({filteredOffers.length})
            </h3>
            <p className="text-xs text-slate-500">
              Toutes les offres sauvegardées localement dans votre base SQLite.
            </p>
          </div>

          {uniqueDesks.length > 0 && (
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={deskFilter}
                onChange={(e) => setDeskFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tous les desks ({offers.length})</option>
                {uniqueDesks.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filteredOffers.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-800">Aucune offre trouvée</div>
            <p className="text-xs text-slate-500 mt-1">
              Lancez une recherche ci-dessus avec vos mots-clés de marché.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                {/* Header & Bank */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{offer.company}</span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {offer.source}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-blue-900 mt-1 line-clamp-2">
                        {offer.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => onToggleFavorite(offer.id)}
                      className={`p-1.5 rounded-lg border transition ${
                        offer.is_favorite
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'
                      }`}
                      title="Sauvegarder en favori"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Metadata Chips */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-medium rounded-md border border-blue-200">
                      {offer.desk}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-200">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {offer.location}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-200">
                      {offer.contract_type}
                    </span>
                    {offer.salary_monthly && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono-numbers font-medium rounded-md border border-emerald-200">
                        {offer.salary_monthly} €/mois
                      </span>
                    )}
                  </div>

                  {/* Description snippet */}
                  <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {offer.description}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  {offer.url ? (
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1"
                    >
                      <span>Voir annonce</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 font-mono-numbers">
                      {offer.date_posted || 'Récent'}
                    </span>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onAddToTracker(offer)}
                      disabled={offer.is_applied}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        offer.is_applied
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {offer.is_applied ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Déjà au tracker</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter au tracker</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onDirectApply(offer)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Postuler</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
