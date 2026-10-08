import React, { useState } from 'react';
import {
  Sparkles,
  Compass,
  Sliders,
  Send,
  Plus,
  ExternalLink,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import type { RecommendationResponse, RecommendationItem, JobOffer } from '../types';

interface KnnRecommenderViewProps {
  recommendations: RecommendationResponse | null;
  isLoading: boolean;
  onOpenPreferences: () => void;
  onAddToTracker: (offer: JobOffer) => void;
  onDirectApply: (offer: JobOffer) => void;
  onRefreshKnn: () => void;
}

export const KnnRecommenderView: React.FC<KnnRecommenderViewProps> = ({
  recommendations,
  isLoading,
  onOpenPreferences,
  onAddToTracker,
  onDirectApply,
  onRefreshKnn,
}) => {
  const [activeTab, setActiveTab] = useState<'serendipity' | 'direct'>('serendipity');

  if (isLoading) {
    return (
      <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-sm font-bold text-slate-800">
          Calcul du Plus Proche Voisin (KNN) & Analyse Vectorielle...
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Projection TF-IDF des compétences, calcul de distance cosinus et identification des desks adjacents à forte valeur ajoutée.
        </p>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
        <Compass className="w-12 h-12 text-blue-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Aucune recommandation disponible</h3>
        <p className="text-xs text-slate-500 mt-1">
          Renseignez vos préférences dans le formulaire pour initialiser l'algorithme KNN.
        </p>
        <button
          onClick={onOpenPreferences}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
        >
          Configurer mes préférences
        </button>
      </div>
    );
  }

  const { top_direct_matches, serendipity_gems, profile_summary } = recommendations;

  const currentItems: RecommendationItem[] =
    activeTab === 'serendipity' ? serendipity_gems : top_direct_matches;

  return (
    <div className="space-y-6">
      {/* Banner & Algorithm Explanation */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-[11px] font-semibold border border-blue-400/30">
              <Compass className="w-3.5 h-3.5" />
              <span>Algorithme KNN & Découverte Latente</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight">
              Conseiller Intelligent de Stages de Marché
            </h2>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Basé sur la distance cosinus des compétences quantitatives, notre modèle identifie à la fois vos cibles exactes et des <span className="font-semibold text-white">pépites d'opportunités sur des desks adjacents</span> que vous n'auriez pas spontanément recherchées.
            </p>
            <div className="pt-1 text-[11px] text-blue-200/80 font-mono">
              Profil actif : {profile_summary}
            </div>
          </div>

          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={onOpenPreferences}
              className="px-4 py-2 bg-white text-blue-900 font-semibold text-xs rounded-xl shadow-xs hover:bg-blue-50 transition flex items-center justify-center gap-2"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Modifier Préférences</span>
            </button>
            <button
              onClick={onRefreshKnn}
              className="px-4 py-2 bg-blue-700/60 hover:bg-blue-700 text-white font-medium text-xs rounded-xl border border-blue-500/30 transition text-center"
            >
              Recalculer les voisins
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Serendipity vs Direct */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('serendipity')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'serendipity'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pépites Découverte Hors Top ({serendipity_gems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('direct')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'direct'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Top Correspondances Directes ({top_direct_matches.length})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block">
          {activeTab === 'serendipity'
            ? 'Desks adjacents partageant les mêmes compétences clés'
            : 'Correspondance la plus stricte avec vos filtres déclarés'}
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {currentItems.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">Aucun résultat dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentItems.map(({ offer, similarity_score, is_serendipity_gem, match_reasons, desk_adjacency_tag }) => (
            <div
              key={offer.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between ${
                is_serendipity_gem
                  ? 'border-blue-200 hover:border-blue-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header with Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{offer.company}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {offer.location}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 mt-1 line-clamp-2">
                      {offer.title}
                    </h4>
                  </div>

                  {/* Similarity Score Pill */}
                  <div className="text-right shrink-0">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                        is_serendipity_gem
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {Math.round(similarity_score * 100)}% Match
                    </div>
                  </div>
                </div>

                {/* Desk & Metadata */}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-md border border-slate-200">
                    {offer.desk}
                  </span>
                  {offer.salary_monthly && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono-numbers font-medium rounded-md border border-emerald-200">
                      {offer.salary_monthly} €/mois
                    </span>
                  )}
                  {is_serendipity_gem && desk_adjacency_tag && (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-medium rounded-md border border-indigo-200">
                      Adjacence : {desk_adjacency_tag}
                    </span>
                  )}
                </div>

                {/* Description snippet */}
                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {offer.description}
                </p>

                {/* KNN Explainability Box */}
                <div className="mt-3.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {is_serendipity_gem ? 'Pourquoi ce voisin suggéré ?' : 'Points de correspondance :'}
                  </div>
                  <ul className="space-y-1">
                    {match_reasons.map((reason, idx) => (
                      <li key={idx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                {offer.url ? (
                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                  >
                    <span>Fiche complète</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Offre locale</span>
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
                        <span>Au tracker</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Suivre</span>
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
  );
};
